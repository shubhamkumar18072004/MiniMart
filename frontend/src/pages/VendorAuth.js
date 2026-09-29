import React, { useState } from 'react';
import { apiClient } from '../config/api';
import { useNavigate } from 'react-router-dom';

const VendorAuth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        shopName: '', shopkeeperName: '', mobileNumber: '', 
        email: '', password: '', confirmPassword: '', address: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation for registration
        if (!isLogin && formData.password !== formData.confirmPassword) {
            return alert("Passwords do not match!");
        }

        const endpoint = isLogin ? '/api/vendor/login' : '/api/vendor/register';
        
        // Login ke waqt sirf mobile aur password bhej rahe hain
        const dataToSend = isLogin 
            ? { mobileNumber: formData.mobileNumber, password: formData.password } 
            : formData;

        try {
            const res = await apiClient.post(endpoint, dataToSend);
            
            if (res.data.success) {
                // Dashboard ko crash hone se bachane ke liye check
                if (isLogin) {
                    if (res.data.vendor) {
                        localStorage.setItem('vendor', JSON.stringify(res.data.vendor));
                        alert("Login Success! 🏪");
                        navigate('/vendor-dashboard');
                    } else {
                        alert("Error: Backend se vendor data nahi mila!");
                    }
                } else {
                    alert("Registration Success! Now Login.");
                    setIsLogin(true);
                }
            }
        } catch (err) {
            // Error handling ko safe banaya hai taaki undefined message na aaye
            const errorMsg = err.response?.data?.message || "Something went wrong!";
            alert(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6 font-sans">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
                <h2 className="text-2xl font-black text-center text-blue-600 uppercase italic">
                    {isLogin ? "Vendor Login 🏪" : "Vendor Register 📝"}
                </h2>

                <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                    {!isLogin && (
                        <>
                            <input type="text" placeholder="Shop Name" className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-400" 
                                value={formData.shopName} onChange={(e)=>setFormData({...formData, shopName: e.target.value})} required />
                            
                            <input type="text" placeholder="Shopkeeper Name" className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-400" 
                                value={formData.shopkeeperName} onChange={(e)=>setFormData({...formData, shopkeeperName: e.target.value})} required />
                            
                            <input type="email" placeholder="Email Address" className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-400" 
                                value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} required />
                        </>
                    )}
                    
                    <input type="text" placeholder="Mobile Number" className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-400" 
                        value={formData.mobileNumber} onChange={(e)=>setFormData({...formData, mobileNumber: e.target.value})} required />
                    
                    <input type="password" placeholder="Password" className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-400" 
                        value={formData.password} onChange={(e)=>setFormData({...formData, password: e.target.value})} required />
                    
                    {!isLogin && (
                        <>
                            <input type="password" placeholder="Confirm Password" className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-400" 
                                value={formData.confirmPassword} onChange={(e)=>setFormData({...formData, confirmPassword: e.target.value})} required />
                            
                            <textarea placeholder="Full Shop Address" className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-400" 
                                value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} required />
                            
                            <div className="flex items-center gap-2 py-2">
                                <input type="checkbox" className="w-4 h-4" required />
                                <span className="text-[10px] text-gray-400 font-bold uppercase">I accept Terms & Conditions</span>
                            </div>
                        </>
                    )}

                    <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-xs hover:bg-blue-700 transition-all active:scale-95">
                        {isLogin ? "Enter Dashboard" : "Create Account"}
                    </button>
                </form>

                <p onClick={() => {
                    setIsLogin(!isLogin);
                    // Switch karte waqt form reset kar dena chahiye (Optionally)
                }} className="text-center mt-6 text-xs font-bold text-gray-400 cursor-pointer uppercase hover:text-blue-500 transition-colors">
                    {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                </p>
            </div>
        </div>
    );
};

export default VendorAuth;