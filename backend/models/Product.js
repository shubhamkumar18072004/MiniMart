const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    }, 
    price: { 
        type: String, 
        required: true 
    }, 
    
    category: { 
        type: String, 
        required: true
    }, 
    unitType: {
        type: String,
        enum: ["weight", "quantity", "packet"],
        default: "weight"
    },
    weight: { 
        type: String 
    }, 
    
    //  NEW: Quantity field (Kitne items stock mein hain)
    quantity: { 
        type: Number, 
        default: 0 
    },
    
    //  NEW: Expiry Date field (Product kab kharab hoga)
    expiryDate: { 
        type: Date 
    },

    imageUrl: { 
        type: String 
    },
    inStock: { 
        type: Boolean, 
        default: true 
    },
    isDealOfTheDay: { 
        type: Boolean, 
        default: false 
    },
    discount: { 
        type: Number, 
        default: 0 
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    hiddenReason: {
        type: String,
        default: ""
    },

    //  NEW FIELD: Isse har product apne Vendor se link ho jayega
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor', // Maan ke chal raha hoon aapke Vendor model ka naam 'Vendor' hai
        required: true
    },

    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("Product", productSchema);