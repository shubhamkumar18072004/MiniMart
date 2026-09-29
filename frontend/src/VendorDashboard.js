import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VendorDashboard = () => {
    const [vendor, setVendor] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // LocalStorage se data nikalna
        const savedVendor = localStorage.getItem('vendor');
        if (savedVendor) {
            setVendor(JSON.parse(savedVendor));
        } else {
            // Agar vendor logged in nahi hai, toh login page par bhejo
            navigate('/vendor-auth');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('vendor');
        navigate('/vendor-auth');
    };

    if (!vendor) {
        return <div className="flex items-center justify-center h-screen font-bold">Loading Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-[2rem] p-6 shadow-xl flex flex-col md:flex-row justify-between items-center border-b-4 border-blue-600">
                    <div>
                        <h1 className="text-3xl font-black text-blue-600 uppercase italic">🏪 {vendor.shopName}</h1>
                        <p className="text-gray-500 font-bold uppercase text-xs mt-1">Welcome, {vendor.shopkeeperName}</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="mt-4 md:mt-0 bg-red-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-red-600 transition-all"
                    >
                        Logout 🚪
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white p-6 rounded-[2rem] shadow-lg border-l-8 border-green-500">
                        <p className="text-gray-400 font-bold text-xs uppercase">Total Sales</p>
                        <h2 className="text-3xl font-black text-gray-800">₹0.00</h2>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-lg border-l-8 border-blue-500">
                        <p className="text-gray-400 font-bold text-xs uppercase">Orders Received</p>
                        <h2 className="text-3xl font-black text-gray-800">0</h2>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-lg border-l-8 border-orange-500">
                        <p className="text-gray-400 font-bold text-xs uppercase">Service Radius</p>
                        <h2 className="text-3xl font-black text-gray-800">{vendor.serviceableRadius || 5} KM</h2>
                    </div>
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl">
                    <h3 className="text-xl font-black uppercase mb-4 italic">Shop Details</h3>
                    <div className="space-y-2 opacity-90">
                        <p><strong>📍 Address:</strong> {vendor.address}</p>
                        <p><strong>📱 Mobile:</strong> {vendor.mobileNumber}</p>
                        <p><strong>📧 Email:</strong> {vendor.email}</p>
                        <p><strong>⏰ Timing:</strong> {vendor.storeTimings?.open} - {vendor.storeTimings?.close}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;