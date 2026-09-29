import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../config/api';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
// --- 🆕 LOCATION MODAL IMPORT ---
import LocationModal from '../components/LocationModal';
import { formatProductUnit, isProductInStock } from '../utils/productUnit';
import { productMatchesSearch } from '../utils/productSearchMatch';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

const Home = () => {
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [voiceLang, setVoiceLang] = useState('hi-IN');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const onVoiceText = useCallback((text) => {
    setSearchTerm(text);
  }, []);

  const onVoiceError = useCallback((msg) => {
    if (msg) alert(msg);
  }, []);

  const { listening, supported: voiceSupported, start: startVoice, stop: stopVoice } = useVoiceSearch(
    voiceLang,
    onVoiceText,
    onVoiceError
  );

  const toggleVoice = async () => {
    if (!voiceSupported) {
      alert(
        'Voice search ke liye Chrome ya Edge use karein. Safari me support kam hai.\nMic permission Allow karein.'
      );
      return;
    }
    if (listening) stopVoice();
    else await startVoice();
  };

  // --- 🆕 LOCATION STATES ---
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Select Location");

  // --- CAROUSEL LOGIC ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { title: "FRESH GROCERY FOR YOU & YOUR FAMILY!", sub: "Special Your Home!", gradient: "from-green-600 to-green-400" },
    { title: "आप और आपके परिवार के लिए ताज़ा किराना!", sub: "आपके घर के लिए खास!", gradient: "from-green-700 to-emerald-500" },
    { title: "SUMMER DRINKS & ICE CREAMS", sub: "Starting at just ₹10", gradient: "from-yellow-500 to-orange-400" },
    { title: "ALL DAILY USE PRODUCTS AVAILABLE ON ONE CLICK", sub: "MiniMart Special", gradient: "from-blue-600 to-cyan-400" },
    { title: "आपके लिए ताज़े फल और सब्ज़ियाँ", sub: "बस एक क्लिक पर", gradient: "from-green-500 to-lime-500" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 3000); 
    return () => clearInterval(timer);
  }, [slides.length]);

  const { addToCart, cartItems } = useCart();
  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchProducts = async () => {
      try {
        const hasLocation = selectedLocation && selectedLocation !== "Select Location";
        const endpoint = hasLocation
          ? `/api/products/nearby?location=${encodeURIComponent(selectedLocation)}`
          : '/api/products';

        const res = await apiClient.get(endpoint);
        const data = Array.isArray(res.data) ? res.data : (res.data.products || []);
        setProducts(data);
        setLoading(false);
      } catch (err) {
        console.error("Data fetch error:", err);
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedLocation]);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const hasLocation = selectedLocation && selectedLocation !== "Select Location";
        const endpoint = hasLocation
          ? `/api/products/nearby?location=${encodeURIComponent(selectedLocation)}`
          : '/api/products';
        const res = await apiClient.get(endpoint);
        const data = Array.isArray(res.data) ? res.data : (res.data.products || []);
        setProducts(data);
      } catch (e) {
        /* keep last good data */
      }
    }, 7000);
    return () => clearInterval(t);
  }, [selectedLocation]);

  const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) return "N/A";
    const d = new Date(expiryDate);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-GB");
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    window.location.reload();
  };

  const handleLocationSelect = (loc) => {
    setSelectedLocation(loc);
  };

  const userRoute = user ? '/user' : '/login';

  const categories = ["Fruits & Vegetables", "Atta, Rice, Oil & Dals", "Masala & Dry Fruits", "Sweet Cravings", "Frozen Food & Ice Cream", "Baby Food", "Dairy, Bread & Eggs", "Cold Drinks & Juices", "Munchies", "Meats, Fish & Eggs", "Breakfast & Sauces", "Tea, Coffee & More", "Biscuits", "Makeup & Beauty", "Bath & Body", "Cleaning Essentials", "Home Needs", "Electricals & Accessories", "Hygiene & Grooming", "Health & Baby Care", "Homegrown Brands", "Paan Corner"];

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans pb-24 text-gray-900">
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* --- ORIGINAL HEADER WITH ADDED LOCATION --- */}
      <header className="sticky top-0 z-[150] bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="bg-gradient-to-br from-green-500 to-green-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-green-200">M</div>
              <span className="text-xl font-black bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent italic">MiniMart</span>
            </Link>

            {/* --- 🆕 SELECT LOCATION BUTTON (JUST LIKE ZEPTO) --- */}
            <div 
              onClick={() => setModalOpen(true)}
              className="flex flex-col items-start cursor-pointer hover:opacity-70 transition-all border-l pl-4 border-gray-200"
            >
              <span className="text-[12px] font-black text-gray-900 flex items-center gap-1 uppercase tracking-tight">
                {selectedLocation} <span className="text-[10px]">▼</span>
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[160px]">
                {selectedLocation !== "Select Location" ? selectedLocation : "Detecting Address..."}
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-xl min-w-0 relative group">
            <input
              type="text"
              placeholder='लिखें या माइक — दूध, Milk, Chips...'
              className="w-full bg-gray-100/80 p-3.5 pl-12 pr-[7.5rem] md:pr-[9rem] rounded-2xl outline-none focus:ring-2 focus:ring-green-500 focus:bg-white border border-transparent transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <div className="flex rounded-lg overflow-hidden border border-gray-200 text-[8px] font-black shrink-0">
                <button
                  type="button"
                  onClick={() => setVoiceLang('hi-IN')}
                  className={`px-2 py-1 transition-colors ${voiceLang === 'hi-IN' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  title="Hindi / हिंग्लिश recognition"
                >
                  हिं
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang('en-IN')}
                  className={`px-2 py-1 transition-colors ${voiceLang === 'en-IN' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  title="English"
                >
                  EN
                </button>
              </div>
              <button
                type="button"
                onClick={toggleVoice}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all shrink-0 ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                } ${!voiceSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={listening ? 'Rokna' : 'Bol kar search (mic)'}
                aria-label="Voice search"
              >
                🎤
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-6 font-bold text-sm text-gray-600 uppercase tracking-tight">
            <Link to="/admin-auth" className="hover:text-green-600 transition-colors">Admin</Link>
            <Link to="/vendor-auth" className="hover:text-blue-600 transition-colors border-l pl-4 border-gray-200">Vendor</Link>
            <Link to="/delivery-login" className="hover:text-amber-600 transition-colors border-l pl-4 border-gray-200">Delivery</Link>
            
            <div className="relative flex items-center justify-center">
              <Link 
                to={userRoute}
                className="relative z-[999] bg-white border-2 border-green-500 text-green-600 px-6 py-2 rounded-2xl font-black lowercase first-letter:uppercase tracking-tight shadow-md hover:bg-green-600 hover:text-white transition-all active:scale-95 cursor-pointer block"
              >
                {user?.firstName || 'User'}
              </Link>
            </div>

            <Link to="/cart" className="relative group">
              <div className="bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl hover:bg-green-600 transition-all active:scale-95">
                <span className="text-lg">🛒</span>
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg text-xs font-black animate-bounce">{totalItems}</span>
                )}
              </div>
            </Link>
            
            <button onClick={handleLogout} className="text-[10px] bg-red-50 text-red-500 px-3 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest">Exit</button>
          </div>
        </div>
      </header>

      {/* --- LOCATION MODAL --- */}
      <LocationModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSelect={handleLocationSelect} 
      />

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* ... बाकी का सारा Carousel और Product Logic (वही पुराना) ... */}
        <div className="relative h-56 md:h-64 mb-12 overflow-hidden rounded-[2.5rem] shadow-xl">
          {slides.map((slide, index) => (
            <div key={index} className={`absolute inset-0 w-full h-full p-8 md:p-12 text-white transition-all duration-1000 ease-in-out flex flex-col justify-center bg-gradient-to-r ${slide.gradient} ${index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
              <h2 className="text-2xl md:text-4xl font-black leading-tight italic uppercase tracking-tighter max-w-2xl">{slide.title}</h2>
              <p className="text-white/80 font-bold mt-3 text-lg md:text-xl flex items-center gap-2">✨ {slide.sub}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="mt-4 font-black text-green-700 tracking-widest uppercase text-xs">Loading Freshness...</p>
          </div>
        ) : (
          categories.map((cat) => {
            const filteredProducts = products.filter(
              (p) => p.category === cat && productMatchesSearch(p, searchTerm)
            );
            if (filteredProducts.length === 0) return null;
            return (
              <div key={cat} className="mb-14">
                <div className="flex justify-between items-end mb-6 px-2">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{cat}</h2>
                    <div className="h-1.5 w-12 bg-green-500 rounded-full mt-1"></div>
                  </div>
                  <Link to={`/category/${cat}`} className="text-pink-600 font-black text-xs md:text-sm uppercase tracking-widest hover:opacity-70 transition-all flex items-center gap-1">
                    See All <span className="text-lg">›</span>
                  </Link>
                </div>

                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 px-2">
                  {filteredProducts.map(product => (
                    <div key={product._id} className="min-w-[220px] md:min-w-[260px] bg-white p-4 rounded-[2.5rem] border border-gray-50 hover:border-green-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 group cursor-pointer">
                      <div className="relative overflow-hidden rounded-[2rem] bg-gray-50 h-52 md:h-60 flex items-center justify-center">
                        <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out ${!isProductInStock(product) ? 'opacity-50' : ''}`} />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                           <p className="text-[10px] font-black text-green-600 uppercase">Fresh</p>
                        </div>
                        {!isProductInStock(product) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wider">Out of stock</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-5 px-2">
                        <h3 className="font-bold text-base text-gray-800 truncate group-hover:text-green-600 transition-colors">{product.name}</h3>
                        <p className="mt-1 text-[10px] text-gray-500 font-bold uppercase">
                          {formatProductUnit(product)}
                        </p>
                        <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">
                          Expiry: {formatExpiryDate(product.expiryDate)}
                        </p>
                        <div className="mt-5 flex items-center justify-between">
                          <span className="font-black text-xl text-gray-900 italic">₹{product.price}</span>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={!isProductInStock(product)}
                            className={`font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-lg active:scale-90 ${
                              isProductInStock(product)
                                ? 'bg-green-600 text-white hover:bg-black shadow-green-100'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                            }`}
                          >
                            {isProductInStock(product) ? 'ADD' : 'Sold out'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* --- MOBILE NAV --- */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-black/90 backdrop-blur-lg rounded-[2.5rem] flex lg:hidden justify-around py-4 px-6 shadow-2xl z-[250] border border-white/10 items-center">
        <Link to="/home"><NavIcon icon="🏠" label="Home" active /></Link>
        <Link to="/cart" className="relative">
          <NavIcon icon="🛒" label="Cart" />
          {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-green-500 text-[8px] text-white font-bold w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>}
        </Link>
        <Link to={userRoute} className="flex flex-col items-center justify-center relative z-[500] pointer-events-auto bg-white/10 p-2 rounded-xl">
          <span className="text-xl">👤</span>
          <span className="text-[8px] text-white font-black uppercase tracking-widest">{user?.firstName || 'User'}</span>
        </Link>
        <Link to="/vendor-auth"><NavIcon icon="🏪" label="Vendor" /></Link>
        <Link to="/delivery-login"><NavIcon icon="🚚" label="Rider" /></Link>
        <Link to="/admin-auth"><NavIcon icon="🛡️" label="Admin" /></Link>
      </nav>
    </div>
  );
};

const NavIcon = ({ icon, label, active }) => (
  <div className={`flex flex-col items-center space-y-1 ${active ? 'text-green-500' : 'text-gray-400'}`}>
    <span className="text-xl">{icon}</span>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </div>
);

export default Home;