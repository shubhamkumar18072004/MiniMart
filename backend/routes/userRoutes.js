const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("../middleware/upload"); // Image upload ke liye

router.post("/register", upload.single("profilePic"), userController.registerUser);
router.post("/verify-otp", userController.verifyOtp);
router.post("/login", userController.loginUser);

module.exports = router;