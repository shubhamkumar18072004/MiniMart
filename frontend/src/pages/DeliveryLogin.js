import React, { useState } from "react";
import { apiClient } from "../config/api";
import { Link, useNavigate } from "react-router-dom";

const DeliveryLogin = () => {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post("/api/delivery/login", {
        mobileNumber,
        pin
      });
      if (res.data?.success && res.data.token) {
        localStorage.setItem("deliveryToken", res.data.token);
        localStorage.setItem("deliveryPartner", JSON.stringify(res.data.partner));
        navigate("/delivery");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Login fail — mobile/PIN check karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center p-6 font-sans">
      <Link to="/" className="absolute top-6 left-6 text-amber-800 font-black text-sm">
        ← Home
      </Link>
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-amber-100 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-500 text-white text-2xl items-center justify-center font-black mb-3 shadow-lg">
            🚚
          </div>
          <h1 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Delivery Partner</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest">
            MiniMart — apna mobile + PIN
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Mobile</label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className="w-full mt-1 p-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="10-digit mobile"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              className="w-full mt-1 p-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Admin ne jo PIN diya"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl uppercase text-[11px] tracking-widest shadow-lg disabled:opacity-50"
          >
            {loading ? "..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeliveryLogin;
