const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");

// 1. Add Product Route
router.post("/add", upload.single("image"), productController.addProduct);

// 2. Get All Products Route (Customer Home Page ke liye)
router.get("/", productController.getAllProducts);
router.get("/nearby", productController.getNearbyProducts);

// NEW ROUTE: Sirf ek specific Vendor ke products lane ke liye

router.get("/vendor/:vendorId", productController.getVendorProducts);

// 3. Update Stock Status Route
router.put("/update-stock/:id", productController.updateStock);

router.put("/update-sell-unit/:id", productController.updateSellUnit);

//  NAYA ROUTE: Price, Discount aur Deal update karne ke liye

router.put("/update-price/:id", productController.updatePrice);

module.exports = router;