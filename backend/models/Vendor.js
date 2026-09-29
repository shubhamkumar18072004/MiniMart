const mongoose = require("mongoose");
const vendorSchema = new mongoose.Schema({
    shopName: { type: String, required: true },
    shopkeeperName: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    storeTimings: { open: { type: String, default: "09:00 AM" }, close: { type: String, default: "09:00 PM" } },
    minOrderValue: { type: Number, default: 0 },
    serviceableRadius: { type: Number, default: 5 },
    balance: { type: Number, default: 0 },
    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    approvalNote: { type: String, default: "" },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalSales: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model("Vendor", vendorSchema);