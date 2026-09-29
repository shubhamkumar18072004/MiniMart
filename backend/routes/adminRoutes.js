const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");

router.use(adminAuth);

// Master statistics
router.get("/master-statistics", adminController.getMasterStatistics);

// Vendor management
router.get("/vendors", adminController.getVendors);
router.put("/vendors/:id/approval", adminController.updateVendorApproval);
router.put("/vendors/:id/commission", adminController.updateVendorCommission);

// Inventory and categories
router.get("/inventory", adminController.getGlobalInventory);
router.put("/products/:id/visibility", adminController.updateProductVisibility);
router.get("/categories", adminController.getCategories);
router.post("/categories", adminController.addCategory);
router.put("/categories/:id/toggle", adminController.toggleCategory);

// Orders, delivery, disputes
router.get("/orders", adminController.getOrdersForAdmin);
router.get("/delivery-partners", adminController.getDeliveryPartners);
router.post("/delivery-partners", adminController.addDeliveryPartner);
router.put("/orders/:orderId/assign-delivery", adminController.assignDeliveryPartner);
router.get("/disputes", adminController.getDisputes);
router.put("/disputes/:id/resolve", adminController.resolveDispute);

// Payout settlements
router.put("/finance/settlement/:id/mark-paid", adminController.markSettlementPaid);

// Finance reports
router.get("/finance/overview", adminController.getFinanceOverview);
router.get("/finance/transactions", adminController.getFinanceTransactions);
router.get("/finance/export", adminController.exportFinanceTransactionsCsv);

// Marketing
router.get("/promo-codes", adminController.getPromoCodes);
router.post("/promo-codes", adminController.createPromoCode);
router.put("/promo-codes/:id/toggle", adminController.togglePromoCode);
router.get("/banners", adminController.getBanners);
router.post("/banners", adminController.createBanner);
router.put("/banners/:id/toggle", adminController.toggleBanner);
router.get("/notifications", adminController.getBulkNotifications);
router.post("/notifications", adminController.sendBulkNotification);

module.exports = router;
