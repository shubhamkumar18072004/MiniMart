const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");

router.post("/register", vendorController.registerVendor);
router.post("/login", vendorController.loginVendor);
router.get("/summary/:vendorId", vendorController.getSummary);
router.get("/earnings/:vendorId", vendorController.getEarnings);
router.post("/send-commission/:vendorId", vendorController.sendAdminCommission);
router.post("/withdraw/:vendorId", vendorController.withdrawVendorEarnings);

module.exports = router;
