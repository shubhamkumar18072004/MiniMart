const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const DeliveryPartner = require("../models/DeliveryPartner");
const { applyDeliveredVendorSales } = require("./orderController");

const getJwtSecret = () => process.env.DELIVERY_JWT_SECRET || process.env.JWT_SECRET || "minimart_delivery_secret_change_me";

const normalizeMobile = (s) => String(s || "").replace(/\D/g, "");

exports.login = async (req, res) => {
    try {
        const { mobileNumber, pin } = req.body;
        const mobile = normalizeMobile(mobileNumber);
        if (!mobile || !pin) {
            return res.status(400).json({ success: false, message: "Mobile number aur PIN zaroori hain." });
        }

        const partner = await DeliveryPartner.findOne({ mobileNumber: mobile });
        if (!partner || !partner.isActive) {
            return res.status(401).json({ success: false, message: "Partner nahi mila ya inactive hai." });
        }

        if (!partner.pinHash) {
            return res.status(401).json({
                success: false,
                message: "PIN set nahi hai. Admin se sampark karein."
            });
        }

        const ok = await bcrypt.compare(String(pin), partner.pinHash);
        if (!ok) {
            return res.status(401).json({ success: false, message: "Galat PIN." });
        }

        const token = jwt.sign(
            { partnerId: String(partner._id), role: "deliveryPartner" },
            getJwtSecret(),
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            partner: {
                _id: partner._id,
                name: partner.name,
                mobileNumber: partner.mobileNumber
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const partnerId = req.deliveryPartner.id;
        const orders = await Order.find({ deliveryPartner: partnerId })
            .sort({ createdAt: -1 })
            .populate("userId", "firstName lastName mobileNumber")
            .lean();

        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateAssignedOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const partnerId = req.deliveryPartner.id;

        const allowed = ["Out for Delivery", "Delivered"];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Sirf ye status allowed: ${allowed.join(", ")}`
            });
        }

        const existingOrder = await Order.findById(orderId);
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order nahi mila." });
        }

        if (String(existingOrder.deliveryPartner || "") !== String(partnerId)) {
            return res.status(403).json({ success: false, message: "Ye order aapko assign nahi hai." });
        }

        if (existingOrder.status === "Delivered") {
            return res.status(400).json({ success: false, message: "Order pehle se delivered hai." });
        }

        if (status === "Out for Delivery") {
            const okFrom = ["Packed", "Ready for Delivery"];
            if (!okFrom.includes(existingOrder.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Pehle vendor ko order pack aur ready karna hoga."
                });
            }
        }

        if (status === "Delivered") {
            if (existingOrder.status !== "Out for Delivery" && existingOrder.status !== "Ready for Delivery") {
                return res.status(400).json({
                    success: false,
                    message: "Pehle 'Out for Delivery' (ya vendor ne Ready kar diya ho to seedha deliver)."
                });
            }
        }

        existingOrder.status = status;

        if (status === "Delivered") {
            await existingOrder.save();
            await applyDeliveredVendorSales(existingOrder);
            const updated = await Order.findById(orderId)
                .populate("userId", "firstName lastName mobileNumber")
                .populate("deliveryPartner", "name mobileNumber");
            return res.json({ success: true, message: "Delivered!", order: updated });
        }

        await existingOrder.save();
        const updated = await Order.findById(orderId)
            .populate("userId", "firstName lastName mobileNumber")
            .populate("deliveryPartner", "name mobileNumber");

        res.json({ success: true, message: "Status update ho gaya.", order: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
