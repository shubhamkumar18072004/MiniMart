const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.DELIVERY_JWT_SECRET || process.env.JWT_SECRET || "minimart_delivery_secret_change_me";

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ success: false, message: "Delivery login token missing." });
        }

        const decoded = jwt.verify(token, getJwtSecret());
        if (decoded.role !== "deliveryPartner" || !decoded.partnerId) {
            return res.status(401).json({ success: false, message: "Invalid delivery token." });
        }

        req.deliveryPartner = { id: decoded.partnerId };
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired delivery token." });
    }
};
