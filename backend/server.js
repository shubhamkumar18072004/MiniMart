const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// --- ROUTES IMPORT ---
const vendorRoutes = require("./routes/vendorRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

// --- USE ROUTES ---
app.use("/api/vendor", vendorRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/promo", require("./routes/promoRoutes"));
app.use("/api/delivery", require("./routes/deliveryRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

// Serve React build in production so full app runs from one server.
if (process.env.NODE_ENV === "production") {
  const frontendBuildPath = path.join(__dirname, "..", "frontend", "build");
  app.use(express.static(frontendBuildPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      return res.sendFile(path.join(frontendBuildPath, "index.html"));
    }
    return res.status(404).json({ message: "API route not found" });
  });
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Full System Active: All Routes Connected!");
    app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
  })
  .catch((err) => console.error(err));
