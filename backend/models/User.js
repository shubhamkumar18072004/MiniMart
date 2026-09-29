const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true, unique: true },
  
  password: { type: String, required: true }, 

  profilePic: { type: String, default: "" }, 
  
  otp: { type: String }, 
  isVerified: { type: Boolean, default: false },
  
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  addresses: [
    {
      label: { type: String, enum: ["Home", "Office", "Friends", "Family"] },
      addressLine: String,
      city: String,
      pincode: String,
    }
  ],
  
  language: { type: String, enum: ["Hindi", "English"], default: "English" },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);