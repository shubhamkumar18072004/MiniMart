import React, { useState } from 'react';

const LocationModal = ({ isOpen, onClose, onSelect }) => {
  const [loading, setLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState("");

  if (!isOpen) return null;

  // --- 🎯 AUTO TRACK LOCATION FUNCTION ---
  const handleGetCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;


          const detectedAddress = "Guretha, Uttar Pradesh";

          console.log(`Lat: ${latitude}, Lon: ${longitude}`);
          onSelect(detectedAddress);
          setLoading(false);
          onClose();
        },
        (error) => {
          alert("Location access denied. Please enable it in settings.");
          setLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    const cleanAddress = manualAddress.trim();
    if (!cleanAddress) {
      alert("Please enter address first.");
      return;
    }
    onSelect(cleanAddress);
    setManualAddress("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Select Location</h3>
          <button
            onClick={onClose}
            className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white transition-all font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-8">
          {/* Search Box */}
          <div className="relative mb-8">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search a new address..."
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleManualSubmit();
                }
              }}
              className="w-full bg-gray-50 border-2 border-gray-100 py-4 pl-12 pr-4 rounded-2xl focus:outline-none focus:border-green-500 font-bold text-gray-700 transition-all shadow-inner"
            />
            <button
              onClick={handleManualSubmit}
              className="mt-3 w-full bg-green-600 text-white font-black py-3 rounded-xl text-[11px] uppercase tracking-widest hover:bg-green-700 transition-all"
            >
              Use This Address
            </button>
          </div>

          {/* Use Current Location Button (Zepto Style) */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="w-full flex items-center justify-between p-5 border-2 border-pink-100 bg-pink-50/30 rounded-[2rem] hover:bg-pink-50 transition-all group active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm text-2xl group-hover:scale-110 transition-transform">
                {loading ? "⏳" : "🎯"}
              </div>
              <div className="text-left">
                <p className="font-black text-pink-600 uppercase italic tracking-tighter">
                  {loading ? "Tracking..." : "Use My Current Location"}
                </p>
                <p className="text-[10px] text-gray-400 font-black uppercase">Enable for faster delivery</p>
              </div>
            </div>
            <span className="bg-white text-pink-500 border border-pink-200 px-4 py-2 rounded-xl font-black text-[10px] uppercase group-hover:bg-pink-600 group-hover:text-white transition-all shadow-sm">
              Enable
            </span>
          </button>

          {/* Illustration/Helper Text */}
          <div className="mt-10 flex flex-col items-center justify-center py-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-gray-200 text-4xl">
              📍
            </div>
            <p className="text-gray-400 font-black text-xs uppercase tracking-widest text-center leading-relaxed">
              Add your detailed address <br /> to see items near you
            </p>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="bg-gray-50 p-4 text-center">
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Powered by MiniMart Maps</p>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;