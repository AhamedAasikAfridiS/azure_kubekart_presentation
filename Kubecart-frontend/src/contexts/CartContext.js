import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) { setCart({ items: [], totalAmount: 0 }); return; }
    setCartLoading(true);
    try {
      const { data } = await cartApi.get('/api/cart');
      setCart(data.data.cart);
    } catch { /* silent fail */ }
    finally { setCartLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await cartApi.post('/api/cart/items', { productId, quantity });
    setCart(data.data.cart);
    return data.data.cart;
  };

  const updateItem = async (productId, quantity) => {
    const { data } = await cartApi.patch(`/api/cart/items/${productId}`, { quantity });
    setCart(data.data.cart);
  };

  const removeItem = async (productId) => {
    const { data } = await cartApi.delete(`/api/cart/items/${productId}`);
    setCart(data.data.cart);
  };

  const clearCart = async () => {
    const { data } = await cartApi.delete('/api/cart');
    setCart(data.data.cart);
  };

  const itemCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, cartLoading, fetchCart, addToCart, updateItem, removeItem, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
