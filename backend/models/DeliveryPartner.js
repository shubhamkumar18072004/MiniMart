const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        pinHash: { type: String, default: "" },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
