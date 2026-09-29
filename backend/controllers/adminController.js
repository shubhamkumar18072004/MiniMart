const Order = require("../models/Order");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const Category = require("../models/Category");
const PromoCode = require("../models/PromoCode");
const Banner = require("../models/Banner");
const BulkNotification = require("../models/BulkNotification");
const bcrypt = require("bcryptjs");
const DeliveryPartner = require("../models/DeliveryPartner");
const Dispute = require("../models/Dispute");
const VendorFinanceTransaction = require("../models/VendorFinanceTransaction");

const getPeriodStart = (period) => {
    const now = new Date();
    if (period === "yearly") return new Date(now.getFullYear(), 0, 1);
    if (period === "monthly") return new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const calculateOrderGrossByVendor = (orderDoc) => {
    const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
    const result = {};
    const items = Array.isArray(order.items) ? order.items : [];

    if (items.length > 0) {
        items.forEach((item) => {
            const vendorId = String(item?.vendorId || "");
            if (!vendorId) return;
            const amount = (Number(item?.price) || 0) * (Number(item?.qty) || 0);
            result[vendorId] = (result[vendorId] || 0) + amount;
        });
    }

    if (Object.keys(result).length === 0 && order?.vendorId) {
        const vendorId = String(order.vendorId);
        result[vendorId] = Number(order.totalAmount) || 0;
    }

    return result;
};

const buildOverview = async (period = "today") => {
    const selectedPeriod = ["today", "monthly", "yearly"].includes(period) ? period : "today";
    const fromDate = getPeriodStart(selectedPeriod);

    const deliveredOrders = await Order.find({
        status: "Delivered",
        createdAt: { $gte: fromDate }
    }).lean();

    const vendorGrossMap = {};
    deliveredOrders.forEach((order) => {
        const split = calculateOrderGrossByVendor(order);
        Object.entries(split).forEach(([vendorId, amount]) => {
            vendorGrossMap[vendorId] = (vendorGrossMap[vendorId] || 0) + amount;
        });
    });

    const vendorIds = Object.keys(vendorGrossMap);
    const vendors = await Vendor.find({ _id: { $in: vendorIds } }, { shopName: 1, shopkeeperName: 1, commissionRate: 1 }).lean();
    const vendorLookup = vendors.reduce((acc, v) => {
        acc[String(v._id)] = v;
        return acc;
    }, {});

    let grossEarnings = 0;
    let expectedAdminCommission = 0;
    let vendorNetEarnings = 0;

    const vendorBreakdown = vendorIds.map((vendorId) => {
        const gross = vendorGrossMap[vendorId] || 0;
        const commissionRate = Number(vendorLookup[vendorId]?.commissionRate ?? 10);
        const commission = gross * (commissionRate / 100);
        const net = gross - commission;

        grossEarnings += gross;
        expectedAdminCommission += commission;
        vendorNetEarnings += net;

        return {
            vendorId,
            shopName: vendorLookup[vendorId]?.shopName || "Unknown Shop",
            shopkeeperName: vendorLookup[vendorId]?.shopkeeperName || "Unknown",
            commissionRate,
            grossEarnings: gross,
            adminCommission: commission,
            vendorNetEarnings: net
        };
    }).sort((a, b) => b.grossEarnings - a.grossEarnings);

    const transactions = await VendorFinanceTransaction.find({
        createdAt: { $gte: fromDate }
    }).lean();

    const adminCommissionReceived = transactions
        .filter((t) => t.type === "commission_sent")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const vendorWithdrawn = transactions
        .filter((t) => t.type === "withdrawal")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const pendingAdminCommission = Math.max(expectedAdminCommission - adminCommissionReceived, 0);
    const vendorNetPayable = Math.max(vendorNetEarnings - vendorWithdrawn, 0);

    return {
        period: selectedPeriod,
        grossEarnings,
        expectedAdminCommission,
        adminCommissionReceived,
        pendingAdminCommission,
        vendorNetEarnings,
        vendorWithdrawn,
        vendorNetPayable,
        vendorCount: vendorIds.length,
        vendorBreakdown
    };
};

// 1) Master Statistics
exports.getMasterStatistics = async (req, res) => {
    try {
        const [orders, usersCount, activeVendors, liveOrders] = await Promise.all([
            Order.find({ status: "Delivered" }).lean(),
            User.countDocuments(),
            Vendor.countDocuments({ approvalStatus: "approved" }),
            Order.countDocuments({ status: { $in: ["Pending", "Packed", "Ready for Delivery"] } })
        ]);

        const vendorMap = {};
        let totalRevenue = 0;
        let commissionEarned = 0;
        for (const order of orders) {
            const split = calculateOrderGrossByVendor(order);
            for (const [vendorId, amount] of Object.entries(split)) {
                vendorMap[vendorId] = (vendorMap[vendorId] || 0) + amount;
                totalRevenue += amount;
            }
        }

        const vendors = await Vendor.find({ _id: { $in: Object.keys(vendorMap) } }, { commissionRate: 1 }).lean();
        const lookup = vendors.reduce((acc, v) => {
            acc[String(v._id)] = Number(v.commissionRate || 10);
            return acc;
        }, {});

        Object.entries(vendorMap).forEach(([vendorId, amount]) => {
            commissionEarned += amount * ((lookup[vendorId] || 10) / 100);
        });

        res.json({
            success: true,
            totalRevenue,
            commissionEarned,
            activeVendors,
            activeUsers: usersCount,
            liveOrders
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2) Vendor Management
exports.getVendors = async (_req, res) => {
    try {
        const vendors = await Vendor.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, vendors });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateVendorApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvalStatus, approvalNote = "" } = req.body;
        if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
            return res.status(400).json({ success: false, message: "Invalid approval status." });
        }
        const vendor = await Vendor.findByIdAndUpdate(id, { approvalStatus, approvalNote }, { new: true });
        res.json({ success: true, vendor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateVendorCommission = async (req, res) => {
    try {
        const { id } = req.params;
        const commissionRate = Number(req.body.commissionRate);
        if (Number.isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
            return res.status(400).json({ success: false, message: "Invalid commission rate." });
        }
        const vendor = await Vendor.findByIdAndUpdate(id, { commissionRate }, { new: true });
        res.json({ success: true, vendor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3) Product & Inventory Control
exports.getGlobalInventory = async (_req, res) => {
    try {
        const products = await Product.find().populate("vendor", "shopName shopkeeperName").sort({ createdAt: -1 }).lean();
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateProductVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        const { isHidden, isBanned, hiddenReason = "" } = req.body;
        const product = await Product.findByIdAndUpdate(
            id,
            { isHidden: !!isHidden, isBanned: !!isBanned, hiddenReason },
            { new: true }
        );
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCategories = async (_req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ success: false, message: "Category name required." });
        const category = await Category.create({ name: name.trim() });
        res.status(201).json({ success: true, category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.toggleCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found." });
        category.isActive = !category.isActive;
        await category.save();
        res.json({ success: true, category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4) Order & Delivery Tracking + Dispute Resolution
exports.getOrdersForAdmin = async (_req, res) => {
    try {
        const orders = await Order.find().populate("deliveryPartner", "name mobileNumber").sort({ createdAt: -1 }).lean();
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.assignDeliveryPartner = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryPartnerId } = req.body;
        const order = await Order.findByIdAndUpdate(
            orderId,
            { deliveryPartner: deliveryPartnerId || null },
            { new: true }
        ).populate("deliveryPartner", "name mobileNumber");
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getDisputes = async (_req, res) => {
    try {
        const disputes = await Dispute.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, disputes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.resolveDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolutionNote = "" } = req.body;
        const dispute = await Dispute.findByIdAndUpdate(
            id,
            { status: "resolved", resolutionNote },
            { new: true }
        );
        if (dispute?.orderId) {
            await Order.findByIdAndUpdate(dispute.orderId, { disputeStatus: "resolved" });
        }
        res.json({ success: true, dispute });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5) Payout settlement
exports.markSettlementPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await VendorFinanceTransaction.findByIdAndUpdate(
            id,
            { status: "paid", paidAt: new Date() },
            { new: true }
        );
        res.json({ success: true, transaction });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 6) Marketing and Engagement
exports.getPromoCodes = async (_req, res) => {
    try {
        const promoCodes = await PromoCode.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, promoCodes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createPromoCode = async (req, res) => {
    try {
        const rawCode = String(req.body.code || "").trim();
        if (!rawCode) {
            return res.status(400).json({ success: false, message: "Promo code zaroori hai." });
        }

        let discountType = String(req.body.discountType || "flat").toLowerCase();
        if (!["flat", "percentage"].includes(discountType)) {
            discountType = "flat";
        }

        const discountStr = String(req.body.discountValue ?? "")
            .replace(/%/g, "")
            .replace(/,/g, ".")
            .trim();
        const discountValue = Number.parseFloat(discountStr);
        if (Number.isNaN(discountValue) || discountValue < 0) {
            return res.status(400).json({
                success: false,
                message: "Discount sirf number ho (e.g. 50 ya 10% ke liye bas 10 likho)."
            });
        }
        if (discountType === "percentage" && discountValue > 100) {
            return res.status(400).json({ success: false, message: "Percentage 100 se zyada nahi ho sakta." });
        }

        const minStr = String(req.body.minOrderValue ?? "").replace(/,/g, ".").trim();
        const minOrderValue = minStr === "" ? 0 : Math.max(0, Number.parseFloat(minStr) || 0);

        let expiresAt;
        const expRaw = req.body.expiresAt;
        if (expRaw && String(expRaw).trim() !== "") {
            const d = new Date(expRaw);
            if (!Number.isNaN(d.getTime())) {
                expiresAt = d;
            }
        }

        const payload = {
            code: rawCode.toUpperCase(),
            discountType,
            discountValue,
            minOrderValue,
            ...(expiresAt ? { expiresAt } : {})
        };

        const promoCode = await PromoCode.create(payload);
        res.status(201).json({ success: true, promoCode });
    } catch (err) {
        if (err?.code === 11000) {
            return res.status(400).json({ success: false, message: "Ye promo code pehle se maujood hai." });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.togglePromoCode = async (req, res) => {
    try {
        const { id } = req.params;
        const promo = await PromoCode.findById(id);
        if (!promo) return res.status(404).json({ success: false, message: "Promo not found." });
        promo.isActive = !promo.isActive;
        await promo.save();
        res.json({ success: true, promoCode: promo });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getBanners = async (_req, res) => {
    try {
        const banners = await Banner.find().sort({ priority: -1, createdAt: -1 }).lean();
        res.json({ success: true, banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createBanner = async (req, res) => {
    try {
        const { title, imageUrl, targetUrl = "", priority = 0 } = req.body;
        const banner = await Banner.create({ title, imageUrl, targetUrl, priority: Number(priority) || 0 });
        res.status(201).json({ success: true, banner });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.toggleBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);
        if (!banner) return res.status(404).json({ success: false, message: "Banner not found." });
        banner.isActive = !banner.isActive;
        await banner.save();
        res.json({ success: true, banner });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.sendBulkNotification = async (req, res) => {
    try {
        const { audience = "all", title, message } = req.body;
        const notification = await BulkNotification.create({ audience, title, message });
        res.status(201).json({ success: true, notification });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getBulkNotifications = async (_req, res) => {
    try {
        const notifications = await BulkNotification.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getDeliveryPartners = async (_req, res) => {
    try {
        const partners = await DeliveryPartner.find().sort({ createdAt: -1 }).select("-pinHash").lean();
        res.json({ success: true, partners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addDeliveryPartner = async (req, res) => {
    try {
        const { name, mobileNumber, pin } = req.body;
        if (!pin || String(pin).length < 4) {
            return res.status(400).json({ success: false, message: "PIN kam se kam 4 digit ka ho." });
        }
        const normalizedMobile = String(mobileNumber || "").replace(/\D/g, "");
        const pinHash = await bcrypt.hash(String(pin), 10);
        const partner = await DeliveryPartner.create({
            name,
            mobileNumber: normalizedMobile || mobileNumber,
            pinHash
        });
        const safe = partner.toObject();
        delete safe.pinHash;
        res.status(201).json({ success: true, partner: safe });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Existing finance endpoints
exports.getFinanceOverview = async (req, res) => {
    try {
        const { period = "today" } = req.query;
        const overview = await buildOverview(period);
        res.json({ success: true, ...overview });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getFinanceTransactions = async (req, res) => {
    try {
        const { period = "today", type = "all" } = req.query;
        const selectedPeriod = ["today", "monthly", "yearly"].includes(period) ? period : "today";
        const fromDate = getPeriodStart(selectedPeriod);
        const filter = { createdAt: { $gte: fromDate } };
        if (type !== "all") filter.type = type;
        const transactions = await VendorFinanceTransaction.find(filter)
            .sort({ createdAt: -1 })
            .populate("vendorId", "shopName shopkeeperName mobileNumber")
            .lean();
        res.json({ success: true, transactions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.exportFinanceTransactionsCsv = async (req, res) => {
    try {
        const { period = "today", type = "all" } = req.query;
        const selectedPeriod = ["today", "monthly", "yearly"].includes(period) ? period : "today";
        const fromDate = getPeriodStart(selectedPeriod);
        const filter = { createdAt: { $gte: fromDate } };
        if (type !== "all") filter.type = type;
        const transactions = await VendorFinanceTransaction.find(filter)
            .sort({ createdAt: -1 })
            .populate("vendorId", "shopName shopkeeperName mobileNumber")
            .lean();
        const header = "Transaction ID,Date Time,Type,Status,Period,Amount,Shop Name,Shopkeeper,Mobile,Note";
        const rows = transactions.map((t) => {
            const date = new Date(t.createdAt).toISOString();
            const typeLabel = t.type === "commission_sent" ? "Commission Sent" : "Withdrawal";
            const shop = t.vendorId?.shopName || "";
            const keeper = t.vendorId?.shopkeeperName || "";
            const mobile = t.vendorId?.mobileNumber || "";
            const note = (t.note || "").replace(/,/g, " ");
            return `${t._id},${date},${typeLabel},${t.status || "pending"},${t.period},${Number(t.amount || 0).toFixed(2)},${shop},${keeper},${mobile},${note}`;
        });
        const csv = [header, ...rows].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="finance-${selectedPeriod}.csv"`);
        res.status(200).send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
