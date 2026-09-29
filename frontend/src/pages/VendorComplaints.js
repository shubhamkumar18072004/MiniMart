import React, { useState, useEffect } from "react";
import "../styles/VendorComplaints.css";
import Navbar from "../components/Navbar";

const VendorComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [filter, setFilter] = useState("open");
  const [responseText, setResponseText] = useState("");
  const [responseHindi, setResponseHindi] = useState("");

  const labels = {
    English: {
      title: "Complaint Management",
      noComplaints: "No complaints to manage",
      status: "Status",
      category: "Category",
      customer: "Customer",
      date: "Date",
      product: "Product",
      reason: "Issue Description",
      respond: "Send Response",
      close: "Close",
      filterOpen: "Open",
      filterInProgress: "In Progress",
      filterResolved: "Resolved",
      responseText: "Your Response",
      responseHindi: "Response in Hindi",
      sendResponse: "Send Response",
      responseSent: "Response sent successfully!",
      markResolved: "Mark as Resolved",
      submitting: "Sending...",
      customerDetails: "Customer Details",
      email: "Email",
      phone: "Phone",
      complaintDate: "Complaint Date",
    },
    Hindi: {
      title: "शिकायत प्रबंधन",
      noComplaints: "प्रबंधित करने के लिए कोई शिकायत नहीं",
      status: "स्थिति",
      category: "श्रेणी",
      customer: "ग्राहक",
      date: "तारीख",
      product: "उत्पाद",
      reason: "समस्या का विवरण",
      respond: "जवाब दें",
      close: "बंद करें",
      filterOpen: "खुली",
      filterInProgress: "प्रक्रिया में",
      filterResolved: "समाधान हो गई",
      responseText: "आपका जवाब",
      responseHindi: "हिंदी में जवाब",
      sendResponse: "जवाब भेजें",
      responseSent: "जवाब सफलतापूर्वक भेज दिया गया!",
      markResolved: "समाधान के रूप में चिह्नित करें",
      submitting: "भेज रहे हैं...",
      customerDetails: "ग्राहक विवरण",
      email: "ईमेल",
      phone: "फोन",
      complaintDate: "शिकायत की तारीख",
    },
  };

  const [language, setLanguage] = useState("English");
  const lang = labels[language];

  const statusColors = {
    open: "#e74c3c",
    "in-progress": "#f39c12",
    resolved: "#27ae60",
  };

  const statusEmojis = {
    open: "🔴",
    "in-progress": "🟡",
    resolved: "🟢",
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const vendorId = localStorage.getItem("vendorId");
      if (!vendorId) {
        window.location.href = "/vendor-login";
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/complaints/vendor/${vendorId}`,
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

  const handleSendResponse = async (complaintId) => {
    if (!responseText.trim()) {
      alert("Please enter a response!");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/complaints/vendor/respond/${complaintId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "in-progress",
            resolutionNote: responseText,
            resolutionNoteHindi: responseHindi,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert(lang.responseSent);
        setResponseText("");
        setResponseHindi("");
        setShowResponseForm(false);
        setSelectedComplaint(null);
        fetchComplaints();
      }
    } catch (error) {
      console.error("Error sending response:", error);
      alert("Error sending response!");
    }
  };

  const handleMarkResolved = async (complaintId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/complaints/vendor/respond/${complaintId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "resolved",
            resolutionNote: responseText || "Issue has been resolved",
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert(lang.responseSent);
        setShowResponseForm(false);
        setSelectedComplaint(null);
        fetchComplaints();
      }
    } catch (error) {
      console.error("Error marking resolved:", error);
    }
  };

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
    <div className="vendor-complaints-container">
      <Navbar />

      <div className="vendor-complaints-wrapper">
        {/* Header */}
        <div className="complaints-header">
          <div className="header-top">
            <h1>{lang.title}</h1>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
            >
              <option value="English">English</option>
              <option value="Hindi">हिंदी</option>
            </select>
          </div>

          {/* Filters */}
          <div className="filter-buttons">
            {["open", "in-progress", "resolved"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "open"
                  ? lang.filterOpen
                  : f === "in-progress"
                    ? lang.filterInProgress
                    : lang.filterResolved}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">
                {complaints.filter((c) => c.status === "open").length}
              </span>
              <span className="stat-label">{lang.filterOpen}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {complaints.filter((c) => c.status === "in-progress").length}
              </span>
              <span className="stat-label">{lang.filterInProgress}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {complaints.filter((c) => c.status === "resolved").length}
              </span>
              <span className="stat-label">{lang.filterResolved}</span>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div className="loading">Loading complaints...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">📭</p>
            <p className="empty-text">{lang.noComplaints}</p>
          </div>
        ) : (
          <div className="complaints-table-container">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>{lang.date}</th>
                  <th>{lang.product}</th>
                  <th>{lang.customer}</th>
                  <th>{lang.category}</th>
                  <th>{lang.status}</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr
                    key={complaint._id}
                    className={`status-${complaint.status}`}
                  >
                    <td>{formatDate(complaint.createdAt)}</td>
                    <td className="product-cell">{complaint.productName}</td>
                    <td>
                      <div className="customer-name">
                        {complaint.userId?.firstName}{" "}
                        {complaint.userId?.lastName}
                      </div>
                      <small>{complaint.userId?.email}</small>
                    </td>
                    <td>
                      <span className="category-badge">
                        {complaint.category}
                      </span>
                    </td>
                    <td>
                      <div
                        className="status-badge"
                        style={{ color: statusColors[complaint.status] }}
                      >
                        {statusEmojis[complaint.status]}{" "}
                        {getStatusText(complaint.status)}
                      </div>
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowResponseForm(false);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
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
              {/* Customer Details */}
              <div className="section">
                <h4>👤 {lang.customerDetails}</h4>
                <p>
                  <strong>{lang.customer}:</strong>{" "}
                  {selectedComplaint.userId?.firstName}{" "}
                  {selectedComplaint.userId?.lastName}
                </p>
                <p>
                  <strong>{lang.email}:</strong>{" "}
                  {selectedComplaint.userId?.email}
                </p>
                <p>
                  <strong>{lang.phone}:</strong>{" "}
                  {selectedComplaint.userId?.mobileNumber}
                </p>
              </div>

              {/* Complaint Details */}
              <div className="section">
                <h4>📋 {lang.reason}</h4>
                <p>{selectedComplaint.reason}</p>
              </div>

              {/* Response Form or Display */}
              {showResponseForm ? (
                <div className="response-form">
                  <h4>📝 {lang.respond}</h4>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder={lang.responseText}
                    rows="4"
                    className="form-textarea"
                  />
                  <textarea
                    value={responseHindi}
                    onChange={(e) => setResponseHindi(e.target.value)}
                    placeholder={lang.responseHindi}
                    rows="4"
                    className="form-textarea"
                  />
                  <div className="form-buttons">
                    <button
                      className="send-btn"
                      onClick={() => handleSendResponse(selectedComplaint._id)}
                    >
                      {lang.sendResponse}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => setShowResponseForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : selectedComplaint.status !== "resolved" ? (
                <button
                  className="respond-btn"
                  onClick={() => setShowResponseForm(true)}
                >
                  {lang.respond}
                </button>
              ) : (
                <div className="resolved-message">✓ {lang.filterResolved}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorComplaints;
