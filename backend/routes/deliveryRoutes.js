const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const deliveryAuth = require("../middleware/deliveryAuth");

router.post("/login", deliveryController.login);
router.get("/orders", deliveryAuth, deliveryController.getMyOrders);
router.put("/orders/:orderId/status", deliveryAuth, deliveryController.updateAssignedOrderStatus);

module.exports = router;
