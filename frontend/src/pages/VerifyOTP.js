import React, { useState } from 'react';
import { apiClient } from '../config/api';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const mobileNumber = location.state?.mobileNumber;

  const handleVerify = async () => {
    try {
      const res = await apiClient.post("/api/verify-otp", { mobileNumber, otp });
      if (res.data.success) {
        alert("✅ Account Verified! Ab aap login kar sakte hain.");
        navigate('/home'); 
      }
    } catch (err) {
      alert("❌ Galat OTP! Phir se koshish karein.");
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-black text-green-600 mb-2">Verify Mobile</h2>
        <p className="text-gray-500 text-sm mb-6">OTP sent to: <b>{mobileNumber}</b></p>
        
        <input type="text" maxLength="6" placeholder="000000" 
          className="w-full p-4 text-center text-3xl tracking-[10px] font-bold bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setOtp(e.target.value)} 
        />
        
        <button onClick={handleVerify} className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl mt-6 hover:bg-green-700">
          Verify & Continue
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;