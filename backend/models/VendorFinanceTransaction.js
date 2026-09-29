const mongoose = require("mongoose");

const vendorFinanceTransactionSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true
        },
        type: {
            type: String,
            enum: ["commission_sent", "withdrawal"],
            required: true
        },
        period: {
            type: String,
            enum: ["today", "monthly", "yearly"],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: ["pending", "paid"],
            default: "pending"
        },
        paidAt: {
            type: Date,
            default: null
        },
        note: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("VendorFinanceTransaction", vendorFinanceTransactionSchema);
