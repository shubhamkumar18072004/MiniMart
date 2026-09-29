const Vendor = require("../models/Vendor");
const Order = require("../models/Order");
const Product = require("../models/Product");
const VendorFinanceTransaction = require("../models/VendorFinanceTransaction");
const bcrypt = require("bcryptjs");

const DEFAULT_COMMISSION_RATE = 10;

const getPeriodStart = (period) => {
  const now = new Date();
  if (period === "yearly") return new Date(now.getFullYear(), 0, 1);
  if (period === "monthly")
    return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const calculateVendorRevenueFromOrder = (orderDoc, vendorId) => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  const vendorIdStr = String(vendorId);
  const items = Array.isArray(order.items) ? order.items : [];
  const vendorItems = items.filter(
    (item) => String(item?.vendorId || "") === vendorIdStr,
  );

  if (vendorItems.length > 0) {
    return vendorItems.reduce((sum, item) => {
      const price = Number(item?.price) || 0;
      const qty = Number(item?.qty) || 0;
      return sum + price * qty;
    }, 0);
  }

  if (String(order?.vendorId || "") === vendorIdStr) {
    return Number(order?.totalAmount) || 0;
  }

  return 0;
};

const getVendorFinancials = async (vendorId, period = "today") => {
  const validPeriod = ["today", "monthly", "yearly"].includes(period)
    ? period
    : "today";
  const fromDate = getPeriodStart(validPeriod);

  const vendorInfo = await Vendor.findById(vendorId).lean();
  const commissionRate = Number(
    vendorInfo?.commissionRate ?? DEFAULT_COMMISSION_RATE,
  );

  const deliveredOrders = await Order.find({
    status: "Delivered",
    createdAt: { $gte: fromDate },
    $or: [
      { vendorId: String(vendorId) },
      { "items.vendorId": String(vendorId) },
    ],
  }).lean();

  const grossEarnings = deliveredOrders.reduce(
    (sum, order) => sum + calculateVendorRevenueFromOrder(order, vendorId),
    0,
  );

  const adminCommission = grossEarnings * (commissionRate / 100);
  const vendorNetBeforeWithdraw = grossEarnings - adminCommission;

  const transactions = await VendorFinanceTransaction.find({
    vendorId,
    createdAt: { $gte: fromDate },
  }).lean();

  const commissionSent = transactions
    .filter((t) => t.type === "commission_sent")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const withdrawnAmount = transactions
    .filter((t) => t.type === "withdrawal")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const adminNetCommission = Math.max(adminCommission - commissionSent, 0);
  const vendorNetAfterWithdraw = Math.max(
    vendorNetBeforeWithdraw - withdrawnAmount,
    0,
  );

  return {
    period: validPeriod,
    grossEarnings,
    commissionRate,
    adminCommission,
    vendorNetBeforeWithdraw,
    commissionSent,
    withdrawnAmount,
    adminNetCommission,
    vendorNetAfterWithdraw,
  };
};

// Register Vendor
exports.registerVendor = async (req, res) => {
  try {
    const { shopName, shopkeeperName, mobileNumber, email, password, address } =
      req.body;
    const existing = await Vendor.findOne({ mobileNumber });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Vendor already exists!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newVendor = new Vendor({
      shopName,
      shopkeeperName,
      mobileNumber,
      email,
      password: hashedPassword,
      address,
    });
    await newVendor.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Vendor registered! Approval pending from admin.",
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Login Vendor
exports.loginVendor = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    const vendor = await Vendor.findOne({ mobileNumber });
    if (!vendor)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found!" });

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Galat password!" });

    if (vendor.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: `Vendor account is ${vendor.approvalStatus}. Admin approval required.`,
      });
    }

    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Business Summary
exports.getSummary = async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vendorOrderFilter = {
      $or: [
        { vendorId: String(vendorId) },
        { "items.vendorId": String(vendorId) },
      ],
    };

    const totalOrders = await Order.countDocuments(vendorOrderFilter);
    const pendingOrders = await Order.countDocuments({
      ...vendorOrderFilter,
      status: "Pending",
    });
    const deliveredOrders = await Order.countDocuments({
      ...vendorOrderFilter,
      status: "Delivered",
    });
    const todayDelivered = await Order.find({
      ...vendorOrderFilter,
      status: "Delivered",
      createdAt: { $gte: today },
    });
    const todaySales = todayDelivered.reduce((acc, curr) => {
      return acc + calculateVendorRevenueFromOrder(curr, vendorId);
    }, 0);
    const lowStockCount = await Product.countDocuments({
      vendor: vendorId,
      inStock: false,
    });

    res.json({
      success: true,
      todaySales,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      lowStockCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Earnings & commission by period
exports.getEarnings = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { period = "today" } = req.query;
    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID required" });
    }

    const financials = await getVendorFinancials(vendorId, period);
    res.json({
      success: true,
      ...financials,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Vendor sends admin commission (for selected period)
exports.sendAdminCommission = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { period = "today", amount } = req.body;
    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID required" });
    }

    const financials = await getVendorFinancials(vendorId, period);
    const dueCommission = Math.max(financials.adminNetCommission, 0);
    const sendAmount = amount ? Number(amount) : dueCommission;

    if (sendAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "No commission due to send." });
    }

    if (sendAmount > dueCommission) {
      return res
        .status(400)
        .json({ success: false, message: "Amount exceeds due commission." });
    }

    await VendorFinanceTransaction.create({
      vendorId,
      type: "commission_sent",
      period: financials.period,
      amount: sendAmount,
      status: "paid",
      paidAt: new Date(),
      note: "Vendor sent admin commission",
    });

    const updatedFinancials = await getVendorFinancials(vendorId, period);
    res.json({
      success: true,
      message: "Admin commission sent.",
      ...updatedFinancials,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Vendor withdraws available net earning (for selected period)
exports.withdrawVendorEarnings = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { period = "today", amount } = req.body;
    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID required" });
    }

    const financials = await getVendorFinancials(vendorId, period);
    const availableAmount = Math.max(financials.vendorNetAfterWithdraw, 0);
    const withdrawAmount = amount ? Number(amount) : availableAmount;

    if (withdrawAmount <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "No amount available for withdrawal.",
        });
    }

    if (withdrawAmount > availableAmount) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Withdraw amount exceeds available balance.",
        });
    }

    await VendorFinanceTransaction.create({
      vendorId,
      type: "withdrawal",
      period: financials.period,
      amount: withdrawAmount,
      status: "pending",
      note: "Vendor withdrawal request",
    });

    const updatedFinancials = await getVendorFinancials(vendorId, period);
    res.json({
      success: true,
      message: "Withdrawal successful.",
      ...updatedFinancials,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
