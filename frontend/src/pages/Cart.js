import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';
import { formatProductUnit } from '../utils/productUnit';

const DELIVERY_FORM_LS = 'minimartDeliveryForm';

const emptyAddress = () => ({
  fullName: '',
  houseNo: '',
  village: '',
  city: '',
  pincode: '',
  phone: ''
});

/** Order history / checkout se bana hua format parse kare */
function parseStructuredAddressLine(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.trim();
  const m = t.match(
    /Name:\s*([^,]+),\s*Flat:\s*([^,]+),\s*Village:\s*([^,]+),\s*City:\s*([^,]+),\s*PIN:\s*([^\s,]+)/i
  );
  if (!m) return null;
  return {
    fullName: m[1].trim(),
    houseNo: m[2].trim(),
    village: m[3].trim(),
    city: m[4].trim(),
    pincode: m[5].trim(),
    phone: ''
  };
}

/** Profile wala free-text address — jitna ho sake split + pin / mobile */
function guessFromFreeText(text, user) {
  const pinMatch = text.match(/\b(\d{6})\b/);
  const phoneMatch = text.match(/\b(\d{10})\b/) || text.match(/\b(\d{12})\b/);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const mobile = String(user?.mobileNumber || user?.phone || '').replace(/\D/g, '').slice(-10);
  return {
    fullName: name,
    houseNo: text.trim(),
    village: '',
    city: '',
    pincode: pinMatch ? pinMatch[1] : '',
    phone: phoneMatch ? (phoneMatch[1] || phoneMatch[2] || '').replace(/\D/g, '').slice(-10) : mobile
  };
}

function hydrateDeliveryFields() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  const fallbackPhone = String(user?.mobileNumber || user?.phone || '').replace(/\D/g, '').slice(-10);
  const fallbackName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();

  try {
    const saved = JSON.parse(localStorage.getItem(DELIVERY_FORM_LS) || 'null');
    if (saved && typeof saved === 'object') {
      const next = { ...emptyAddress(), ...saved };
      if (!next.phone && fallbackPhone) next.phone = fallbackPhone;
      if (!next.fullName && fallbackName) next.fullName = fallbackName;
      if (next.fullName || next.houseNo || next.phone) return next;
    }
  } catch {
    /* ignore */
  }

  let addresses = [];
  try {
    addresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
  } catch {
    addresses = [];
  }

  const first = addresses.find((a) => typeof a === 'string' && a.trim());
  if (first) {
    const structured = parseStructuredAddressLine(first);
    if (structured) {
      structured.phone = structured.phone || fallbackPhone;
      return structured;
    }
    const guessed = guessFromFreeText(first, user);
    if (!guessed.fullName && fallbackName) guessed.fullName = fallbackName;
    if (!guessed.phone && fallbackPhone) guessed.phone = fallbackPhone;
    return guessed;
  }

  return {
    fullName: fallbackName,
    houseNo: '',
    village: '',
    city: '',
    pincode: '',
    phone: fallbackPhone
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, addToCart, removeFromCart, clearCart } = useCart();

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressDetails, setAddressDetails] = useState(emptyAddress);
  const [savedAddressList, setSavedAddressList] = useState([]);
  const [savedPick, setSavedPick] = useState('');

  useEffect(() => {
    if (!showAddressModal) return;
    setAddressDetails(hydrateDeliveryFields());
    setSavedPick('');
    try {
      setSavedAddressList(JSON.parse(localStorage.getItem('userAddresses') || '[]').filter(Boolean));
    } catch {
      setSavedAddressList([]);
    }
  }, [showAddressModal]);

  useEffect(() => {
    if (!showAddressModal) return;
    const has = addressDetails.fullName || addressDetails.houseNo || addressDetails.phone;
    if (!has) return;
    const id = setTimeout(() => {
      localStorage.setItem(DELIVERY_FORM_LS, JSON.stringify(addressDetails));
    }, 500);
    return () => clearTimeout(id);
  }, [addressDetails, showAddressModal]);

  const applyProfileAddressLine = (indexStr) => {
    if (indexStr === '') return;
    const i = Number(indexStr);
    const txt = savedAddressList[i];
    if (!txt || typeof txt !== 'string') return;
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      user = null;
    }
    const structured = parseStructuredAddressLine(txt);
    if (structured) {
      const phone = String(structured.phone || user?.mobileNumber || user?.phone || '')
        .replace(/\D/g, '')
        .slice(-10);
      setAddressDetails({ ...structured, phone });
      return;
    }
    setAddressDetails(guessFromFreeText(txt, user));
  };

  const totalPrice = cartItems.reduce((acc, item) => {
    const price = parseInt(String(item.price).replace(/[^\d]/g, '')) || 0;
    return acc + (price * item.qty);
  }, 0);

  const cartPayloadItems = useMemo(
    () => cartItems.map((i) => ({ price: i.price, qty: i.qty })),
    [cartItems]
  );
  const cartSignature = useMemo(
    () => cartItems.map((i) => `${i._id}:${i.qty}`).join('|'),
    [cartItems]
  );

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState('');

  useEffect(() => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoMsg('');
  }, [cartSignature]);

  const payable = appliedPromo ? appliedPromo.finalTotal : totalPrice;

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) {
      setPromoMsg('Code likho.');
      return;
    }
    setPromoLoading(true);
    setPromoMsg('');
    try {
      const { data } = await apiClient.post('/api/promo/validate', {
        code,
        items: cartPayloadItems
      });
      if (data.success) {
        setAppliedPromo({
          code: data.code,
          discountAmount: data.discountAmount,
          finalTotal: data.finalTotal,
          subtotal: data.subtotal
        });
        setPromoMsg(`✓ ${data.code}: −₹${data.discountAmount}`);
      }
    } catch (e) {
      setAppliedPromo(null);
      setPromoMsg(e?.response?.data?.message || 'Promo apply nahi hua.');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoMsg('');
  };

  const handlePaymentAndOrder = async () => {
    const savedUser = JSON.parse(localStorage.getItem('user'));

    if (!savedUser) {
      alert("Bhai, pehle login toh kar lo!");
      return navigate('/');
    }

    if (!addressDetails.fullName || !addressDetails.houseNo || !addressDetails.village || !addressDetails.city || !addressDetails.pincode || !addressDetails.phone) {
      alert("Bhai, please saari details (Name, Village, City etc.) sahi se bharo!");
      return;
    }

    localStorage.setItem(DELIVERY_FORM_LS, JSON.stringify(addressDetails));

    let finalPay = totalPrice;
    let promoForOrder;
    if (appliedPromo?.code) {
      try {
        const { data } = await apiClient.post('/api/promo/validate', {
          code: appliedPromo.code,
          items: cartPayloadItems
        });
        if (!data.success) {
          alert(data.message || 'Promo dubara apply karein.');
          return;
        }
        finalPay = data.finalTotal;
        promoForOrder = data.code;
      } catch (e) {
        alert(e?.response?.data?.message || 'Promo verify fail — hata kar try karein.');
        return;
      }
    }

    try {
      const { data: { order } } = await apiClient.post("/api/payment/checkout", {
        amount: finalPay
      });

      const options = {
        key: "rzp_test_Sgty5z4jzqsSCU", 
        amount: order.amount,
        currency: "INR",
        name: "MiniMart",
        description: "Grocery Purchase",
        order_id: order.id,
        handler: async function (response) {
          const fullAddress = `Name: ${addressDetails.fullName}, Flat: ${addressDetails.houseNo}, Village: ${addressDetails.village}, City: ${addressDetails.city}, PIN: ${addressDetails.pincode}`;

          
          const orderData = {
            userId: savedUser.id || savedUser._id,
            items: cartItems.map(item => ({
              productId: item._id,
              name: item.name,
              price: item.price,
              qty: item.qty,
              imageUrl: item.imageUrl || "",
              // User ko cart/Order history me wahi unit dikhni chahiye jo vendor ne diya:
              // weight -> Kg, else quantity -> Packet
              weight: formatProductUnit(item),
              expiryDate: item.expiryDate || null,
              
              vendorId: item.vendor || item.vendorId 
            })),
            totalAmount: finalPay,
            address: fullAddress,
            phone: addressDetails.phone,
            paymentId: response.razorpay_payment_id,
            ...(promoForOrder ? { promoCode: promoForOrder } : {}),

            vendorId: cartItems[0]?.vendor || cartItems[0]?.vendorId
          };

          try {
            const res = await apiClient.post("/api/orders/place", orderData);
            if (res.data.success) {
              alert("✅ Payment Successful & Order Placed! 🚚");
              if (clearCart) clearCart();
              navigate('/user');
            }
          } catch (err) {
            alert("❌ Payment toh ho gayi par order save nahi hua! Contact support.");
          }
        },
        prefill: {
          name: addressDetails.fullName || savedUser.firstName,
          contact: addressDetails.phone,
          email: savedUser.email || ""
        },
        theme: { color: "#16a34a" }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
      setShowAddressModal(false); 

    } catch (err) {
      console.error(err);
      alert("❌ Payment initialize nahi ho paayi. Backend aur .env check karein.");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-2xl font-black text-gray-800 uppercase italic">Aapki tokri khaali hai!</h2>
        <p className="text-gray-500 mb-6 font-medium">Kuch fresh items add kijiye.</p>
        <Link to="/home" className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-green-100">Shopping Shuru Karein</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white p-4 border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/home" className="text-2xl font-bold text-green-600">←</Link>
          <h1 className="text-xl font-black text-gray-800 uppercase italic">Checkout</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden mb-6 border border-white">
          {cartItems.map((item) => (
            <div key={item._id} className="flex items-center gap-4 p-4 border-b border-gray-50">
              <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl shadow-sm" />
              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-800 uppercase tracking-tighter">{item.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{formatProductUnit(item)}</p>
                <p className="text-green-700 font-black text-sm">₹{item.price}</p>
              </div>
              <div className="flex items-center bg-green-50 rounded-xl p-1 gap-3 border border-green-100">
                <button onClick={() => removeFromCart(item._id)} className="w-8 h-8 bg-white rounded-lg shadow-sm font-black text-green-600 text-lg">-</button>
                <span className="font-black text-sm text-green-800">{item.qty}</span>
                <button onClick={() => addToCart(item)} className="w-8 h-8 bg-white rounded-lg shadow-sm font-black text-green-600 text-lg">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white">
          <h3 className="font-black text-gray-400 mb-4 uppercase text-[10px] tracking-widest">Promo code</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="e.g. RAMJI"
              className="flex-1 bg-gray-50 p-3 rounded-xl border text-sm font-bold uppercase outline-none focus:border-green-500"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              disabled={Boolean(appliedPromo)}
            />
            {appliedPromo ? (
              <button
                type="button"
                onClick={removePromo}
                className="px-4 rounded-xl bg-gray-200 text-gray-800 text-xs font-black uppercase shrink-0"
              >
                Hatao
              </button>
            ) : (
              <button
                type="button"
                onClick={applyPromo}
                disabled={promoLoading}
                className="px-4 rounded-xl bg-gray-900 text-white text-xs font-black uppercase shrink-0 disabled:opacity-50"
              >
                {promoLoading ? '...' : 'Apply'}
              </button>
            )}
          </div>
          {promoMsg ? <p className="text-[11px] font-bold text-gray-600 mb-4">{promoMsg}</p> : null}

          <h3 className="font-black text-gray-400 mb-4 uppercase text-[10px] tracking-widest">Bill Details</h3>
          <div className="space-y-2 border-b pb-4 border-dashed">
            <div className="flex justify-between text-sm text-gray-500 font-bold">
              <span>Item Total</span>
              <span>₹{totalPrice}</span>
            </div>
            {appliedPromo ? (
              <div className="flex justify-between text-sm text-amber-700 font-bold">
                <span>Promo ({appliedPromo.code})</span>
                <span>−₹{appliedPromo.discountAmount}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm text-gray-500 font-bold">
              <span>Delivery Fee</span>
              <span className="text-green-600 font-black">FREE</span>
            </div>
          </div>
          <div className="flex justify-between pt-4 font-black text-lg text-gray-900">
            <span className="italic uppercase">Grand Total</span>
            <span className="text-green-600 font-black">₹{payable}</span>
          </div>
        </div>
      </main>

      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase text-gray-800">Delivery Details</h2>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 text-2xl font-bold">✕</button>
            </div>
            <p className="text-[10px] font-bold text-gray-500 leading-relaxed mb-4 -mt-2">
              Profile / pichhla order yahan auto-fill ho jata hai — zarurat ho to sab edit kar sakte ho.
            </p>

            <div className="space-y-3">
              {savedAddressList.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Profile se save pata (auto-fill)
                  </p>
                  <select
                    className="w-full bg-gray-50 p-3.5 rounded-2xl border text-xs font-bold text-gray-700 outline-none focus:border-green-500"
                    value={savedPick}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSavedPick(v);
                      if (v !== '') {
                        applyProfileAddressLine(v);
                        setSavedPick('');
                      }
                    }}
                  >
                    <option value="">— Chuno —</option>
                    {savedAddressList.map((line, idx) => (
                      <option key={idx} value={String(idx)}>
                        {(line || '').slice(0, 48)}
                        {(line || '').length > 48 ? '…' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="text"
                placeholder="Apka Pura Naam (Full Name)"
                className="w-full bg-gray-50 p-4 rounded-2xl outline-none border focus:border-green-500 font-bold"
                value={addressDetails.fullName}
                onChange={(e) => setAddressDetails({ ...addressDetails, fullName: e.target.value })}
              />

              <input
                type="text"
                placeholder="Flat / House No. / Building"
                className="w-full bg-gray-50 p-4 rounded-2xl outline-none border focus:border-green-500"
                value={addressDetails.houseNo}
                onChange={(e) => setAddressDetails({ ...addressDetails, houseNo: e.target.value })}
              />

              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Village (Gaon)"
                  className="w-1/2 bg-gray-50 p-4 rounded-2xl outline-none border focus:border-green-500"
                  value={addressDetails.village}
                  onChange={(e) => setAddressDetails({ ...addressDetails, village: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="City (Shehar)"
                  className="w-1/2 bg-gray-50 p-4 rounded-2xl outline-none border focus:border-green-500"
                  value={addressDetails.city}
                  onChange={(e) => setAddressDetails({ ...addressDetails, city: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Pincode"
                  className="w-1/2 bg-gray-50 p-4 rounded-2xl outline-none border focus:border-green-500"
                  value={addressDetails.pincode}
                  onChange={(e) => setAddressDetails({ ...addressDetails, pincode: e.target.value })}
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Phone Number"
                  className="w-1/2 bg-gray-50 p-4 rounded-2xl outline-none border focus:border-green-500"
                  value={addressDetails.phone}
                  onChange={(e) => setAddressDetails({ ...addressDetails, phone: e.target.value })}
                />
              </div>

              <button 
                onClick={handlePaymentAndOrder} 
                className="w-full bg-black text-white p-5 rounded-[2rem] font-black uppercase tracking-widest mt-4 hover:bg-green-700 transition-all"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-20">
        <button 
          onClick={() => setShowAddressModal(true)} 
          className="w-full bg-green-600 text-white p-5 rounded-[2rem] font-black text-lg shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95 uppercase tracking-widest"
        >
          PLACE ORDER • ₹{payable}
        </button>
      </div>
    </div>
  );
};

export default Cart;