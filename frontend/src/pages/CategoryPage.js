import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../config/api';
import { useCart } from '../CartContext'; 
// --- 🆕 NAVBAR IMPORT ---
import Navbar from '../components/Navbar';
import { formatProductUnit, isProductInStock } from '../utils/productUnit';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart(); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [user, setUser] = useState(null);

  // --- NEW STATE FOR MODAL ---
  const [selectedProduct, setSelectedProduct] = useState(null);

  const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) return "N/A";
    const d = new Date(expiryDate);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-GB");
  };

  
  // eslint-disable-next-line no-unused-vars
  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchCategoryProducts = async () => {
      try {
        const res = await apiClient.get('/api/products');
        const filtered = res.data.filter(p => p.category === categoryName);
        setProducts(filtered);
      } catch (err) {
        console.error("Products load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [categoryName]);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await apiClient.get('/api/products');
        const filtered = res.data.filter((p) => p.category === categoryName);
        setProducts(filtered);
      } catch (e) {
        /* keep last */
      }
    }, 7000);
    return () => clearInterval(t);
  }, [categoryName]);

  // eslint-disable-next-line no-unused-vars
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-20">
      
      {/* --- 🌍 GLOBAL NAVBAR --- */}
      {/* पुराने मैन्युअल हेडर की जगह अब सिर्फ <Navbar /> आएगा */}
      <Navbar />

      {/* --- Category Sub-Header --- */}
      <div className="max-w-7xl mx-auto px-6 mt-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-800 hover:bg-white w-10 h-10 rounded-full transition-all shadow-sm flex items-center justify-center">
          ←
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{categoryName}</h2>
          <div className="h-1.5 w-12 bg-green-500 rounded-full mt-1"></div>
        </div>
      </div>

      {/* --- Product Grid --- */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-4">
        {loading ? (
          <div className="col-span-full text-center py-20 font-black text-green-600 animate-pulse uppercase tracking-widest">
            Loading Freshness...
          </div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <div 
              key={product._id} 
              className="bg-white p-4 rounded-[2.5rem] border border-gray-50 hover:border-green-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 group flex flex-col h-full"
            >
              {/* Image Section - Click to Open Modal */}
              <div 
                onClick={() => setSelectedProduct(product)}
                className="relative overflow-hidden rounded-[2rem] bg-gray-50 h-52 md:h-60 flex items-center justify-center mb-4 cursor-pointer"
              >
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out ${!isProductInStock(product) ? 'opacity-50' : ''}`}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                   <p className="text-[10px] font-black text-green-600 uppercase">Fresh</p>
                </div>
                {!isProductInStock(product) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase">Out of stock</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-grow px-2">
                <h4 className="font-bold text-base text-gray-800 truncate group-hover:text-green-600 transition-colors leading-tight">
                  {product.name}
                </h4>
                <p className="mt-1 text-[10px] text-gray-500 font-bold uppercase">
                  {formatProductUnit(product)}
                </p>
                <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">
                  Expiry: {formatExpiryDate(product.expiryDate)}
                </p>
                
                <div className="mt-auto pt-5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-black text-xl text-gray-900 italic">₹{product.price}</span>
                  </div>
                  
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
          ))
        ) : (
          <div className="col-span-full text-center py-20 font-black text-gray-300 uppercase italic">
            No Products Found in this Category
          </div>
        )}
      </div>

      {/* --- PRODUCT DETAIL MODAL --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:row relative animate-in fade-in zoom-in duration-300">
            
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 z-10 bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row w-full">
                {/* Left Side: Photo */}
                <div className="md:w-1/2 bg-[#f8f8f8] p-10 flex items-center justify-center">
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name}
                      className="max-h-[350px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Right Side: Info */}
                <div className="md:w-1/2 p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">Fresh</span>
                        {selectedProduct.discount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                            {selectedProduct.discount}% OFF
                          </span>
                        )}
                    </div>

                    <h2 className="text-4xl font-black text-gray-900 leading-tight mb-2 italic tracking-tighter uppercase">
                        {selectedProduct.name}
                    </h2>

                    <p className="text-gray-400 font-bold mb-6 text-lg">
                        Unit: <span className="text-black">{formatProductUnit(selectedProduct)}</span>
                    </p>
                    {!isProductInStock(selectedProduct) && (
                      <p className="text-red-600 font-black text-sm uppercase mb-4">This product is currently out of stock.</p>
                    )}
                    <p className="text-red-500 font-bold mb-6 text-sm uppercase">
                        Expiry: <span className="text-gray-700">{formatExpiryDate(selectedProduct.expiryDate)}</span>
                    </p>

                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-5xl font-black text-green-600 italic">₹{selectedProduct.price}</span>
                        {selectedProduct.discount > 0 && (
                          <span className="text-gray-300 line-through font-bold text-xl">
                            ₹{Number(selectedProduct.price) + 20}
                          </span>
                        )}
                    </div>

                    {/* Pink Add to Cart Button */}
                    <button 
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      disabled={!isProductInStock(selectedProduct)}
                      className={`w-full font-black py-5 rounded-2xl text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest ${
                        isProductInStock(selectedProduct)
                          ? 'bg-[#ff2d55] hover:bg-[#e6264d] text-white shadow-pink-100'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>🛒</span> {isProductInStock(selectedProduct) ? 'Add To Cart' : 'Out of stock'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;