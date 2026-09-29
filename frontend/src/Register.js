import React, { useState } from 'react';
import { apiClient } from './config/api';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: ''
  });
  const [profilePic, setProfilePic] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Photo aur Text data ko mix karne ke liye FormData zaroori hai
    const data = new FormData();
    data.append('firstName', formData.firstName);
    data.append('lastName', formData.lastName);
    data.append('email', formData.email);
    data.append('mobileNumber', formData.mobileNumber);
    data.append('password', formData.password);
    if (profilePic) data.append('profilePic', profilePic);

    try {
      const res = await apiClient.post('/api/register', data);
      if (res.data.success) {
        alert("✅ OTP bhej diya gaya hai: " + res.data.otp); // Testing ke liye OTP alert mein
        // Yahan se user ko OTP wale page par bhejien (Navigation logic)
      }
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || "Server connect nahi hua"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border-4 border-white">
        <h2 className="text-3xl font-black text-green-600 mb-6 text-center italic uppercase tracking-tighter">MiniMart Join Karien</h2>

        <div className="space-y-4">
          <input type="text" placeholder="First Name" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border focus:border-green-500"
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />

          <input type="text" placeholder="Last Name" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border"
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />

          <input type="email" placeholder="Email Address" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />

          <input type="text" placeholder="Mobile Number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border"
            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} required />

          <input type="password" placeholder="Create Password" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />

          <div className="p-4 border-2 border-dashed border-green-200 rounded-2xl text-center relative">
            <p className="text-xs font-bold text-gray-400">{profilePic ? profilePic.name : "Apni Photo Select Karein 📸"}</p>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setProfilePic(e.target.files[0])} />
          </div>

          <button type="submit" className="w-full bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-all uppercase">
            Get Started
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;