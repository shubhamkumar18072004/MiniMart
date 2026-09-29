const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true },
        discountType: { type: String, enum: ["flat", "percentage"], default: "flat" },
        discountValue: { type: Number, required: true, min: 0 },
        minOrderValue: { type: Number, default: 0 },
        expiresAt: { type: Date },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("PromoCode", promoCodeSchema);
