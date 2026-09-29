import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../config/api";

const User = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [currentAddress, setCurrentAddress] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setEditData({
        firstName: parsedUser.firstName || "",
        lastName: parsedUser.lastName || "",
        email: parsedUser.email || "",
      });
      const savedAddresses =
        JSON.parse(localStorage.getItem("userAddresses")) || [];
      setAddresses(savedAddresses);
      const userId = parsedUser.id || parsedUser._id || parsedUser.userId;
      if (!userId) {
        navigate("/login");
        return;
      }
      fetchUserOrders(userId);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchUserOrders = async (userId) => {
    try {
      const res = await apiClient.get(`/api/orders/user/${userId}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Orders load nahi huye", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      // Backend call to update full details
      const response = await apiClient.put("/api/update-profile", {
        mobileNumber: user.mobileNumber,
        ...editData,
      });

      if (response.data.success) {
        // Syncing with existing user data to preserve profilePic and other fields
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
        alert("✅ Profile Details Updated Successfully!");
      }
    } catch (err) {
      alert("❌ Update failed! Check connection or unique email.");
    }
  };

  const handlePhotoClick = () => fileInputRef.current.click();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        // Updating user state and local storage with new profile pic
        const updatedUser = { ...user, profilePic: base64String };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        alert("✅ Profile Photo Updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAddress = () => {
    if (!currentAddress.trim()) return alert("Address likhiye!");
    let updatedList;
    if (editIndex !== null) {
      updatedList = [...addresses];
      updatedList[editIndex] = currentAddress;
      setEditIndex(null);
    } else {
      updatedList = [...addresses, currentAddress];
    }
    setAddresses(updatedList);
    localStorage.setItem("userAddresses", JSON.stringify(updatedList));
    setCurrentAddress("");
  };

  const deleteAddress = (index) => {
    const updatedList = addresses.filter((_, i) => i !== index);
    setAddresses(updatedList);
    localStorage.setItem("userAddresses", JSON.stringify(updatedList));
  };

  const startEdit = (index) => {
    setCurrentAddress(addresses[index]);
    setEditIndex(index);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    alert("Logged out successfully!");
    navigate("/");
    window.location.reload();
  };

  if (!user) return null;

  const displayFirstName = user.firstName || user.name || "User";
  const displayLastName = user.lastName || "";
  const uEmail = user.email || "Not Available";
  const uPhone = user.mobileNumber || user.phone || "Add Mobile";
  const uPass = user.password || "********";
  const trackingSteps = [
    "Placed",
    "Packed",
    "Ready",
    "On the way",
    "Delivered",
  ];

  const getStatusBadgeStyle = (status) => {
    if (status === "Delivered") return "bg-green-100 text-green-600";
    if (status === "Out for Delivery") return "bg-amber-100 text-amber-700";
    if (status === "Ready for Delivery") return "bg-blue-100 text-blue-600";
    if (status === "Packed") return "bg-purple-100 text-purple-600";
    return "bg-orange-100 text-orange-600";
  };

  const getOrderStep = (status) => {
    const normalized = (status || "Pending").toString();
    if (normalized === "Delivered") return 4;
    if (normalized === "Out for Delivery") return 3;
    if (normalized === "Ready for Delivery") return 2;
    if (normalized === "Packed") return 1;
    return 0;
  };

  const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) return "N/A";
    const d = new Date(expiryDate);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-GB");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-40 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-sm text-center border-b border-green-50 sticky top-0 z-40">
        <button
          onClick={() => navigate("/home")}
          className="absolute left-6 top-5 bg-green-50 w-10 h-10 rounded-full flex items-center justify-center text-green-600 font-bold"
        >
          ←
        </button>
        <h1 className="text-sm font-black text-green-600 uppercase tracking-widest italic">
          User Profile
        </h1>
      </div>

      <div className="max-w-md mx-auto px-6 mt-8 space-y-6">
        {/* PROFILE CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-green-100/20 border border-white text-center">
          <div
            className="relative inline-block cursor-pointer"
            onClick={handlePhotoClick}
          >
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt="Profile"
                className="w-24 h-24 rounded-[2rem] mx-auto object-cover border-4 border-green-50 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-[2rem] mx-auto bg-green-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-green-200">
                {displayFirstName.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-lg shadow-lg text-[10px]">
              📸
            </div>
          </div>

          <h2 className="mt-4 text-2xl font-black text-gray-800 uppercase italic tracking-tighter">
            {displayFirstName} {displayLastName}
          </h2>

          <div className="mt-2 inline-block bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
            Verified Customer ✅
          </div>

          <div className="mt-8 space-y-4 border-t pt-6 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Full Details
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-green-600 text-[10px] font-black uppercase"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <input
                  className="w-full p-3 text-xs font-bold rounded-xl border border-green-100 outline-none focus:border-green-500"
                  value={editData.firstName}
                  onChange={(e) =>
                    setEditData({ ...editData, firstName: e.target.value })
                  }
                  placeholder="First Name"
                />
                <input
                  className="w-full p-3 text-xs font-bold rounded-xl border border-green-100 outline-none focus:border-green-500"
                  value={editData.lastName}
                  onChange={(e) =>
                    setEditData({ ...editData, lastName: e.target.value })
                  }
                  placeholder="Last Name"
                />
                <input
                  className="w-full p-3 text-xs font-bold rounded-xl border border-green-100 outline-none focus:border-green-500"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  placeholder="Email Address"
                />
                <button
                  onClick={handleUpdateProfile}
                  className="w-full bg-green-600 text-white font-black py-3 rounded-xl shadow-md uppercase text-[10px] active:scale-95 transition-all"
                >
                  Save Full Details
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Email ID
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    {uEmail}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Mobile
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    {uPhone}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Password
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">
                      {showPassword ? uPass : "••••••••"}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-green-600 font-bold uppercase tracking-tighter"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* COMPLAINT / SHIKAYAT SECTION */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-white">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">
            Complaint / शिकायत
          </h3>
          <p className="text-[11px] text-gray-500 mb-4">
            If you have any issue with a product, submit a complaint here in
            English or Hindi. आपकी कोई भी शिकायत यहाँ दर्ज करें।
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/complaint-form")}
              className="w-full bg-green-600 text-white font-black py-4 rounded-2xl shadow-md uppercase text-[10px] hover:bg-green-700 transition-all"
            >
              File Complaint
            </button>
            <button
              onClick={() => navigate("/my-complaints")}
              className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-md uppercase text-[10px] hover:bg-gray-800 transition-all"
            >
              My Complaints
            </button>
          </div>
        </div>

        {/* ADDRESS SECTION */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-white">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">
            Delivery Address 🏠
          </h3>
          <textarea
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium h-24"
            placeholder="Type your full address with Pincode..."
            value={currentAddress}
            onChange={(e) => setCurrentAddress(e.target.value)}
          />
          <button
            onClick={handleSaveAddress}
            className={`w-full mt-3 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 uppercase text-[10px] tracking-widest ${editIndex !== null ? "bg-blue-600" : "bg-gray-900"}`}
          >
            {editIndex !== null ? "Update Address" : "Save New Address"}
          </button>

          <div className="mt-6 space-y-3">
            {addresses.map((item, index) => (
              <div
                key={index}
                className="bg-[#fdfdfd] p-4 rounded-2xl border border-gray-100 relative shadow-sm hover:border-green-100 transition-all"
              >
                <p className="text-xs text-gray-600 font-bold leading-relaxed">
                  {item}
                </p>
                <div className="flex gap-4 mt-3 border-t pt-2 border-gray-50">
                  <button
                    onClick={() => startEdit(index)}
                    className="text-[10px] font-black text-blue-500 uppercase"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAddress(index)}
                    className="text-[10px] font-black text-red-500 uppercase"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ORDER HISTORY */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-white">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">
            Order History 📦
          </h3>
          <div className="space-y-4">
            {loadingOrders ? (
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase py-4">
                Loading Orders...
              </p>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                        ORDER #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm font-black text-gray-800 italic">
                        ₹{order.totalAmount}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-black px-3 py-1 rounded-full uppercase italic ${getStatusBadgeStyle(order.status)}`}
                    >
                      {order.status || "Processing"}
                    </span>
                  </div>
                  {order.deliveryPartner?.name && (
                    <p className="text-[9px] font-black text-amber-700 uppercase tracking-tight mb-2">
                      Rider: {order.deliveryPartner.name}
                    </p>
                  )}

                  <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-3 space-y-2">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div
                          key={`${order._id}-${idx}`}
                          className="flex justify-between items-center gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                item?.imageUrl ||
                                "https://via.placeholder.com/44?text=IMG"
                              }
                              alt={item?.name || "Product"}
                              className="w-11 h-11 rounded-xl object-cover border border-gray-100"
                            />
                            <div>
                              <p className="text-[11px] font-bold text-gray-700">
                                {item?.name || "Item"}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">
                                {item?.weight || "1 Packet"}
                              </p>
                              <p className="text-[10px] text-red-500 font-bold uppercase">
                                Expiry: {formatExpiryDate(item?.expiryDate)}
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] font-black text-green-600">
                            ₹
                            {(Number(item?.price) || 0) *
                              (Number(item?.qty) || 1)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-400 font-bold uppercase text-center py-1">
                        Item details unavailable
                      </p>
                    )}
                  </div>

                  <div className="mb-2">
                    <div className="grid grid-cols-5 gap-0.5 mb-2">
                      {trackingSteps.map((step, index) => {
                        const active = index <= getOrderStep(order.status);
                        return (
                          <div
                            key={`${order._id}-${step}`}
                            className={`h-1.5 rounded-full transition-all ${active ? "bg-green-500" : "bg-gray-200"}`}
                          />
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-5 gap-0.5">
                      {trackingSteps.map((step, index) => {
                        const active = index <= getOrderStep(order.status);
                        return (
                          <p
                            key={`${order._id}-label-${step}`}
                            className={`text-[7px] font-black uppercase text-center leading-tight ${active ? "text-green-600" : "text-gray-400"}`}
                          >
                            {step}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  No orders yet!
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 font-black py-5 rounded-2xl border border-red-100 text-[10px] tracking-widest uppercase mb-10 hover:bg-red-100 transition-all shadow-sm"
        >
          Logout Account
        </button>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] bg-white/90 backdrop-blur-md rounded-[2.5rem] flex justify-around py-3 px-6 shadow-2xl z-50 border border-white/20 items-center">
        <button
          onClick={() => navigate("/home")}
          className="flex flex-col items-center gap-1 group"
        >
          <span className="text-xl opacity-40 group-hover:scale-110 transition-transform">
            🏠
          </span>
          <span className="text-[9px] font-black uppercase text-gray-400">
            Home
          </span>
        </button>
        <button
          onClick={() => navigate("/cart")}
          className="flex flex-col items-center gap-1 group"
        >
          <span className="text-xl opacity-40 group-hover:scale-110 transition-transform">
            🛒
          </span>
          <span className="text-[9px] font-black uppercase text-gray-400">
            Cart
          </span>
        </button>
        <button
          onClick={() => navigate("/user")}
          className="flex flex-col items-center gap-1 group"
        >
          <span className="text-xl bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
            👤
          </span>
          <span className="text-[9px] font-black uppercase text-green-600">
            Me
          </span>
        </button>
      </nav>
    </div>
  );
};

export default User;
