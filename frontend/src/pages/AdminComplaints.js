import React, { useState, useEffect } from "react";
import "../styles/AdminComplaints.css";
import Navbar from "../components/Navbar";

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [resolveNote, setResolveNote] = useState("");
  const [resolveNoteHindi, setResolveNoteHindi] = useState("");
  const [language, setLanguage] = useState("English");

  const labels = {
    English: {
      title: "Complaint Management System",
      statistics: "Statistics",
      total: "Total Complaints",
      open: "Open",
      inProgress: "In Progress",
      resolved: "Resolved",
      noComplaints: "No complaints found",
      status: "Status",
      category: "Category",
      customer: "Customer",
      vendor: "Vendor",
      date: "Date",
      product: "Product",
      resolve: "Resolve",
      close: "Close",
      reason: "Issue Description",
      vendorResponse: "Vendor Response",
      resolutionNote: "Resolution Note",
      resolutionNoteHindi: "Resolution Note (Hindi)",
      resolveComplaint: "Resolve Complaint",
      submit: "Submit Resolution",
      resolved: "Resolved",
      submitting: "Submitting...",
      filterAll: "All",
      filterOpen: "Open",
      filterInProgress: "In Progress",
      filterResolved: "Resolved",
      categoryBreakdown: "Category Breakdown",
      languageBreakdown: "Language Breakdown",
      viewDetails: "View Details",
      noVendorResponse: "No vendor response yet",
    },
    Hindi: {
      title: "शिकायत प्रबंधन प्रणाली",
      statistics: "आंकड़े",
      total: "कुल शिकायतें",
      open: "खुली",
      inProgress: "प्रक्रिया में",
      resolved: "समाधान हो गई",
      noComplaints: "कोई शिकायत नहीं मिली",
      status: "स्थिति",
      category: "श्रेणी",
      customer: "ग्राहक",
      vendor: "विक्रेता",
      date: "तारीख",
      product: "उत्पाद",
      resolve: "समाधान करें",
      close: "बंद करें",
      reason: "समस्या का विवरण",
      vendorResponse: "विक्रेता की प्रतिक्रिया",
      resolutionNote: "समाधान नोट",
      resolutionNoteHindi: "समाधान नोट (हिंदी में)",
      resolveComplaint: "शिकायत का समाधान करें",
      submit: "समाधान जमा करें",
      resolved: "समाधान हो गई",
      submitting: "जमा किया जा रहा है...",
      filterAll: "सभी",
      filterOpen: "खुली",
      filterInProgress: "प्रक्रिया में",
      filterResolved: "समाधान हो गई",
      categoryBreakdown: "श्रेणी विभाजन",
      languageBreakdown: "भाषा विभाजन",
      viewDetails: "विवरण देखें",
      noVendorResponse: "अभी कोई विक्रेता प्रतिक्रिया नहीं",
    },
  };

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
    fetchStats();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/complaints/admin/all",
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

  const fetchStats = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/complaints/admin/stats",
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (filter === "all") return true;
    return complaint.status === filter;
  });

  const handleResolve = async (complaintId) => {
    if (!resolveNote.trim()) {
      alert("Please enter a resolution note!");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/complaints/admin/resolve/${complaintId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resolutionNote: resolveNote,
            resolutionNoteHindi: resolveNoteHindi,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert("Complaint resolved successfully!");
        setResolveNote("");
        setResolveNoteHindi("");
        setShowResolveForm(false);
        setSelectedComplaint(null);
        fetchComplaints();
        fetchStats();
      }
    } catch (error) {
      console.error("Error resolving complaint:", error);
      alert("Error resolving complaint!");
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
    <div className="admin-complaints-container">
      <Navbar />

      <div className="admin-complaints-wrapper">
        {/* Header */}
        <div className="admin-header">
          <div className="header-title">
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
        </div>

        {/* Statistics */}
        {stats && (
          <div className="stats-container">
            <h2>{lang.statistics}</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h4>{lang.total}</h4>
                  <p className="stat-value">{stats.total}</p>
                </div>
              </div>
              <div className="stat-card open">
                <div className="stat-icon">🔴</div>
                <div className="stat-content">
                  <h4>{lang.filterOpen}</h4>
                  <p className="stat-value">{stats.open}</p>
                </div>
              </div>
              <div className="stat-card progress">
                <div className="stat-icon">🟡</div>
                <div className="stat-content">
                  <h4>{lang.filterInProgress}</h4>
                  <p className="stat-value">{stats.inProgress}</p>
                </div>
              </div>
              <div className="stat-card resolved">
                <div className="stat-icon">🟢</div>
                <div className="stat-content">
                  <h4>{lang.filterResolved}</h4>
                  <p className="stat-value">{stats.resolved}</p>
                </div>
              </div>
            </div>

            {/* Category & Language Stats */}
            <div className="breakdown-grid">
              <div className="breakdown-card">
                <h3>{lang.categoryBreakdown}</h3>
                <div className="breakdown-list">
                  {stats.categoryStats?.map((cat, idx) => (
                    <div key={idx} className="breakdown-item">
                      <span>{cat._id}</span>
                      <span className="badge">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="breakdown-card">
                <h3>{lang.languageBreakdown}</h3>
                <div className="breakdown-list">
                  {stats.languageStats?.map((lang_stat, idx) => (
                    <div key={idx} className="breakdown-item">
                      <span>{lang_stat._id}</span>
                      <span className="badge">{lang_stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filter-section">
          <div className="filter-buttons">
            {["all", "open", "in-progress", "resolved"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? lang.filterAll
                  : f === "open"
                    ? lang.filterOpen
                    : f === "in-progress"
                      ? lang.filterInProgress
                      : lang.filterResolved}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Table */}
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
                  <th>{lang.vendor}</th>
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
                      <div className="user-info">
                        <div>
                          {complaint.userId?.firstName}{" "}
                          {complaint.userId?.lastName}
                        </div>
                        <small>{complaint.userId?.email}</small>
                      </div>
                    </td>
                    <td className="vendor-cell">
                      {complaint.vendorId?.shopName}
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
                          setShowResolveForm(false);
                        }}
                      >
                        {lang.viewDetails}
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
              <div className="info-grid">
                <div className="info-card">
                  <h4>👤 {lang.customer}</h4>
                  <p>
                    {selectedComplaint.userId?.firstName}{" "}
                    {selectedComplaint.userId?.lastName}
                  </p>
                  <small>{selectedComplaint.userId?.email}</small>
                </div>

                <div className="info-card">
                  <h4>🏪 {lang.vendor}</h4>
                  <p>{selectedComplaint.vendorId?.shopName}</p>
                  <small>{selectedComplaint.vendorId?.email}</small>
                </div>
              </div>

              <div className="section">
                <h4>📝 {lang.reason}</h4>
                <p>{selectedComplaint.reason}</p>
              </div>

              {selectedComplaint.resolutionNote && (
                <div className="section vendor-response">
                  <h4>📢 {lang.vendorResponse}</h4>
                  <p>{selectedComplaint.resolutionNote}</p>
                </div>
              )}

              {showResolveForm ? (
                <div className="resolve-form">
                  <h4>{lang.resolveComplaint}</h4>
                  <textarea
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder={lang.resolutionNote}
                    rows="4"
                    className="form-textarea"
                  />
                  <textarea
                    value={resolveNoteHindi}
                    onChange={(e) => setResolveNoteHindi(e.target.value)}
                    placeholder={lang.resolutionNoteHindi}
                    rows="4"
                    className="form-textarea"
                  />
                  <div className="form-buttons">
                    <button
                      className="submit-btn"
                      onClick={() => handleResolve(selectedComplaint._id)}
                    >
                      {lang.submit}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => setShowResolveForm(false)}
                    >
                      {lang.close}
                    </button>
                  </div>
                </div>
              ) : selectedComplaint.status !== "resolved" ? (
                <button
                  className="resolve-btn"
                  onClick={() => setShowResolveForm(true)}
                >
                  {lang.resolve}
                </button>
              ) : (
                <div className="resolved-badge">{lang.resolved}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
