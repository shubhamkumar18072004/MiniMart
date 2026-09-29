const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    
    items: [{
        productId: { type: String },
        name: { type: String },
        price: { type: Number },
        qty: { type: Number },
        vendorId: { type: String }, 
        imageUrl: { type: String },
        weight: { type: String },
        expiryDate: { type: Date }
    }],

    
    vendorId: { type: String }, 

    totalAmount: { type: Number, required: true },
    promoCode: { type: String, default: "" },
    promoDiscount: { type: Number, default: 0 },
    address: { type: String, default: "Not Provided" },
    status: { type: String, default: "Pending" },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryPartner",
        default: null
    },
    disputeStatus: {
        type: String,
        enum: ["none", "open", "resolved"],
        default: "none"
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);