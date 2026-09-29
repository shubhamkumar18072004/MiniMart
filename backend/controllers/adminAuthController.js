const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const getJwtSecret = () => process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "minimart_admin_secret_change_me";

exports.registerAdmin = async (req, res) => {
    try {
        const { fullName, email, mobileNumber, password } = req.body;
        if (!fullName || !email || !mobileNumber || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const existing = await Admin.findOne({
            $or: [{ email: email.toLowerCase() }, { mobileNumber }]
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "Admin already exists with email/mobile." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await Admin.create({
            fullName,
            email: email.toLowerCase(),
            mobileNumber,
            password: hashedPassword
        });

        res.status(201).json({
            success: true,
            message: "Admin account created.",
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                mobileNumber: admin.mobileNumber
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const { emailOrMobile, password } = req.body;
        if (!emailOrMobile || !password) {
            return res.status(400).json({ success: false, message: "Credentials are required." });
        }

        const admin = await Admin.findOne({
            $or: [{ email: String(emailOrMobile).toLowerCase() }, { mobileNumber: String(emailOrMobile) }]
        });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin account not found." });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid password." });
        }

        const token = jwt.sign(
            {
                adminId: admin._id,
                email: admin.email
            },
            getJwtSecret(),
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Admin login success.",
            token,
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                mobileNumber: admin.mobileNumber
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
