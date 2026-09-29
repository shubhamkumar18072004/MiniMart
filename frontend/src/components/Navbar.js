import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext'; 
import LocationModal from './LocationModal';

const Navbar = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [user, setUser] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Select Location");

  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <>
      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
        onSelect={(loc) => setCurrentLocation(loc)}
      />

      <header className="sticky top-0 z-[150] bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          
          <div className="flex items-center gap-6">
            <Link to="/home" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-500 to-green-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-green-200">M</div>
              <span className="text-xl font-black bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent italic">MiniMart</span>
            </Link>

            {/* Zepto Style Location Button */}
            <button 
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden md:flex flex-col items-start hover:opacity-70 border-l pl-6 border-gray-200"
            >
              <div className="flex items-center gap-1">
                <span className="text-gray-900 font-black text-sm tracking-tight">{currentLocation}</span>
                <span className="text-[10px] text-gray-500">▼</span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase truncate w-32">Detecting address...</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden lg:block">
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
                <input type="text" placeholder='Search "Milk", "Chips"...' className="w-full bg-gray-100/50 py-3 pl-10 pr-4 rounded-2xl text-sm focus:outline-none" />
             </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6 font-bold text-sm text-gray-600 uppercase">
            <Link to="/user" className="bg-white border-2 border-green-500 text-green-600 px-6 py-2 rounded-2xl font-black shadow-md">{user?.firstName || 'User'}</Link>
            <Link to="/cart" className="bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-3">
               🛒 <span>Cart</span>
               {totalItems > 0 && <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg text-xs">{totalItems}</span>}
            </Link>
            <button onClick={handleLogout} className="text-[10px] bg-red-50 text-red-500 px-3 py-2 rounded-xl font-black">Exit</button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;