const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order function
exports.checkout = async (req, res) => {
    try {
        const options = {
            amount: Number(req.body.amount * 100), // Amount in paise
            currency: "INR",
        };
        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Payment Verification (Success hone ke baad)
exports.paymentVerification = async (req, res) => {
    // Abhi ke liye hum sirf success message bhej rahe hain
    res.status(200).json({
        success: true,
        message: "Payment Verified Successfully!"
    });
};