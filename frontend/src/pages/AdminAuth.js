import React, { useState } from 'react';
import { apiClient } from '../config/api';
import { useNavigate } from 'react-router-dom';

const AdminAuth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    emailOrMobile: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const res = await apiClient.post('/api/admin-auth/login', {
          emailOrMobile: formData.emailOrMobile,
          password: formData.password
        });
        if (res.data?.success) {
          localStorage.setItem('admin', JSON.stringify(res.data.admin));
          localStorage.setItem('adminToken', res.data.token);
          alert('✅ Admin login successful!');
          navigate('/admin');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          return alert('Password and confirm password do not match.');
        }

        const res = await apiClient.post('/api/admin-auth/register', {
          fullName: formData.fullName,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          password: formData.password
        });

        if (res.data?.success) {
          alert('✅ Admin account created. Please login.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
        <h2 className="text-2xl font-black text-center text-gray-900 uppercase italic">
          {isLogin ? 'Admin Login 🛡️' : 'Admin Signup 📝'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-gray-400"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-gray-400"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Mobile Number"
                className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-gray-400"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                required
              />
            </>
          )}

          {isLogin && (
            <input
              type="text"
              placeholder="Email or Mobile Number"
              className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-gray-400"
              value={formData.emailOrMobile}
              onChange={(e) => setFormData({ ...formData, emailOrMobile: e.target.value })}
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-gray-400"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 bg-gray-50 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-gray-400"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          )}

          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95"
          >
            {isLogin ? 'Enter Admin Panel' : 'Create Admin Account'}
          </button>
        </form>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-center mt-6 text-xs font-bold text-gray-400 cursor-pointer uppercase hover:text-gray-700 transition-colors"
        >
          {isLogin ? "Don't have admin account? Signup" : 'Already admin? Login'}
        </p>
      </div>
    </div>
  );
};

export default AdminAuth;
