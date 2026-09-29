const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        imageUrl: { type: String, required: true },
        targetUrl: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
        priority: { type: Number, default: 0 }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
