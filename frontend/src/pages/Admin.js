import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('today');
  const [typeFilter, setTypeFilter] = useState('all');
  const [masterStats, setMasterStats] = useState({
    totalRevenue: 0,
    commissionEarned: 0,
    activeVendors: 0,
    activeUsers: 0,
    liveOrders: 0
  });
  const [overview, setOverview] = useState({
    grossEarnings: 0,
    expectedAdminCommission: 0,
    adminCommissionReceived: 0,
    pendingAdminCommission: 0,
    vendorNetEarnings: 0,
    vendorWithdrawn: 0,
    vendorNetPayable: 0,
    vendorCount: 0,
    vendorBreakdown: []
  });
  const [transactions, setTransactions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [newPartner, setNewPartner] = useState({ name: '', mobileNumber: '', pin: '' });
  const [disputes, setDisputes] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountType: 'flat',
    discountValue: '',
    minOrderValue: '',
    expiresAt: ''
  });
  const [banners, setBanners] = useState([]);
  const [bannerForm, setBannerForm] = useState({ title: '', imageUrl: '', targetUrl: '', priority: 0 });
  const [notifications, setNotifications] = useState([]);
  const [notificationForm, setNotificationForm] = useState({ audience: 'all', title: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);
  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`
    }
  });

  const fetchAdminFinance = async (selectedPeriod = period, selectedType = typeFilter) => {
    try {
      const [overviewRes, transactionsRes] = await Promise.all([
        apiClient.get(`/api/admin/finance/overview?period=${selectedPeriod}`, getAuthConfig()),
        apiClient.get(`/api/admin/finance/transactions?period=${selectedPeriod}&type=${selectedType}`, getAuthConfig())
      ]);
      if (overviewRes.data?.success) setOverview(overviewRes.data);
      if (transactionsRes.data?.success) setTransactions(transactionsRes.data.transactions || []);
    } catch (err) {
      console.error("Admin finance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterStats = async () => {
    try {
      const res = await apiClient.get('/api/admin/master-statistics', getAuthConfig());
      if (res.data?.success) setMasterStats(res.data);
    } catch (err) {
      console.error("Master stats error:", err);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await apiClient.get('/api/admin/vendors', getAuthConfig());
      if (res.data?.success) setVendors(res.data.vendors || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await apiClient.get('/api/admin/inventory', getAuthConfig());
      if (res.data?.success) setInventory(res.data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/api/admin/categories', getAuthConfig());
      if (res.data?.success) setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/api/admin/orders', getAuthConfig());
      if (res.data?.success) setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeliveryPartners = async () => {
    try {
      const res = await apiClient.get('/api/admin/delivery-partners', getAuthConfig());
      if (res.data?.success) setDeliveryPartners(res.data.partners || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await apiClient.get('/api/admin/disputes', getAuthConfig());
      if (res.data?.success) setDisputes(res.data.disputes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMarketing = async () => {
    try {
      const [promoRes, bannerRes, notifRes] = await Promise.all([
        apiClient.get('/api/admin/promo-codes', getAuthConfig()),
        apiClient.get('/api/admin/banners', getAuthConfig()),
        apiClient.get('/api/admin/notifications', getAuthConfig())
      ]);
      if (promoRes.data?.success) setPromoCodes(promoRes.data.promoCodes || []);
      if (bannerRes.data?.success) setBanners(bannerRes.data.banners || []);
      if (notifRes.data?.success) setNotifications(notifRes.data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin');
    const token = localStorage.getItem('adminToken');
    if (!savedAdmin || !token) {
      navigate('/admin-auth');
      return;
    }
    setAdminProfile(JSON.parse(savedAdmin));

    fetchMasterStats();
    fetchAdminFinance(period, typeFilter);
    fetchVendors();
    fetchInventory();
    fetchCategories();
    fetchOrders();
    fetchDeliveryPartners();
    fetchDisputes();
    fetchMarketing();
    const timer = setInterval(() => {
      fetchMasterStats();
      fetchAdminFinance(period, typeFilter);
      fetchVendors();
      fetchInventory();
      fetchCategories();
      fetchOrders();
      fetchDeliveryPartners();
      fetchDisputes();
      fetchMarketing();
    }, 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, typeFilter, navigate]);

  const exportCsv = async () => {
    try {
      const res = await apiClient.get(
        `/api/admin/finance/export?period=${period}&type=${typeFilter}`,
        { ...getAuthConfig(), responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-finance-${period}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("CSV export failed. Please login again.");
    }
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;
  const formatTxnType = (type) => (type === "commission_sent" ? "Commission Sent" : "Withdrawal");

  const updateVendorApproval = async (vendorId, approvalStatus) => {
    await apiClient.put(`/api/admin/vendors/${vendorId}/approval`, { approvalStatus }, getAuthConfig());
    fetchVendors();
  };

  const updateVendorCommission = async (vendor) => {
    const newRate = prompt("New commission %", vendor.commissionRate ?? 10);
    if (newRate === null) return;
    await apiClient.put(`/api/admin/vendors/${vendor._id}/commission`, { commissionRate: Number(newRate) }, getAuthConfig());
    fetchVendors();
  };

  const toggleProductVisibility = async (product, actionType) => {
    const payload = {
      isHidden: product.isHidden,
      isBanned: product.isBanned
    };
    if (actionType === "hide") payload.isHidden = !product.isHidden;
    if (actionType === "ban") payload.isBanned = !product.isBanned;
    await apiClient.put(`/api/admin/products/${product._id}/visibility`, payload, getAuthConfig());
    fetchInventory();
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await apiClient.post('/api/admin/categories', { name: newCategory.trim() }, getAuthConfig());
    setNewCategory('');
    fetchCategories();
  };

  const toggleCategory = async (id) => {
    await apiClient.put(`/api/admin/categories/${id}/toggle`, {}, getAuthConfig());
    fetchCategories();
  };

  const addPartner = async () => {
    if (!newPartner.name || !newPartner.mobileNumber || !newPartner.pin) {
      alert("Name, mobile aur PIN (min 4 digit) zaroori hain.");
      return;
    }
    try {
      await apiClient.post('/api/admin/delivery-partners', newPartner, getAuthConfig());
      setNewPartner({ name: '', mobileNumber: '', pin: '' });
      fetchDeliveryPartners();
      alert("Partner add ho gaya.");
    } catch (err) {
      alert(err?.response?.data?.message || "Add fail — login / network check karein.");
    }
  };

  const assignPartner = async (orderId, partnerId) => {
    await apiClient.put(`/api/admin/orders/${orderId}/assign-delivery`, { deliveryPartnerId: partnerId }, getAuthConfig());
    fetchOrders();
  };

  const resolveDispute = async (disputeId) => {
    const resolutionNote = prompt("Resolution note") || "Resolved by admin";
    await apiClient.put(`/api/admin/disputes/${disputeId}/resolve`, { resolutionNote }, getAuthConfig());
    fetchDisputes();
  };

  const markSettlementPaid = async (id) => {
    await apiClient.put(`/api/admin/finance/settlement/${id}/mark-paid`, {}, getAuthConfig());
    fetchAdminFinance(period, typeFilter);
  };

  const createPromoCode = async () => {
    if (!promoForm.code?.trim()) {
      alert('Promo code likho.');
      return;
    }
    try {
      await apiClient.post('/api/admin/promo-codes', promoForm, getAuthConfig());
      setPromoForm({ code: '', discountType: 'flat', discountValue: '', minOrderValue: '', expiresAt: '' });
      fetchMarketing();
      alert('Promo ban gaya.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Promo create fail — discount number me ho (10% nahi, sirf 10).');
    }
  };

  const togglePromo = async (id) => {
    await apiClient.put(`/api/admin/promo-codes/${id}/toggle`, {}, getAuthConfig());
    fetchMarketing();
  };

  const createBanner = async () => {
    await apiClient.post('/api/admin/banners', bannerForm, getAuthConfig());
    setBannerForm({ title: '', imageUrl: '', targetUrl: '', priority: 0 });
    fetchMarketing();
  };

  const toggleBanner = async (id) => {
    await apiClient.put(`/api/admin/banners/${id}/toggle`, {}, getAuthConfig());
    fetchMarketing();
  };

  const sendNotification = async () => {
    await apiClient.post('/api/admin/notifications', notificationForm, getAuthConfig());
    setNotificationForm({ audience: 'all', title: '', message: '' });
    fetchMarketing();
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    navigate('/admin-auth');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-black text-gray-800 uppercase italic">Admin Finance Panel</h1>
            <div className="flex items-center gap-2">
              {adminProfile?.fullName && (
                <span className="text-[10px] font-black uppercase text-gray-500">Hi, {adminProfile.fullName}</span>
              )}
              <button
                onClick={exportCsv}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Export CSV
              </button>
              <button
                onClick={handleAdminLogout}
                className="bg-red-100 text-red-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-5">
            {["overview", "vendors", "inventory", "orders", "payouts", "marketing"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${activeTab === tab ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {["today", "monthly", "yearly"].map((item) => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${period === item ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {item}
              </button>
            ))}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-gray-100 text-gray-600 outline-none"
            >
              <option value="all">All Transactions</option>
              <option value="commission_sent">Commission Sent</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
          </div>
        </div>

        {activeTab === "overview" && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <InfoCard title="Total Revenue" value={formatCurrency(masterStats.totalRevenue)} tone="blue" />
          <InfoCard title="Commission Earned" value={formatCurrency(masterStats.commissionEarned)} tone="green" />
          <InfoCard title="Active Vendors" value={masterStats.activeVendors} tone="purple" />
          <InfoCard title="Active Users" value={masterStats.activeUsers} tone="teal" />
          <InfoCard title="Live Orders" value={masterStats.liveOrders} tone="orange" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <InfoCard title="Today Total Earnings" value={formatCurrency(overview.grossEarnings)} tone="blue" />
          <InfoCard title="Expected Admin Commission (10%)" value={formatCurrency(overview.expectedAdminCommission)} tone="red" />
          <InfoCard title="Admin Net Commission Received" value={formatCurrency(overview.adminCommissionReceived)} tone="green" />
          <InfoCard title="Pending Admin Commission" value={formatCurrency(overview.pendingAdminCommission)} tone="orange" />
          <InfoCard title="Vendor Net Earnings" value={formatCurrency(overview.vendorNetEarnings)} tone="emerald" />
          <InfoCard title="Vendor Withdrawn" value={formatCurrency(overview.vendorWithdrawn)} tone="purple" />
          <InfoCard title="Vendor Net Payable" value={formatCurrency(overview.vendorNetPayable)} tone="teal" />
          <InfoCard title="Active Vendors" value={overview.vendorCount} tone="gray" />
        </div>
        </>
        )}

        {activeTab === "vendors" && (
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-black text-gray-800 uppercase italic">Vendor Approval & Performance</h2>
          </div>
          <div className="overflow-x-auto max-h-[540px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-500">
                  <th className="p-4">Shop</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Commission</th>
                  <th className="p-4">Sales</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map((v) => (
                  <tr key={v._id}>
                    <td className="p-4">
                      <p className="text-sm font-black text-gray-700">{v.shopName}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{v.shopkeeperName}</p>
                    </td>
                    <td className="p-4 text-xs font-black uppercase">{v.approvalStatus}</td>
                    <td className="p-4 text-xs font-black text-blue-700">{v.commissionRate || 10}%</td>
                    <td className="p-4 text-xs font-black text-green-700">{formatCurrency(v.totalSales)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => updateVendorApproval(v._id, "approved")} className="px-3 py-1 rounded-lg text-[10px] font-black bg-green-100 text-green-600 uppercase">Approve</button>
                        <button onClick={() => updateVendorApproval(v._id, "rejected")} className="px-3 py-1 rounded-lg text-[10px] font-black bg-red-100 text-red-600 uppercase">Reject</button>
                        <button onClick={() => updateVendorCommission(v)} className="px-3 py-1 rounded-lg text-[10px] font-black bg-blue-100 text-blue-600 uppercase">Set %</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeTab === "inventory" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 uppercase italic">Category Management</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input value={newCategory} onChange={(e)=>setNewCategory(e.target.value)} placeholder="New category name" className="flex-1 p-3 rounded-xl border text-sm font-bold" />
                <button onClick={addCategory} className="px-4 py-3 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase">Add</button>
              </div>
              <div className="space-y-2 max-h-[340px] overflow-y-auto">
                {categories.map((c) => (
                  <div key={c._id} className="flex justify-between items-center bg-gray-50 border rounded-xl p-3">
                    <p className="text-sm font-black text-gray-700">{c.name}</p>
                    <button onClick={() => toggleCategory(c._id)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${c.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 uppercase italic">Global Inventory</h2>
            </div>
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-500">
                    <th className="p-4">Product</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Flags</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventory.map((item) => (
                    <tr key={item._id}>
                      <td className="p-4">
                        <p className="text-sm font-black text-gray-700">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{item.category}</p>
                      </td>
                      <td className="p-4 text-xs font-black">{item.vendor?.shopName || "Unknown"}</td>
                      <td className="p-4 text-xs font-black">{item.quantity ?? 0}</td>
                      <td className="p-4 text-xs font-black">{item.isBanned ? "Banned" : item.isHidden ? "Hidden" : "Visible"}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => toggleProductVisibility(item, "hide")} className="px-3 py-1 rounded-lg bg-orange-100 text-orange-600 text-[10px] font-black uppercase">{item.isHidden ? "Unhide" : "Hide"}</button>
                          <button onClick={() => toggleProductVisibility(item, "ban")} className="px-3 py-1 rounded-lg bg-red-100 text-red-600 text-[10px] font-black uppercase">{item.isBanned ? "Unban" : "Ban"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {activeTab === "orders" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-x-auto">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 uppercase italic">Delivery Partners</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-3 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input placeholder="Name" value={newPartner.name} onChange={(e)=>setNewPartner({...newPartner, name: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold" />
                  <input placeholder="Mobile" value={newPartner.mobileNumber} onChange={(e)=>setNewPartner({...newPartner, mobileNumber: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold" />
                </div>
                <input type="password" inputMode="numeric" placeholder="PIN (4+ digit)" value={newPartner.pin} onChange={(e)=>setNewPartner({...newPartner, pin: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold" />
                <button type="button" onClick={addPartner} className="w-full py-3.5 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest shadow-md hover:bg-black">
                  Add partner
                </button>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {deliveryPartners.map((p) => (
                  <div key={p._id} className="bg-gray-50 border rounded-xl p-3">
                    <p className="text-sm font-black">{p.name}</p>
                    <p className="text-[10px] text-gray-500 font-bold">{p.mobileNumber}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 uppercase italic">Order Lifecycle</h2>
            </div>
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-500">
                    <th className="p-4">Order</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Delivery Partner</th>
                    <th className="p-4">Assign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm font-bold text-gray-500">
                        Abhi koi order nahi — pehle customer se checkout / order place karwao, phir yahan assign dikhega.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o._id}>
                        <td className="p-4 text-xs font-black">#{String(o._id).slice(-6).toUpperCase()}</td>
                        <td className="p-4 text-xs font-black">{o.status}</td>
                        <td className="p-4 text-xs font-black">{o.deliveryPartner?.name || "Not assigned"}</td>
                        <td className="p-4">
                          <select
                            className="text-xs border rounded-lg p-2 max-w-[160px] w-full"
                            onChange={(e) => assignPartner(o._id, e.target.value)}
                            value={o.deliveryPartner?._id || ""}
                          >
                            <option value="">Select rider</option>
                            {deliveryPartners.map((p) => (
                              <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 xl:col-span-2">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 uppercase italic">Dispute Resolution</h2>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-500">
                    <th className="p-4">Order</th>
                    <th className="p-4">Raised By</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {disputes.map((d) => (
                    <tr key={d._id}>
                      <td className="p-4 text-xs font-black">#{String(d.orderId).slice(-6).toUpperCase()}</td>
                      <td className="p-4 text-xs font-black">{d.raisedBy}</td>
                      <td className="p-4 text-xs font-bold">{d.reason}</td>
                      <td className="p-4 text-xs font-black">{d.status}</td>
                      <td className="p-4">
                        {d.status !== "resolved" && (
                          <button onClick={() => resolveDispute(d._id)} className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-black uppercase">Resolve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {activeTab === "payouts" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 uppercase italic">Transaction History</h2>
            </div>
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-500">
                    <th className="p-4">Txn ID</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Time</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((txn) => (
                    <tr key={txn._id}>
                      <td className="p-4 text-[10px] font-black text-gray-500">#{String(txn._id).slice(-8).toUpperCase()}</td>
                      <td className="p-4">
                        <p className="text-sm font-black text-gray-700">{txn.vendorId?.shopName || "Unknown Shop"}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{txn.vendorId?.shopkeeperName || "-"}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${txn.type === "commission_sent" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                          {formatTxnType(txn.type)}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-black text-gray-800">{formatCurrency(txn.amount)}</td>
                      <td className="p-4 text-[10px] font-black text-gray-500">
                        {new Date(txn.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {txn.type === "withdrawal" && txn.status !== "paid" && (
                          <button onClick={() => markSettlementPaid(txn._id)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-[10px] font-black text-gray-400 uppercase" colSpan={6}>
                        {loading ? "Loading finance data..." : "No transactions in selected filter"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {activeTab === "marketing" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 uppercase italic">Promo Codes</h2>
            </div>
            <div className="p-6 space-y-3">
              <input placeholder="Code" value={promoForm.code} onChange={(e)=>setPromoForm({...promoForm, code: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold" />
              <div className="grid grid-cols-2 gap-2">
                <select value={promoForm.discountType} onChange={(e)=>setPromoForm({...promoForm, discountType: e.target.value})} className="p-3 rounded-xl border text-sm font-bold">
                  <option value="flat">Flat</option>
                  <option value="percentage">Percentage</option>
                </select>
                <input placeholder="Amount (10 ya 50)" value={promoForm.discountValue} onChange={(e)=>setPromoForm({...promoForm, discountValue: e.target.value})} className="p-3 rounded-xl border text-sm font-bold" title="Percentage = sirf number, % sign optional" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Min order" value={promoForm.minOrderValue} onChange={(e)=>setPromoForm({...promoForm, minOrderValue: e.target.value})} className="p-3 rounded-xl border text-sm font-bold" />
                <input type="date" value={promoForm.expiresAt} onChange={(e)=>setPromoForm({...promoForm, expiresAt: e.target.value})} className="p-3 rounded-xl border text-sm font-bold" />
              </div>
              <button onClick={createPromoCode} className="w-full py-3 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase">Create Promo</button>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {promoCodes.map((p)=><div key={p._id} className="flex justify-between bg-gray-50 p-2 rounded-lg"><span className="text-xs font-black">{p.code}</span><button onClick={()=>togglePromo(p._id)} className="text-[10px] font-black">{p.isActive ? "Disable" : "Enable"}</button></div>)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 uppercase italic">Banners</h2>
            </div>
            <div className="p-6 space-y-3">
              <input placeholder="Title" value={bannerForm.title} onChange={(e)=>setBannerForm({...bannerForm, title: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold" />
              <input placeholder="Image URL" value={bannerForm.imageUrl} onChange={(e)=>setBannerForm({...bannerForm, imageUrl: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold" />
              <input placeholder="Target URL" value={bannerForm.targetUrl} onChange={(e)=>setBannerForm({...bannerForm, targetUrl: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold" />
              <input placeholder="Priority" value={bannerForm.priority} onChange={(e)=>setBannerForm({...bannerForm, priority: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold" />
              <button onClick={createBanner} className="w-full py-3 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase">Add Banner</button>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {banners.map((b)=><div key={b._id} className="flex justify-between bg-gray-50 p-2 rounded-lg"><span className="text-xs font-black">{b.title}</span><button onClick={()=>toggleBanner(b._id)} className="text-[10px] font-black">{b.isActive ? "Disable" : "Enable"}</button></div>)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 uppercase italic">Bulk Notifications</h2>
            </div>
            <div className="p-6 space-y-3">
              <select value={notificationForm.audience} onChange={(e)=>setNotificationForm({...notificationForm, audience: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold">
                <option value="all">All</option>
                <option value="users">Users</option>
                <option value="vendors">Vendors</option>
              </select>
              <input placeholder="Title" value={notificationForm.title} onChange={(e)=>setNotificationForm({...notificationForm, title: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold" />
              <textarea placeholder="Message" value={notificationForm.message} onChange={(e)=>setNotificationForm({...notificationForm, message: e.target.value})} className="w-full p-3 rounded-xl border text-sm font-bold h-24" />
              <button onClick={sendNotification} className="w-full py-3 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase">Send</button>
              <div className="max-h-[180px] overflow-y-auto space-y-2">
                {notifications.map((n)=><div key={n._id} className="bg-gray-50 p-2 rounded-lg"><p className="text-xs font-black">{n.title}</p><p className="text-[10px] text-gray-500 font-bold">{n.audience}</p></div>)}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ title, value, tone }) => {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    emerald: "bg-emerald-50 text-emerald-700",
    purple: "bg-purple-50 text-purple-700",
    teal: "bg-teal-50 text-teal-700",
    gray: "bg-gray-100 text-gray-700"
  };

  return (
    <div className={`${toneClasses[tone] || toneClasses.gray} p-5 rounded-[2rem]`}>
      <p className="text-[10px] font-black uppercase opacity-70">{title}</p>
      <h3 className="text-2xl font-black mt-2">{value}</h3>
    </div>
  );
};

export default Admin;