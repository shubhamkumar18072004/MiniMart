const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");


router.post("/place", orderController.placeOrder);
router.get("/user/:userId", orderController.getUserOrders);
router.put("/update-status/:id", orderController.updateStatus);
router.post("/dispute", orderController.raiseDispute);


router.get("/vendor/:vendorId", orderController.getVendorOrders);

module.exports = router;