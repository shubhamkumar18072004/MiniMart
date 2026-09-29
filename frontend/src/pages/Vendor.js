import React, { useState, useEffect } from "react";
import { apiClient } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { initialInventoryUnitType } from "../utils/productUnit";

function SellUnitEditor({ item, onSaved }) {
  const [unitKind, setUnitKind] = useState(() =>
    initialInventoryUnitType(item),
  );
  const [weightDraft, setWeightDraft] = useState(String(item.weight ?? ""));
  const [qtyDraft, setQtyDraft] = useState(Number(item.quantity) || 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUnitKind(initialInventoryUnitType(item));
    setWeightDraft(String(item.weight ?? ""));
    setQtyDraft(Number(item.quantity) || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item._id, item.unitType, item.weight, item.quantity]);

  const patch = async (payload) => {
    setSaving(true);
    try {
      await apiClient.put(
        `/api/products/update-sell-unit/${item._id}`,
        payload,
      );
      onSaved?.();
    } catch (e) {
      alert("❌ Unit update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUnitKindChange = async (e) => {
    const v = e.target.value;
    if (v === unitKind) return;
    setSaving(true);
    try {
      await apiClient.put(`/api/products/update-sell-unit/${item._id}`, {
        unitType: v,
      });
      setUnitKind(v);
      onSaved?.();
    } catch (err) {
      alert("❌ Unit type update failed");
    } finally {
      setSaving(false);
    }
  };

  const unitSelect = (
    <select
      value={unitKind}
      disabled={saving}
      onChange={handleUnitKindChange}
      className="w-full max-w-[140px] text-[9px] font-black uppercase tracking-tight border border-gray-200 rounded-xl py-2 px-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="weight">Weight</option>
      <option value="quantity">Quantity (Pcs)</option>
      <option value="packet">Packet</option>
    </select>
  );

  if (unitKind === "weight") {
    const stockStep = async (delta) => {
      const next = Math.max(0, (Number(qtyDraft) || 0) + delta);
      setQtyDraft(next);
      await patch({ quantity: next });
    };
    return (
      <div className="flex flex-col items-center gap-2 min-w-[130px]">
        {unitSelect}
        <div className="flex flex-col items-center gap-1 w-full">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
            Weight (sell)
          </span>
          <input
            disabled={saving}
            className="w-full max-w-[130px] text-center border border-gray-200 rounded-xl py-1.5 text-xs font-black text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
            value={weightDraft}
            onChange={(e) => setWeightDraft(e.target.value)}
            onBlur={() => {
              const next = weightDraft.trim();
              const prev = String(item.weight ?? "").trim();
              if (next !== prev) patch({ weight: next });
            }}
          />
        </div>
        <div className="flex flex-col items-center gap-1 w-full border-t border-gray-100 pt-2">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
            Stock qty
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={saving || qtyDraft <= 0}
              onClick={() => stockStep(-1)}
              className="w-7 h-7 rounded-lg bg-gray-100 font-black text-gray-700 hover:bg-gray-200 disabled:opacity-40 text-xs"
            >
              −
            </button>
            <span className="min-w-[1.75rem] text-center text-xs font-black">
              {qtyDraft}
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={() => stockStep(1)}
              className="w-7 h-7 rounded-lg bg-gray-100 font-black text-gray-700 hover:bg-gray-200 disabled:opacity-40 text-xs"
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  }

  const label = unitKind === "packet" ? "Packets (sell)" : "Pieces (sell)";
  const optionalHint =
    unitKind === "packet" ? "Packet label (opt.)" : "Note (opt.)";
  const step = async (delta) => {
    const next = Math.max(0, (Number(qtyDraft) || 0) + delta);
    setQtyDraft(next);
    await patch({ quantity: next });
  };

  return (
    <div className="flex flex-col items-center gap-2 min-w-[130px]">
      {unitSelect}
      <div className="flex flex-col items-center gap-1 w-full">
        <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
          {optionalHint}
        </span>
        <input
          disabled={saving}
          className="w-full max-w-[140px] text-center border border-gray-200 rounded-xl py-1.5 text-[10px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
          value={weightDraft}
          onChange={(e) => setWeightDraft(e.target.value)}
          onBlur={() => {
            const next = weightDraft.trim();
            const prev = String(item.weight ?? "").trim();
            if (next !== prev) patch({ weight: next });
          }}
        />
      </div>
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={saving || qtyDraft <= 0}
          onClick={() => step(-1)}
          className="w-8 h-8 rounded-lg bg-gray-100 font-black text-gray-700 hover:bg-gray-200 disabled:opacity-40 text-sm"
        >
          −
        </button>
        <span className="min-w-[2rem] text-center text-sm font-black">
          {qtyDraft}
        </span>
        <button
          type="button"
          disabled={saving}
          onClick={() => step(1)}
          className="w-8 h-8 rounded-lg bg-gray-100 font-black text-gray-700 hover:bg-gray-200 disabled:opacity-40 text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}

const Vendor = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // New: for button loading states
  const [summary, setSummary] = useState({
    todaySales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    lowStockCount: 0,
  });
  const [vendorData, setVendorData] = useState(null);

  // States for Adding Product
  const [productData, setProductData] = useState({
    name: "",
    price: "",
    category: "",
    unitType: "weight",
    weight: "",
    quantity: "",
    expiryDate: "",
  });
  const [image, setImage] = useState(null);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [earnings, setEarnings] = useState({
    grossEarnings: 0,
    adminCommission: 0,
    vendorNetBeforeWithdraw: 0,
    adminNetCommission: 0,
    vendorNetAfterWithdraw: 0,
    withdrawnAmount: 0,
    commissionSent: 0,
  });
  const [earningsPeriod, setEarningsPeriod] = useState("today");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [settings, setSettings] = useState({
    serviceableRadius: 5,
    minOrderValue: 0,
    openTime: "09:00",
    closeTime: "21:00",
  });
  const [allProducts, setAllProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([
    "Fruits & Vegetables",
    "Atta, Rice, Oil & Dals",
    "Masala & Dry Fruits",
    "Sweet Cravings",
    "Frozen Food & Ice Cream",
    "Baby Food",
    "Dairy, Bread & Eggs",
    "Cold Drinks & Juices",
    "Munchies",
    "Meats, Fish & Eggs",
    "Breakfast & Sauces",
    "Tea, Coffee & More",
    "Biscuits",
    "Makeup & Beauty",
    "Bath & Body",
    "Cleaning Essentials",
    "Home Needs",
    "Electricals & Accessories",
    "Hygiene & Grooming",
    "Health & Baby Care",
    "Homegrown Brands",
    "Paan Corner",
  ]);
  const [vendorComplaints, setVendorComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintResponseText, setComplaintResponseText] = useState("");
  const [complaintResponseHindi, setComplaintResponseHindi] = useState("");

  useEffect(() => {
    const initializeData = async () => {
      try {
        const savedVendor = localStorage.getItem("vendor");
        if (savedVendor) {
          const parsed = JSON.parse(savedVendor);
          setVendorData(parsed);
          setSettings({
            serviceableRadius: parsed.serviceableRadius || 5,
            minOrderValue: parsed.minOrderValue || 0,
            openTime: parsed.storeTimings?.open || "09:00",
            closeTime: parsed.storeTimings?.close || "21:00",
          });

          // Vendor context milte hi vendor-specific data load karo
          await Promise.all([
            fetchOrders(parsed._id),
            fetchSummary(parsed._id),
            fetchEarnings(parsed._id, earningsPeriod),
            fetchAllProducts(parsed._id),
            fetchVendorComplaints(parsed._id),
            fetchCategories(),
          ]);
        }
      } catch (e) {
        console.error("Initialization error", e);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!vendorData?._id) return;

    // Real-time jaisa behavior: har 8 sec me latest vendor orders fetch karo
    const intervalId = setInterval(() => {
      fetchOrders(vendorData._id);
      fetchSummary(vendorData._id);
      fetchEarnings(vendorData._id, earningsPeriod);
    }, 8000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorData?._id, earningsPeriod]);

  const generateInvoice = (order) => {
    try {
      const doc = new jsPDF();
      const orderId = String(order?._id || "").slice(-6) || "ORDER";
      const safeItems = Array.isArray(order?.items) ? order.items : [];

      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text(vendorData?.shopName || "MINI MART", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Shopkeeper: ${vendorData?.shopkeeperName || "Vendor"}`, 14, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 35);
      doc.text(`Order ID: #${orderId}`, 14, 40);

      const tableRows = safeItems.map((item) => {
        const qty = Number(item?.qty || 0);
        const price = Number(item?.price || 0);
        return [
          item?.name || "Item",
          qty,
          `Rs. ${price.toFixed(2)}`,
          `Rs. ${(qty * price).toFixed(2)}`,
        ];
      });

      autoTable(doc, {
        startY: 50,
        head: [["Item Name", "Quantity", "Price", "Total"]],
        body: tableRows.length > 0 ? tableRows : [["No items", "-", "-", "-"]],
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235] },
      });

      const finalY = (doc.lastAutoTable?.finalY || 60) + 10;
      const grandTotal = Number(order?.totalAmount || 0);
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Grand Total: Rs. ${grandTotal.toFixed(2)}`, 14, finalY);
      doc.save(`Invoice_${orderId}.pdf`);
    } catch (err) {
      console.error("Invoice generation failed:", err);
      alert("Invoice generate nahi ho paaya. Please try again.");
    }
  };

  const fetchOrders = async (vendorIdArg) => {
    const vendorId = vendorIdArg || vendorData?._id;
    if (!vendorId) return;

    try {
      const res = await apiClient.get(`/api/orders/vendor/${vendorId}`);
      const ordersData = Array.isArray(res.data)
        ? res.data
        : res.data.orders || [];
      // Safety filter: agar mixed payload aaye toh bhi sirf current vendor ke orders show karo
      const filteredOrders = ordersData.filter((order) => {
        const topLevelMatch =
          String(order?.vendorId || "") === String(vendorId);
        const itemLevelMatch = Array.isArray(order?.items)
          ? order.items.some(
              (item) => String(item?.vendorId || "") === String(vendorId),
            )
          : false;
        return topLevelMatch || itemLevelMatch;
      });
      setOrders(filteredOrders);
    } catch (err) {
      console.error("Orders fetch fail", err);
    }
  };

  const fetchSummary = async (vendorIdArg) => {
    const vendorId = vendorIdArg || vendorData?._id;
    if (!vendorId) return;

    try {
      const res = await apiClient.get(`/api/vendor/summary/${vendorId}`);
      if (res.data && res.data.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.log("Summary error", err);
    }
  };

  const fetchEarnings = async (vId, periodArg) => {
    const id = vId || vendorData?._id;
    const period = periodArg || earningsPeriod;
    if (!id) return;
    try {
      const res = await apiClient.get(
        `/api/vendor/earnings/${id}?period=${period}`,
      );
      if (res.data.success) setEarnings(res.data);
    } catch (err) {
      console.log("Earnings error", err);
    }
  };

  const handleSendCommission = async () => {
    if (!vendorData?._id) return;
    try {
      const res = await apiClient.post(
        `/api/vendor/send-commission/${vendorData._id}`,
        {
          period: earningsPeriod,
        },
      );
      if (res.data?.success) {
        alert("✅ Admin commission sent.");
        fetchEarnings(vendorData._id, earningsPeriod);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Commission send failed.");
    }
  };

  const handleWithdraw = async () => {
    if (!vendorData?._id) return;
    const numericAmount = Number(withdrawAmount);
    if (!numericAmount || numericAmount <= 0)
      return alert("Valid withdraw amount daaliye.");
    try {
      const res = await apiClient.post(
        `/api/vendor/withdraw/${vendorData._id}`,
        {
          period: earningsPeriod,
          amount: numericAmount,
        },
      );
      if (res.data?.success) {
        alert("✅ Withdrawal successful.");
        setWithdrawAmount("");
        fetchEarnings(vendorData._id, earningsPeriod);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Withdraw failed.");
    }
  };

  const fetchAllProducts = async (vId) => {
    const id = vId || vendorData?._id;
    if (!id) return;
    try {
      const res = await apiClient.get(`/api/products/vendor/${id}`);
      setAllProducts(res.data);
    } catch (err) {
      console.log("Product fetch error", err);
    }
  };

  const fetchVendorComplaints = async (vId) => {
    const id = vId || vendorData?._id;
    if (!id) return;
    setComplaintsLoading(true);
    try {
      const res = await apiClient.get(`/api/complaints/vendor/${id}`);
      if (res.data?.success) {
        setVendorComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.log("Vendor complaints fetch error", err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const handleVendorComplaintUpdate = async (
    complaintId,
    status,
    responseText = "",
    responseHindi = "",
  ) => {
    try {
      const res = await apiClient.put(
        `/api/complaints/vendor/respond/${complaintId}`,
        {
          status,
          resolutionNote: responseText,
          resolutionNoteHindi: responseHindi,
        },
      );
      if (res.data?.success) {
        await fetchVendorComplaints(vendorData?._id);
        if (selectedComplaint && selectedComplaint._id === complaintId) {
          setSelectedComplaint(res.data.complaint);
        }
        setComplaintResponseText("");
        setComplaintResponseHindi("");
      }
      return res.data;
    } catch (err) {
      console.error("Vendor complaint update error", err);
      return {
        success: false,
        message: err?.response?.data?.message || "Update failed",
      };
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/api/admin/categories");
      if (res.data?.success) {
        const activeNames = (res.data.categories || [])
          .filter((c) => c.isActive)
          .map((c) => c.name)
          .filter(Boolean);
        if (activeNames.length > 0) {
          setCategoriesList(activeNames);
        }
      }
    } catch (err) {
      console.log("Categories fetch error", err);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await apiClient.put(`/api/orders/update-status/${id}`, {
        status: newStatus,
      });
      alert(`Order ${newStatus} ho gaya!`);
      fetchOrders(vendorData?._id);
      fetchSummary(vendorData?._id);
    } catch (err) {
      alert("Status update fail!");
    }
  };

  const getStatusBadgeStyle = (status) => {
    if (status === "Delivered") return "bg-green-500";
    if (status === "Out for Delivery") return "bg-amber-500";
    if (status === "Ready for Delivery") return "bg-blue-500";
    if (status === "Packed") return "bg-purple-500";
    return "bg-orange-500";
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!vendorData?._id) return alert("Vendor ID missing!");
    if (!image) return alert("Please select a product image!");

    setSubmitting(true);
    const formData = new FormData();
    Object.keys(productData).forEach((key) =>
      formData.append(key, productData[key]),
    );
    formData.append("image", image);
    formData.append("vendorId", vendorData._id);

    try {
      await apiClient.post("/api/products/add", formData);
      alert("✅ Product Add Ho Gaya!");
      setProductData({
        name: "",
        price: "",
        category: "",
        unitType: "weight",
        weight: "",
        quantity: "",
        expiryDate: "",
      });
      setImage(null);
      fetchAllProducts(vendorData._id);
    } catch (err) {
      alert("❌ Product add nahi hua!");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriceUpdate = async (id, currentPrice, currentDiscount) => {
    const newPrice = prompt("Naya Price daalein:", currentPrice);
    const newDiscount = prompt("Discount % daalein (0-100):", currentDiscount);
    const isDeal = window.confirm("Kya ise 'Deal of the Day' banana hai?");

    if (newPrice !== null && newDiscount !== null) {
      try {
        await apiClient.put(`/api/products/update-price/${id}`, {
          price: newPrice,
          discount: Number(newDiscount),
          isDealOfTheDay: isDeal,
        });
        alert("✅ Update Successful!");
        fetchAllProducts(vendorData._id);
      } catch (err) {
        alert("❌ Update fail ho gaya!");
      }
    }
  };

  const toggleStockStatus = async (id, currentStatus) => {
    try {
      await apiClient.put(`/api/products/update-stock/${id}`, {
        inStock: !currentStatus,
      });
      fetchAllProducts(vendorData._id);
    } catch (err) {
      alert("❌ Stock update fail!");
    }
  };

  const handleSettingsUpdate = async () => {
    setSubmitting(true);
    try {
      await apiClient.put(`/api/vendor/update-settings/${vendorData._id}`, {
        serviceableRadius: settings.serviceableRadius,
        minOrderValue: settings.minOrderValue,
        storeTimings: { open: settings.openTime, close: settings.closeTime },
      });
      alert("✅ Settings Saved!");
    } catch (err) {
      alert("Settings update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <h1 className="text-xl font-black text-blue-600 animate-bounce">
          LOADING DASHBOARD... 🛒
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-20 font-sans">
      {/* Header Section */}
      <div className="bg-blue-600 p-8 text-white rounded-b-[3rem] shadow-lg mb-8 border-b-4 border-blue-700">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black uppercase italic tracking-widest">
              Vendor Dashboard 🏪
            </h1>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">
              {vendorData?.shopName || "My Store"} | Welcome,{" "}
              {vendorData?.shopkeeperName}
            </p>
          </div>
          <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-md overflow-x-auto">
            {[
              "dashboard",
              "inventory",
              "complaints",
              "payouts",
              "settings",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-lg" : "text-white"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {activeTab === "dashboard" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <SummaryCard
                title="Today's Sales"
                value={`₹${summary?.todaySales || 0}`}
                color="bg-green-500"
                icon="💰"
              />
              <SummaryCard
                title="Pending"
                value={summary?.pendingOrders || 0}
                color="bg-orange-500"
                icon="📦"
              />
              <SummaryCard
                title="Completed"
                value={summary?.deliveredOrders || 0}
                color="bg-purple-500"
                icon="✅"
              />
              <SummaryCard
                title="Low Stock"
                value={summary?.lowStockCount || 0}
                color="bg-red-500"
                icon="⚠️"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl">
                <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">
                  Complaints Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">
                      Total Complaints
                    </span>
                    <span className="text-xl font-black text-gray-900">
                      {vendorComplaints.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">
                      Open
                    </span>
                    <span className="text-xl font-black text-orange-500">
                      {
                        vendorComplaints.filter((c) => c.status === "open")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">
                      In Progress
                    </span>
                    <span className="text-xl font-black text-amber-500">
                      {
                        vendorComplaints.filter(
                          (c) => c.status === "in-progress",
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">
                      Resolved
                    </span>
                    <span className="text-xl font-black text-green-500">
                      {
                        vendorComplaints.filter((c) => c.status === "resolved")
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[3rem] shadow-xl">
                  <h2 className="text-xs font-black text-blue-500 uppercase mb-6 tracking-widest italic flex items-center gap-2">
                    Add New Item
                  </h2>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      className="w-full p-4 bg-gray-50 rounded-2xl border text-sm outline-none focus:ring-2 focus:ring-blue-400"
                      value={productData.name}
                      onChange={(e) =>
                        setProductData({ ...productData, name: e.target.value })
                      }
                      required
                    />

                    <input
                      type="number"
                      placeholder="Price (₹)"
                      className="w-full p-4 bg-gray-50 rounded-2xl border text-sm outline-none focus:ring-2 focus:ring-blue-400"
                      value={productData.price}
                      onChange={(e) =>
                        setProductData({
                          ...productData,
                          price: e.target.value,
                        })
                      }
                      required
                    />

                    <select
                      className="w-full p-4 bg-gray-50 rounded-2xl border text-xs font-bold text-gray-500 outline-none focus:ring-2 focus:ring-blue-400"
                      value={productData.category}
                      onChange={(e) =>
                        setProductData({
                          ...productData,
                          category: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Category 📁</option>
                      {categoriesList.map((cat, index) => (
                        <option key={index} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <select
                        className="w-1/2 p-4 bg-gray-50 rounded-2xl border text-xs font-bold text-gray-500 outline-none focus:ring-2 focus:ring-blue-400"
                        value={productData.unitType}
                        onChange={(e) =>
                          setProductData({
                            ...productData,
                            unitType: e.target.value,
                          })
                        }
                      >
                        <option value="weight">Weight</option>
                        <option value="quantity">Quantity (Pcs)</option>
                        <option value="packet">Packet</option>
                      </select>
                      <input
                        type="text"
                        placeholder={
                          productData.unitType === "packet"
                            ? "Packet label (e.g. 1 Packet)"
                            : productData.unitType === "quantity"
                              ? "Optional note"
                              : "Weight (e.g. 500g, 1kg)"
                        }
                        className="w-1/2 p-4 bg-gray-50 rounded-2xl border text-xs"
                        value={productData.weight}
                        onChange={(e) =>
                          setProductData({
                            ...productData,
                            weight: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder={
                          productData.unitType === "packet"
                            ? "Packets (sell unit)"
                            : productData.unitType === "quantity"
                              ? "Pieces (sell unit)"
                              : "Stock / extra qty"
                        }
                        className="w-full p-4 bg-gray-50 rounded-2xl border text-xs"
                        value={productData.quantity}
                        onChange={(e) =>
                          setProductData({
                            ...productData,
                            quantity: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[9px] font-black text-gray-400 ml-3 mb-1 uppercase">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-4 bg-gray-50 rounded-2xl border text-xs text-gray-500"
                        value={productData.expiryDate}
                        onChange={(e) =>
                          setProductData({
                            ...productData,
                            expiryDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 text-center">
                      <input
                        type="file"
                        className="text-[10px] font-bold text-blue-600"
                        onChange={(e) => setImage(e.target.files[0])}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.8rem] shadow-lg uppercase text-[10px] tracking-widest hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {submitting ? "Uploading..." : "Upload Item"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center px-4">
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest italic">
                    Real-Time Orders 🚚
                  </h2>
                  <button
                    onClick={() => {
                      fetchOrders(vendorData?._id);
                      fetchSummary(vendorData?._id);
                    }}
                    className="text-[10px] font-black text-blue-600 uppercase"
                  >
                    Refresh 🔄
                  </button>
                </div>
                {orders.length === 0 ? (
                  <div className="bg-white p-10 rounded-[3rem] text-center text-gray-400 font-bold uppercase text-[10px]">
                    No orders yet
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-white p-6 rounded-[2.8rem] shadow-sm border-l-[10px] border-blue-500"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase">
                            ID: #{order?._id?.slice(-6)}
                          </p>
                          <h3 className="text-lg font-black text-gray-800 italic">
                            ₹{order.totalAmount}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => generateInvoice(order)}
                            className="bg-gray-100 text-blue-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase"
                          >
                            📄 Bill
                          </button>
                          <span
                            className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase ${getStatusBadgeStyle(order.status)} text-white`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-3xl mb-4">
                        {order.items?.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-1"
                          >
                            <p className="text-[11px] font-bold text-gray-600">
                              {item.name}
                            </p>
                            <p className="text-[11px] font-black text-blue-600">
                              x{item.qty}
                            </p>
                          </div>
                        ))}
                      </div>
                      {order.deliveryPartner?.name && (
                        <p className="text-[10px] font-black text-amber-700 mb-3 uppercase tracking-tight">
                          🚚 Rider: {order.deliveryPartner.name} (
                          {order.deliveryPartner.mobileNumber})
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "Packed")
                          }
                          disabled={
                            order.status === "Packed" ||
                            order.status === "Ready for Delivery" ||
                            order.status === "Delivered"
                          }
                          className="border-2 border-purple-600 text-purple-600 py-2 rounded-2xl text-[9px] font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Pack
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "Ready for Delivery")
                          }
                          disabled={
                            order.status === "Ready for Delivery" ||
                            order.status === "Delivered"
                          }
                          className="border-2 border-blue-600 text-blue-600 py-2 rounded-2xl text-[9px] font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Ready
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "Delivered")
                          }
                          disabled={
                            order.status === "Delivered" ||
                            Boolean(
                              order.deliveryPartner?._id ||
                              order.deliveryPartner,
                            )
                          }
                          title={
                            order.deliveryPartner
                              ? "Rider assign hai — delivery rider app se complete hogi"
                              : ""
                          }
                          className="bg-green-500 text-white py-2 rounded-2xl text-[9px] font-black uppercase shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Deliver
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "inventory" && (
          <div className="bg-white p-8 rounded-[3rem] shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-black italic text-gray-800 uppercase">
                Pricing & Inventory 🏷️
              </h2>
              <button
                onClick={() => fetchAllProducts()}
                className="text-[10px] font-black text-blue-600 uppercase"
              >
                Refresh 🔄
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                    <th className="pb-4">Product</th>
                    <th className="pb-4 text-center">Stock</th>
                    <th className="pb-4 text-center">Weight / Qty / Packet</th>
                    <th className="pb-4">Price</th>
                    <th className="pb-4">Discount</th>
                    <th className="pb-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allProducts.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="py-4 font-bold text-sm">
                        {item.name}
                        {!item.inStock && (
                          <span className="ml-2 text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            Out
                          </span>
                        )}
                        <p className="text-[9px] text-gray-400">
                          {item.category}
                        </p>
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() =>
                            toggleStockStatus(item._id, item.inStock)
                          }
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${item.inStock ? "bg-green-100 text-green-600" : "bg-red-500 text-white"}`}
                        >
                          {item.inStock ? "In Stock" : "Out of Stock"}
                        </button>
                      </td>
                      <td className="py-4 text-center align-middle">
                        <SellUnitEditor
                          item={item}
                          onSaved={() => fetchAllProducts(vendorData?._id)}
                        />
                      </td>
                      <td className="py-4 font-black text-blue-600">
                        ₹{item.price}
                      </td>
                      <td className="py-4 text-xs font-bold text-green-500">
                        {item.discount || 0}% OFF
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() =>
                            handlePriceUpdate(
                              item._id,
                              item.price,
                              item.discount,
                            )
                          }
                          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="bg-white p-8 rounded-[3rem] shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-black italic text-gray-800 uppercase">
                Vendor Complaints 📣
              </h2>
              <button
                onClick={() => fetchVendorComplaints(vendorData?._id)}
                className="text-[10px] font-black text-blue-600 uppercase"
              >
                Refresh 🔄
              </button>
            </div>

            {complaintsLoading ? (
              <div className="text-center py-16 text-gray-500 font-black">
                Loading complaints...
              </div>
            ) : vendorComplaints.length === 0 ? (
              <div className="text-center py-16 text-gray-500 font-black">
                No complaints filed against your products yet.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-gray-500">
                      Total Complaints
                    </p>
                    <p className="text-3xl font-black text-gray-900">
                      {vendorComplaints.length}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-gray-500">
                      Open
                    </p>
                    <p className="text-3xl font-black text-orange-600">
                      {
                        vendorComplaints.filter((c) => c.status === "open")
                          .length
                      }
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-gray-500">
                      Resolved
                    </p>
                    <p className="text-3xl font-black text-green-700">
                      {
                        vendorComplaints.filter((c) => c.status === "resolved")
                          .length
                      }
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-[3rem] shadow-xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <th className="p-4">Date</th>
                        <th className="p-4">Product</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {vendorComplaints.map((complaint) => (
                        <tr key={complaint._id} className="hover:bg-gray-50">
                          <td className="p-4 text-sm text-gray-600">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 font-bold text-sm text-gray-800">
                            {complaint.productName}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {complaint.userId?.firstName}{" "}
                            {complaint.userId?.lastName}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {complaint.category}
                          </td>
                          <td className="p-4 text-sm font-black uppercase text-gray-700">
                            {complaint.status}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setComplaintResponseText(
                                  complaint.resolutionNote || "",
                                );
                                setComplaintResponseHindi(
                                  complaint.resolutionNoteHindi || "",
                                );
                              }}
                              className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-700"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedComplaint && (
                  <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">
                          Complaint Details
                        </h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          {selectedComplaint.productName}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedComplaint(null)}
                        className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black uppercase text-gray-500 mb-2">
                          Customer
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {selectedComplaint.userId?.firstName}{" "}
                          {selectedComplaint.userId?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedComplaint.userId?.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedComplaint.userId?.mobileNumber}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black uppercase text-gray-500 mb-2">
                          Status
                        </p>
                        <p className="text-sm font-black uppercase text-gray-900">
                          {selectedComplaint.status}
                        </p>
                        <p className="mt-3 text-[10px] font-black uppercase text-gray-500 mb-1">
                          Category
                        </p>
                        <p className="text-sm text-gray-700">
                          {selectedComplaint.category}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-4">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-2">
                        Complaint
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {selectedComplaint.reason}
                      </p>
                      {selectedComplaint.reasonHindi && (
                        <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">
                          {selectedComplaint.reasonHindi}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <textarea
                        rows="4"
                        value={complaintResponseText}
                        onChange={(e) =>
                          setComplaintResponseText(e.target.value)
                        }
                        placeholder="Write response / update for customer"
                        className="w-full p-4 rounded-3xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <textarea
                        rows="3"
                        value={complaintResponseHindi}
                        onChange={(e) =>
                          setComplaintResponseHindi(e.target.value)
                        }
                        placeholder="Response in Hindi (optional)"
                        className="w-full p-4 rounded-3xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={async () => {
                            const res = await handleVendorComplaintUpdate(
                              selectedComplaint._id,
                              "in-progress",
                              complaintResponseText,
                              complaintResponseHindi,
                            );
                            if (res?.success) {
                              alert("Complaint opened and set to in-progress.");
                            }
                          }}
                          className="w-full sm:w-auto bg-orange-500 text-white px-5 py-3 rounded-3xl font-black uppercase hover:bg-orange-600"
                        >
                          Open
                        </button>
                        <button
                          onClick={async () => {
                            const res = await handleVendorComplaintUpdate(
                              selectedComplaint._id,
                              "resolved",
                              complaintResponseText,
                              complaintResponseHindi,
                            );
                            if (res?.success) {
                              alert("Complaint marked resolved.");
                            }
                          }}
                          className="w-full sm:w-auto bg-green-600 text-white px-5 py-3 rounded-3xl font-black uppercase hover:bg-green-700"
                        >
                          Solve / Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "payouts" && (
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl">
            <h2 className="text-xl font-black italic text-gray-800 uppercase mb-4 border-b pb-4">
              Financial Reports 💰
            </h2>

            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: "today", label: "Today" },
                { id: "monthly", label: "Monthly" },
                { id: "yearly", label: "Yearly" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setEarningsPeriod(item.id);
                    fetchEarnings(vendorData?._id, item.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${earningsPeriod === item.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <FinanceCard
                title="Today Total Earnings"
                value={earnings.grossEarnings}
                color="bg-blue-50"
                textColor="text-blue-700"
              />
              <FinanceCard
                title="Admin Commission (10%)"
                value={earnings.adminCommission}
                color="bg-red-50"
                textColor="text-red-700"
                prefix="- ₹"
              />
              <FinanceCard
                title="Vendor Net Earnings"
                value={earnings.vendorNetBeforeWithdraw}
                color="bg-green-50"
                textColor="text-green-700"
              />
              <FinanceCard
                title="Admin Net Commission"
                value={earnings.adminNetCommission}
                color="bg-orange-50"
                textColor="text-orange-700"
              />
              <FinanceCard
                title="Vendor Net After Withdraw"
                value={earnings.vendorNetAfterWithdraw}
                color="bg-emerald-50"
                textColor="text-emerald-700"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  Vendor Withdraw ({earningsPeriod})
                </p>
                <p className="text-xs font-bold text-gray-500 mb-3">
                  Available: ₹
                  {Number(earnings.vendorNetAfterWithdraw || 0).toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1 p-3 rounded-xl border bg-white text-xs font-bold outline-none"
                  />
                  <button
                    onClick={handleWithdraw}
                    className="bg-green-600 text-white px-4 rounded-xl text-[10px] font-black uppercase"
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  Send Admin Commission ({earningsPeriod})
                </p>
                <p className="text-xs font-bold text-gray-500 mb-3">
                  Due: ₹{Number(earnings.adminNetCommission || 0).toFixed(2)}
                </p>
                <button
                  onClick={handleSendCommission}
                  className="w-full bg-red-600 text-white py-3 rounded-xl text-[10px] font-black uppercase"
                >
                  Send {earningsPeriod} Commission
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3.5rem] shadow-xl">
            <h2 className="text-xl font-black italic text-gray-800 uppercase mb-8 border-b pb-4">
              Store Configuration ⚙️
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Open Time
                  </label>
                  <input
                    type="time"
                    className="w-full p-4 bg-gray-50 rounded-2xl border"
                    value={settings.openTime}
                    onChange={(e) =>
                      setSettings({ ...settings, openTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Close Time
                  </label>
                  <input
                    type="time"
                    className="w-full p-4 bg-gray-50 rounded-2xl border"
                    value={settings.closeTime}
                    onChange={(e) =>
                      setSettings({ ...settings, closeTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase">
                  Delivery Radius (KM)
                </label>
                <input
                  type="number"
                  className="w-full p-4 bg-gray-50 rounded-2xl border"
                  value={settings.serviceableRadius}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      serviceableRadius: e.target.value,
                    })
                  }
                />
              </div>
              <button
                onClick={handleSettingsUpdate}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl disabled:bg-gray-400"
              >
                {submitting ? "Updating..." : "Update Shop Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, color, icon }) => (
  <div className="bg-white p-5 rounded-[2.2rem] shadow-sm flex items-center gap-4 hover:scale-105 transition-all">
    <div
      className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white`}
    >
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase">{title}</p>
      <h2 className="text-lg font-black text-gray-800 italic">{value}</h2>
    </div>
  </div>
);

const FinanceCard = ({ title, value, color, textColor, prefix = "₹" }) => (
  <div className={`${color} p-5 rounded-[2rem]`}>
    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">
      {title}
    </p>
    <h2 className={`text-2xl font-black ${textColor}`}>
      {prefix}
      {Number(value || 0).toFixed(2)}
    </h2>
  </div>
);

export default Vendor;
