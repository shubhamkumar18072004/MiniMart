const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");

// ✅ USER ROUTES (Complaint File Karne)

router.post("/create", complaintController.createProductComplaint);

// User apne complaints dekhe
router.get("/user/:userId", complaintController.getUserComplaints);

// Complaint ka details dekhe
router.get("/details/:complaintId", complaintController.getComplaintDetails);

// ✅ VENDOR ROUTES (Complaints Dekne aur Respond Karne)
// Vendor apne products ke complaints dekhe
router.get("/vendor/:vendorId", complaintController.getVendorComplaints);

// Vendor complaint par response de
router.put(
  "/vendor/respond/:complaintId",
  complaintController.vendorRespondToComplaint,
);

// ✅ ADMIN ROUTES (Sab Complaints Manage Karne)
// Sab complaints dekhe (Filter ke saath)
router.get("/admin/all", complaintController.getAllComplaints);

// Admin complaint status update kare
router.put(
  "/admin/update-status/:complaintId",
  complaintController.updateComplaintStatus,
);

// Admin complaint resolve kare
router.put("/admin/resolve/:complaintId", complaintController.resolveComplaint);

// Admin complaints statistics dekhe
router.get("/admin/stats", complaintController.getComplaintsStats);

module.exports = router;
