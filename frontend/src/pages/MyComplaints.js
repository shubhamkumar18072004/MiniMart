import React, { useState, useEffect } from "react";
import "../styles/MyComplaints.css";
import Navbar from "../components/Navbar";

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filter, setFilter] = useState("all");
  const [language, setLanguage] = useState("English");

  const labels = {
    English: {
      title: "My Complaints",
      noComplaints: "No complaints filed yet",
      fileNew: "File New Complaint",
      status: "Status",
      category: "Category",
      product: "Product",
      date: "Date",
      vendor: "Vendor",
      details: "Details",
      close: "Close",
      filterAll: "All",
      filterOpen: "Open",
      filterInProgress: "In Progress",
      filterResolved: "Resolved",
      reason: "Issue Description",
      response: "Vendor Response",
      noResponse: "Awaiting vendor response...",
      rating: "Rating",
      resolution: "Resolution",
      empty: "You have not filed any complaints",
    },
    Hindi: {
      title: "मेरी शिकायतें",
      noComplaints: "अभी कोई शिकायत दर्ज नहीं की गई है",
      fileNew: "नई शिकायत दर्ज करें",
      status: "स्थिति",
      category: "श्रेणी",
      product: "उत्पाद",
      date: "तारीख",
      vendor: "विक्रेता",
      details: "विवरण",
      close: "बंद करें",
      filterAll: "सभी",
      filterOpen: "खुली",
      filterInProgress: "प्रक्रिया में",
      filterResolved: "समाधान हो गई",
      reason: "समस्या का विवरण",
      response: "विक्रेता का जवाब",
      noResponse: "विक्रेता के जवाब की प्रतीक्षा...",
      rating: "रेटिंग",
      resolution: "समाधान",
      empty: "आपने अभी कोई शिकायत दर्ज नहीं की है",
    },
  };

  const lang = labels[language];

  const statusColors = {
    open: "#e74c3c", // Red
    "in-progress": "#f39c12", // Orange
    resolved: "#27ae60", // Green
  };

  const statusEmojis = {
    open: "🔴",
    "in-progress": "🟡",
    resolved: "🟢",
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getCurrentUserId = () => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return (
          user.id || user._id || user.userId || localStorage.getItem("userId")
        );
      }
    } catch (error) {
      console.error("Error parsing user", error);
    }
    return localStorage.getItem("userId");
  };

  const fetchComplaints = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/complaints/user/${userId}`,
      );
      const data = await response.json();

      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (filter === "all") return true;
    return complaint.status === filter;
  });

  const getStatusText = (status) => {
    const statusMap = {
      open: lang.filterOpen,
      "in-progress": lang.filterInProgress,
      resolved: lang.filterResolved,
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "Hindi" ? "hi-IN" : "en-IN");
  };

  return (
    <div className="my-complaints-container">
      <Navbar />

      <div className="complaints-wrapper">
        {/* Header */}
        <div className="complaints-header">
          <div className="header-top">
            <h1>{lang.title}</h1>
            <div className="header-controls">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                <option value="English">English</option>
                <option value="Hindi">हिंदी</option>
              </select>
              <button
                className="file-new-btn"
                onClick={() => (window.location.href = "/complaint-form")}
              >
                ➕ {lang.fileNew}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-buttons">
            {["all", "open", "in-progress", "resolved"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {
                  lang[
                    f === "all"
                      ? "filterAll"
                      : f === "open"
                        ? "filterOpen"
                        : f === "in-progress"
                          ? "filterInProgress"
                          : "filterResolved"
                  ]
                }
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading">Loading your complaints...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">📭</p>
            <p className="empty-text">{lang.empty}</p>
            <button
              className="file-new-btn"
              onClick={() => (window.location.href = "/complaint-form")}
            >
              {lang.fileNew}
            </button>
          </div>
        ) : (
          <div className="complaints-grid">
            {filteredComplaints.map((complaint) => (
              <div key={complaint._id} className="complaint-card">
                <div className="card-header">
                  <div
                    className="status-badge"
                    style={{ color: statusColors[complaint.status] }}
                  >
                    {statusEmojis[complaint.status]}{" "}
                    {getStatusText(complaint.status)}
                  </div>
                  <span className="complaint-date">
                    {formatDate(complaint.createdAt)}
                  </span>
                </div>

                <div className="card-body">
                  <h3 className="product-name">{complaint.productName}</h3>

                  <div className="complaint-info">
                    <p>
                      <strong>📦 {lang.category}:</strong> {complaint.category}
                    </p>
                    <p>
                      <strong>🏪 {lang.vendor}:</strong>{" "}
                      {complaint.vendorId?.shopName || "N/A"}
                    </p>
                  </div>

                  <p className="complaint-reason">
                    <strong>{lang.reason}:</strong>
                    <br />
                    {complaint.reason}
                  </p>

                  {complaint.resolutionNote && (
                    <div className="resolution-note">
                      <strong>✓ {lang.response}:</strong>
                      <p>{complaint.resolutionNote}</p>
                    </div>
                  )}

                  {complaint.status === "open" && (
                    <p className="no-response">{lang.noResponse}</p>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    className="details-btn"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    {lang.details} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Complaint Details */}
      {selectedComplaint && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedComplaint(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedComplaint(null)}
            >
              ✕
            </button>

            <div className="modal-header">
              <h2>{selectedComplaint.productName}</h2>
              <div
                className="status-badge"
                style={{ color: statusColors[selectedComplaint.status] }}
              >
                {statusEmojis[selectedComplaint.status]}{" "}
                {getStatusText(selectedComplaint.status)}
              </div>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>📋 {lang.category}</h4>
                <p>{selectedComplaint.category}</p>
              </div>

              <div className="detail-section">
                <h4>🏪 {lang.vendor}</h4>
                <p>{selectedComplaint.vendorId?.shopName || "N/A"}</p>
                <small>{selectedComplaint.vendorId?.email || ""}</small>
              </div>

              <div className="detail-section">
                <h4>📝 {lang.reason}</h4>
                <p>{selectedComplaint.reason}</p>
              </div>

              {selectedComplaint.reasonHindi && (
                <div className="detail-section">
                  <h4>📝 समस्या (हिंदी में)</h4>
                  <p>{selectedComplaint.reasonHindi}</p>
                </div>
              )}

              {selectedComplaint.resolutionNote && (
                <div className="detail-section resolution">
                  <h4>✓ {lang.response}</h4>
                  <p>{selectedComplaint.resolutionNote}</p>
                </div>
              )}

              {selectedComplaint.rating && (
                <div className="detail-section">
                  <h4>⭐ {lang.rating}</h4>
                  <p>
                    {"★".repeat(selectedComplaint.rating)}
                    {"☆".repeat(5 - selectedComplaint.rating)}
                  </p>
                </div>
              )}

              <div className="detail-section">
                <h4>📅 {lang.date}</h4>
                <p>{formatDate(selectedComplaint.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
