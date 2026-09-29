import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "../config/api";
import { Link, useNavigate } from "react-router-dom";

const api = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("deliveryToken") || ""}` }
});

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/delivery/orders", api());
      if (res.data?.success) setOrders(res.data.orders || []);
    } catch {
      localStorage.removeItem("deliveryToken");
      localStorage.removeItem("deliveryPartner");
      navigate("/delivery-login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const t = localStorage.getItem("deliveryToken");
    const p = localStorage.getItem("deliveryPartner");
    if (!t || !p) {
      navigate("/delivery-login");
      return;
    }
    setPartner(JSON.parse(p));
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [navigate, load]);

  const updateStatus = async (orderId, status) => {
    try {
      await apiClient.put(
        `/api/delivery/orders/${orderId}/status`,
        { status },
        api()
      );
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Update fail");
    }
  };

  const logout = () => {
    localStorage.removeItem("deliveryToken");
    localStorage.removeItem("deliveryPartner");
    navigate("/delivery-login");
  };

  if (loading && !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="font-black text-amber-700 uppercase text-xs animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] pb-24 font-sans">
      <header className="bg-amber-500 text-white p-6 rounded-b-[2rem] shadow-lg">
        <div className="max-w-lg mx-auto flex justify-between items-start">
          <div>
            <p className="text-[9px] font-black uppercase opacity-90 tracking-widest">Rider</p>
            <h1 className="text-xl font-black italic">{partner?.name || "Partner"}</h1>
            <p className="text-[10px] font-bold opacity-90">{partner?.mobileNumber}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => load()}
              className="bg-white/20 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            >
              Refresh
            </button>
            <Link to="/" className="bg-white/20 px-3 py-2 rounded-xl text-[10px] font-black uppercase">
              Home
            </Link>
            <button
              type="button"
              onClick={logout}
              className="bg-black/20 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            >
              Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
          Aapke orders ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-amber-100 shadow-sm">
            <p className="text-sm font-black text-gray-600">Abhi koi assign order nahi</p>
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">
              Admin dashboard se order assign hone ka wait karein
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-[1.75rem] border border-amber-100 shadow-md overflow-hidden"
            >
              <div className="bg-amber-100/80 px-4 py-3 flex justify-between items-center">
                <span className="text-[10px] font-black text-amber-900 uppercase">
                  #{String(order._id).slice(-6)}
                </span>
                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-white text-amber-800">
                  {order.status}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-lg font-black text-gray-900">₹{order.totalAmount}</p>
                <p className="text-[11px] font-bold text-gray-600 leading-relaxed">{order.address}</p>
                <p className="text-[11px] font-black text-amber-700">
                  Customer:{" "}
                  {order.userId?.firstName || ""} {order.userId?.lastName || ""}{" "}
                  <span className="text-gray-700 font-bold">
                    · {order.phone || order.userId?.mobileNumber || "—"}
                  </span>
                </p>
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-[11px] font-bold text-gray-700">
                      <span>{item.name}</span>
                      <span>x{item.qty}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    disabled={
                      order.status === "Out for Delivery" ||
                      order.status === "Delivered" ||
                      order.status === "Pending"
                    }
                    onClick={() => updateStatus(order._id, "Out for Delivery")}
                    className="flex-1 min-w-[140px] border-2 border-amber-500 text-amber-700 py-3 rounded-2xl text-[10px] font-black uppercase disabled:opacity-40"
                  >
                    Nikal pada 🛵
                  </button>
                  <button
                    type="button"
                    disabled={
                      order.status === "Delivered" ||
                      (order.status !== "Out for Delivery" &&
                        order.status !== "Ready for Delivery")
                    }
                    onClick={() => updateStatus(order._id, "Delivered")}
                    className="flex-1 min-w-[140px] bg-green-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg disabled:opacity-40"
                  >
                    Delivered ✅
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
