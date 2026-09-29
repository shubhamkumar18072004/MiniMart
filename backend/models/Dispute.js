const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    // Order-based dispute (existing)
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

    // Product-based complaint (new)
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String },

    raisedBy: { type: String, enum: ["user", "vendor"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    // Complaint/Dispute Details
    type: {
      type: String,
      enum: ["complaint", "dispute"],
      default: "complaint",
    },
    category: {
      type: String,
      enum: [
        "Quality Issue",
        "Wrong Product",
        "Damaged Product",
        "Expired Product",
        "Missing Items",
        "Poor Service",
        "Other",
      ],
      required: true,
    },

    // Bilingual Support
    language: { type: String, enum: ["Hindi", "English"], default: "English" },
    reason: { type: String, required: true },
    reasonHindi: { type: String, default: "" },

    // Resolution
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },
    resolutionNote: { type: String, default: "" },
    resolutionNoteHindi: { type: String, default: "" },

    // Feedback
    rating: { type: Number, min: 1, max: 5 },
    images: [{ type: String }],

    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Dispute", disputeSchema);
