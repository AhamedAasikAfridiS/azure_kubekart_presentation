import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { cart, updateItem, removeItem, clearCart, cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState({ street: '', city: '', state: '', postalCode: '', country: 'India' });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const handleAddrChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    try {
      const items = cart.items.map(i => ({ productId: i.productId, quantity: i.quantity }));
      const { data } = await orderApi.post('/api/orders', { items, shippingAddress: address, paymentMethod });
      await clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (cartLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner w-10 h-10 border-4"></div></div>;
  }

  const isEmpty = !cart.items || cart.items.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Shopping Cart</h1>

      {isEmpty ? (
        <div className="text-center py-20 card">
          <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</p>
          <p className="text-gray-400 mb-6">Discover our amazing products</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item) => (
              <div key={item.productId} className="card flex items-center gap-4 p-4">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                  <p className="text-blue-600 font-bold mt-0.5">₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => item.quantity > 1 ? updateItem(item.productId, item.quantity - 1) : removeItem(item.productId)}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors">−</button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateItem(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors">+</button>
                </div>
                <p className="font-bold text-gray-900 min-w-[64px] text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
                <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 transition-colors ml-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="section-title">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal ({cart.items.length} items)</span><span>₹{cart.totalAmount?.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-green-600 font-medium">Free</span></div>
                <hr className="border-gray-100 my-2" />
                <div className="flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>₹{cart.totalAmount?.toFixed(2)}</span></div>
              </div>
              <button onClick={() => setShowCheckout(!showCheckout)} className="btn-primary w-full mt-5">
                {showCheckout ? 'Hide Checkout' : 'Proceed to Checkout'}
              </button>
            </div>

            {/* Checkout Form */}
            {showCheckout && (
              <div className="card animate-slide-up">
                <h2 className="section-title">Shipping Details</h2>
                <form onSubmit={handleCheckout} id="checkout-form" className="space-y-3">
                  <input name="street" required placeholder="Street address" className="input-field" value={address.street} onChange={handleAddrChange} />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="city" required placeholder="City" className="input-field" value={address.city} onChange={handleAddrChange} />
                    <input name="state" required placeholder="State" className="input-field" value={address.state} onChange={handleAddrChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input name="postalCode" required placeholder="PIN Code" className="input-field" value={address.postalCode} onChange={handleAddrChange} />
                    <input name="country" placeholder="Country" className="input-field" value={address.country} onChange={handleAddrChange} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                    <select id="payment-method" className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="cod">Cash on Delivery</option>
                      <option value="card">Card (Demo)</option>
                      <option value="upi">UPI (Demo)</option>
                    </select>
                  </div>

                  <button type="submit" id="place-order-btn" disabled={checkoutLoading} className="btn-primary w-full">
                    {checkoutLoading ? <><span className="spinner"></span> Placing Order...</> : `Place Order · ₹${cart.totalAmount?.toFixed(2)}`}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;

