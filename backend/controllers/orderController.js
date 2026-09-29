const Order = require("../models/Order");
const Dispute = require("../models/Dispute");
const Vendor = require("../models/Vendor");
const { computeSubtotalFromItems, resolvePromoForSubtotal } = require("../utils/promoDiscount");

const calculateVendorRevenueFromOrder = (orderDoc, vendorId) => {
    const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
    const vendorIdStr = String(vendorId);
    const items = Array.isArray(order.items) ? order.items : [];
    const vendorItems = items.filter((item) => String(item?.vendorId || "") === vendorIdStr);

    if (vendorItems.length > 0) {
        return vendorItems.reduce((sum, item) => {
            const price = Number(item?.price) || 0;
            const qty = Number(item?.qty) || 0;
            return sum + (price * qty);
        }, 0);
    }

    if (String(order?.vendorId || "") === vendorIdStr) {
        return Number(order?.totalAmount) || 0;
    }

    return 0;
};

/** Vendor totalSales bump — call only when order first becomes Delivered */
exports.applyDeliveredVendorSales = async (orderDoc) => {
    const existingOrder = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
    const vendorIds = new Set();
    if (existingOrder.vendorId) vendorIds.add(String(existingOrder.vendorId));
    (existingOrder.items || []).forEach((item) => {
        if (item?.vendorId) vendorIds.add(String(item.vendorId));
    });

    for (const vendorId of vendorIds) {
        const revenue = calculateVendorRevenueFromOrder(existingOrder, vendorId);
        if (revenue > 0) {
            await Vendor.findByIdAndUpdate(vendorId, { $inc: { totalSales: revenue } });
        }
    }
};

// 1. Place New Order (Updated to include vendorId)
exports.placeOrder = async (req, res) => {
    try {
        const { userId, items, totalAmount, address, vendorId, phone, promoCode } = req.body;

        const subtotal = computeSubtotalFromItems(items || []);
        const roundedPaid = Math.round(Number(totalAmount) || 0);
        let promoDiscount = 0;
        let promoCodeStored = "";

        if (promoCode && String(promoCode).trim()) {
            const result = await resolvePromoForSubtotal(promoCode, subtotal);
            if (!result.ok) {
                return res.status(400).json({ success: false, message: result.message });
            }
            if (roundedPaid !== result.finalTotal) {
                return res.status(400).json({
                    success: false,
                    message: "Payable amount promo se match nahi — dubara apply karein."
                });
            }
            promoDiscount = result.discountAmount;
            promoCodeStored = result.code;
        } else if (roundedPaid !== Math.round(subtotal)) {
            return res.status(400).json({
                success: false,
                message: "Bill amount cart total se match nahi."
            });
        }

        const newOrder = new Order({
            userId,
            items,
            totalAmount: roundedPaid,
            address,
            phone,
            vendorId,
            promoCode: promoCodeStored,
            promoDiscount
        });

        await newOrder.save();
        res.status(201).json({ success: true, message: "Order placed!", order: newOrder });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
};

// 2. Get User Orders
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .populate("deliveryPartner", "name mobileNumber");
        res.json(orders);
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
};

// 3. Update Order Status (Vendor)
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const existingOrder = await Order.findById(req.params.id).lean();
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (status === "Delivered" && existingOrder.deliveryPartner) {
            return res.status(400).json({
                success: false,
                message: "Is order par delivery rider assign hai — rider dashboard se deliver karein."
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (existingOrder.status !== "Delivered" && status === "Delivered") {
            await exports.applyDeliveredVendorSales(existingOrder);
        }

        res.json({ success: true, message: "Status Updated!", order: updatedOrder });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
};

// --- 4. Get Vendor Specific Orders ---
exports.getVendorOrders = async (req, res) => {
    try {
        const { vendorId } = req.params;
        
        
        const orders = await Order.find({
            $or: [
                { vendorId: vendorId },
                { "items.vendorId": vendorId }
            ]
        })
            .populate("deliveryPartner", "name mobileNumber")
            .sort({ createdAt: -1 })
            .lean();

        res.json(orders);
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
};

// 5. Raise dispute (User/Vendor)
exports.raiseDispute = async (req, res) => {
    try {
        const { orderId, raisedBy, userId, vendorId, reason } = req.body;
        if (!orderId || !raisedBy || !reason) {
            return res.status(400).json({ success: false, message: "orderId, raisedBy and reason are required." });
        }

        const dispute = await Dispute.create({
            orderId,
            raisedBy,
            userId: userId || undefined,
            vendorId: vendorId || undefined,
            reason
        });

        await Order.findByIdAndUpdate(orderId, { disputeStatus: "open" });
        res.status(201).json({ success: true, dispute });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};