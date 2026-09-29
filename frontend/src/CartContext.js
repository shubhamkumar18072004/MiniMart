import React, { createContext, useState, useContext } from 'react';
import { isProductInStock } from './utils/productUnit';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  
  const addToCart = (product) => {
    if (!isProductInStock(product)) {
      return;
    }
    setCartItems((prev) => {
      const isExist = prev.find(item => item._id === product._id);
      if (isExist) {
        return prev.map(item => 
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    console.log(`${product.name} added to cart`);
  };

  
  const removeFromCart = (id) => {
    setCartItems((prev) => {
      const item = prev.find(i => i._id === id);
      
      if (!item) return prev;

      if (item.qty === 1) {
        return prev.filter(i => i._id !== id);
      } else {
        return prev.map(i => 
          i._id === id ? { ...i, qty: i.qty - 1 } : i
        );
      }
    });
  };

  
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);