const Dispute = require("../models/Dispute");
const Product = require("../models/Product");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Order = require("../models/Order");

// ✅ 1. User - Product ke liye Complaint Darz Kare
exports.createProductComplaint = async (req, res) => {
  try {
    let {
      productId,
      productName,
      vendorId,
      category,
      reason,
      reasonHindi,
      language,
      images,
    } = req.body;
    const userId = req.user?.id || req.body.userId;

    // Validation
    if (!productName || !vendorId || !category || !reason || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "productName, vendorId, category, reason, and userId are required.",
      });
    }

    let product;
    if (productId) {
      product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found." });
      }
      productName = product.name || productName;
      vendorId = vendorId || product.vendor || product.vendorId;
    } else {
      product = await Product.findOne({
        name: { $regex: new RegExp(`^${productName.trim()}$`, "i") },
      });
      if (product) {
        productId = product._id;
        productName = product.name;
        vendorId = vendorId || product.vendor || product.vendorId;
      }
    }

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message:
          "Vendor information is required to assign the complaint properly.",
      });
    }

    const complaint = await Dispute.create({
      productId: productId || undefined,
      productName: productName || "Unknown Product",
      vendorId,
      userId,
      raisedBy: "user",
      type: "complaint",
      category,
      reason,
      reasonHindi: reasonHindi || "",
      language: language || "English",
      images: images || [],
      status: "open",
    });

    res.status(201).json({
      success: true,
      message:
        language === "Hindi"
          ? "शिकायत दर्ज हो गई है।"
          : "Complaint filed successfully.",
      complaint,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 2. Vendor - Apne Products ke Complaints Dekhe
exports.getVendorComplaints = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, language } = req.query;

    let filter = { vendorId, type: "complaint" };
    if (status) filter.status = status;
    if (language) filter.language = language;

    const complaints = await Dispute.find(filter)
      .populate("userId", "firstName lastName email mobileNumber profilePic")
      .populate("productId", "name price image")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: complaints.length,
      complaints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 3. Admin - Sab Complaints Dekhe
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, language, vendorId } = req.query;

    let filter = { type: "complaint" };
    if (status) filter.status = status;
    if (language) filter.language = language;
    if (vendorId) filter.vendorId = vendorId;

    const complaints = await Dispute.find(filter)
      .populate("userId", "firstName lastName email mobileNumber")
      .populate("vendorId", "shopName shopkeeperName email")
      .populate("productId", "name price image")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: complaints.length,
      complaints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 4. User - Apne Complaints Dekhe
exports.getUserComplaints = async (req, res) => {
  try {
    const { userId } = req.params;

    const complaints = await Dispute.find({ userId, raisedBy: "user" })
      .populate("vendorId", "shopName shopkeeperName email")
      .populate("productId", "name price image")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: complaints.length,
      complaints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 5. Vendor/Admin - Complaint ka Status Update Kare
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, resolutionNote, resolutionNoteHindi } = req.body;

    if (!["open", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use: open, in-progress, or resolved",
      });
    }

    const updateData = {
      status,
      resolutionNote: resolutionNote || "",
      resolutionNoteHindi: resolutionNoteHindi || "",
    };

    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    const complaint = await Dispute.findByIdAndUpdate(complaintId, updateData, {
      new: true,
    });

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found." });
    }

    res.json({
      success: true,
      message: "Complaint status updated.",
      complaint,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 6. Complaint ka Details Dekhe
exports.getComplaintDetails = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Dispute.findById(complaintId)
      .populate("userId", "firstName lastName email mobileNumber profilePic")
      .populate("vendorId", "shopName shopkeeperName email mobileNumber")
      .populate("productId", "name price image description");

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found." });
    }

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 7. Vendor - Complaint par Response De (Vendor ka Version)
exports.vendorRespondToComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { resolutionNote, resolutionNoteHindi, status } = req.body;

    const complaint = await Dispute.findById(complaintId);
    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found." });
    }

    const updatedComplaint = await Dispute.findByIdAndUpdate(
      complaintId,
      {
        status: status || "in-progress",
        resolutionNote: resolutionNote || "",
        resolutionNoteHindi: resolutionNoteHindi || "",
      },
      { new: true },
    ).populate("userId", "firstName lastName email");

    res.json({
      success: true,
      message: "Response sent to user.",
      complaint: updatedComplaint,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 8. Admin - Complaint ko Resolve Kare (Final)
exports.resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { resolutionNote, resolutionNoteHindi } = req.body;

    const complaint = await Dispute.findByIdAndUpdate(
      complaintId,
      {
        status: "resolved",
        resolutionNote,
        resolutionNoteHindi,
        resolvedAt: new Date(),
      },
      { new: true },
    );

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found." });
    }

    res.json({
      success: true,
      message: "Complaint resolved.",
      complaint,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 9. Get Complaints Statistics (Admin Dashboard)
exports.getComplaintsStats = async (req, res) => {
  try {
    const total = await Dispute.countDocuments({ type: "complaint" });
    const open = await Dispute.countDocuments({
      type: "complaint",
      status: "open",
    });
    const inProgress = await Dispute.countDocuments({
      type: "complaint",
      status: "in-progress",
    });
    const resolved = await Dispute.countDocuments({
      type: "complaint",
      status: "resolved",
    });

    const categoryStats = await Dispute.aggregate([
      { $match: { type: "complaint" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const languageStats = await Dispute.aggregate([
      { $match: { type: "complaint" } },
      { $group: { _id: "$language", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        open,
        inProgress,
        resolved,
        categoryStats,
        languageStats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
