const mongoose = require("mongoose");

const bulkNotificationSchema = new mongoose.Schema(
    {
        audience: { type: String, enum: ["users", "vendors", "all"], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("BulkNotification", bulkNotificationSchema);
