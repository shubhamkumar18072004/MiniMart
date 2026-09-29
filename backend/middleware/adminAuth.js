const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "minimart_admin_secret_change_me";

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ success: false, message: "Admin token missing." });
        }

        const decoded = jwt.verify(token, getJwtSecret());
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired admin token." });
    }
};
