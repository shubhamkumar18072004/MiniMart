import React, { useState } from 'react';
import { apiClient } from '../config/api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', email: '', mobile: '', password: '' 
  });
  const [profilePic, setProfilePic] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isLoginView) {
        const response = await apiClient.post("/api/login", {
          mobileNumber: formData.mobile,
          password: formData.password
        });

        if (response.data.success) {
          // ⭐ FIXED LOGIC START: Purana data aur backend data ko merge karna
          const existingUser = JSON.parse(localStorage.getItem('user')) || {};
          const apiUser = response.data.user || {};
          
          const userData = {
            ...existingUser, // Purana data (jaise email) pehle rakho
            ...apiUser,      // Naya data uske upar merge karo
            // Niche wale checks ensure karenge ki koi field blank na ho jaye
            firstName: apiUser.firstName || existingUser.firstName || "User",
            lastName: apiUser.lastName || existingUser.lastName || "",
            // Email Fix: Agar API se email nahi aaya, toh storage wala use karo
            email: apiUser.email || apiUser.emailId || existingUser.email || "Not Available",
            mobileNumber: apiUser.mobileNumber || formData.mobile || existingUser.mobileNumber,
            password: formData.password 
          };

          localStorage.setItem('user', JSON.stringify(userData));
          // ⭐ FIXED LOGIC END

          alert("✅ Welcome Back, " + userData.firstName + "!");
          navigate('/home');
        }
      } else {
        const data = new FormData();
        data.append('firstName', formData.firstName);
        data.append('lastName', formData.lastName);
        data.append('email', formData.email);
        data.append('mobileNumber', formData.mobile);
        data.append('password', formData.password);
        if (profilePic) data.append('profilePic', profilePic);

        const response = await apiClient.post("/api/register", data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          alert("✅ OTP sent! Code: " + response.data.otp); 
          navigate('/verify-otp', { state: { mobileNumber: formData.mobile } });
        }
      }
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || "Server Error"));
      if (err.response?.data?.needsVerification) {
        navigate('/verify-otp', { state: { mobileNumber: formData.mobile } });
      }
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-white">
        <h1 className="text-5xl font-extrabold text-green-600 mb-6 italic tracking-tighter">MiniMart</h1>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
          <button type="button" onClick={() => setIsLoginView(true)} className={`flex-1 py-2 rounded-xl font-bold transition-all ${isLoginView ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>Login</button>
          <button type="button" onClick={() => setIsLoginView(false)} className={`flex-1 py-2 rounded-xl font-bold transition-all ${!isLoginView ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <input type="text" name="username" value={formData.mobile} readOnly className="hidden" autoComplete="username" />

          {!isLoginView && (
            <>
              <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">Personal Details</label>
              <div className="flex gap-2">
                <input type="text" name="firstName" placeholder="First Name" className="w-1/2 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all" onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                <input type="text" name="lastName" placeholder="Last Name" className="w-1/2 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all" onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <input type="email" name="email" placeholder="Email Address" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              <div className="relative border-2 border-dashed border-green-100 p-4 rounded-2xl text-center hover:bg-green-50 transition-all cursor-pointer">
                <span className="text-xs font-bold text-gray-500">{profilePic ? `📸 ${profilePic.name}` : "Upload Profile Photo"}</span>
                <input type="file" name="profilePic" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setProfilePic(e.target.files[0])} accept="image/*" />
              </div>
            </>
          )}
          
          <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">{isLoginView ? "Account Credentials" : "Security & Contact"}</label>
          
          <input 
            type="tel" name="mobile" autoComplete="tel" placeholder="Mobile Number" 
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all" 
            onChange={(e) => setFormData({...formData, mobile: e.target.value})} value={formData.mobile} required 
          />
          
          <input 
            type="password" name="password" autoComplete={isLoginView ? "current-password" : "new-password"} placeholder="Password" 
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all" 
            onChange={(e) => setFormData({...formData, password: e.target.value})} value={formData.password} required 
          />
          
          <button type="submit" className="w-full bg-green-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-green-100 hover:bg-green-700 active:scale-[0.98] transition-all text-lg mt-4 uppercase">
            {isLoginView ? "Sign In" : "Create Account"}
          </button>
        </form>
        <p className="mt-8 text-xs text-gray-400 font-medium italic">Welcome to the future of Grocery Shopping</p>
      </div>
    </div>
  );
};

export default Login;