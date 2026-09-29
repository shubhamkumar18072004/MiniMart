const User = require("../models/User");
const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");

// 1. Register User
exports.registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, mobileNumber, password } = req.body;
        const existing = await User.findOne({ mobileNumber });

        if (existing) return res.status(400).json({ success: false, message: "User already exists!" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const generatedOtp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });

        const profilePicUrl = req.file ? `http://localhost:${process.env.PORT}/uploads/${req.file.filename}` : "";

        const newUser = new User({
            firstName,
            lastName,
            email,
            mobileNumber,
            password: hashedPassword,
            profilePic: profilePicUrl,
            otp: generatedOtp
        });

        await newUser.save();
        res.status(201).json({ success: true, message: "OTP sent!", otp: generatedOtp });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 2. Verify OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;
        const user = await User.findOne({ mobileNumber });
        if (user && user.otp === otp) {
            user.isVerified = true;
            user.otp = "";
            await user.save();
            res.json({ success: true, message: "Account Verified!" });
        } else { res.status(400).json({ success: false, message: "Invalid OTP!" }); }
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 3. Login User
exports.loginUser = async (req, res) => {
    try {
        const { mobileNumber, password } = req.body;
        const user = await User.findOne({ mobileNumber });
        if (!user) return res.status(404).json({ success: false, message: "User nahi mila!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Galat password!" });

        if (!user.isVerified) return res.status(401).json({ success: false, message: "Verify OTP first!", needsVerification: true });

        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                email: user.email,
                mobileNumber: user.mobileNumber,
                profilePic: user.profilePic
            }
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};