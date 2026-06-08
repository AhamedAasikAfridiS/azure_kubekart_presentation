import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const categories = [
  { icon: '📱', label: 'Electronics' },
  { icon: '👗', label: 'Clothing' },
  { icon: '📚', label: 'Books' },
  { icon: '🏡', label: 'Home & Garden' },
  { icon: '⚽', label: 'Sports' },
  { icon: '🧸', label: 'Toys' },
  { icon: '💄', label: 'Beauty' },
  { icon: '🛍️', label: 'Other' },
];

const features = [
  { icon: '🚚', title: 'Free Delivery', desc: 'On all orders above ₹499. Fast & reliable shipping to your doorstep.' },
  { icon: '🔄', title: 'Easy Returns', desc: 'Hassle-free 30-day returns. No questions asked, full refund guaranteed.' },
  { icon: '🔒', title: 'Secure Payments', desc: 'Your payment info is always encrypted and protected.' },
  { icon: '🎧', title: '24/7 Support', desc: 'Our support team is here around the clock to help you.' },
  { icon: '⭐', title: 'Top Brands', desc: 'Curated selection from hundreds of trusted brands worldwide.' },
  { icon: '💳', title: 'Easy EMI', desc: 'No-cost EMI available on select products with leading banks.' },
];

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #a5b4fc 0%, transparent 50%)'}} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Sale is live — Up to 60% off on top picks!
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Shop Smarter at <span className="text-yellow-300">KubeCart</span>
          </h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Discover thousands of products across every category — with the best prices, fast delivery, and easy returns guaranteed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/products" id="browse-products-btn" className="inline-flex items-center gap-2 bg-yellow-400 text-blue-900 font-bold px-7 py-3 rounded-xl hover:bg-yellow-300 transition-colors shadow-lg text-base">
              Shop Now →
            </Link>
            {!isAuthenticated && (
              <Link to="/register" id="get-started-btn" className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors">
                Create Free Account
              </Link>
            )}
            {isAuthenticated && (
              <p className="text-blue-200 self-center text-sm">Welcome back, <span className="font-bold text-white">{user.firstName}</span>! 👋</p>
            )}
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 font-medium">
          {['✅ 100% Genuine Products', '🚚 Free Shipping above ₹499', '🔄 30-Day Returns', '🔒 Secure Checkout', '⭐ 4.8★ Customer Rating'].map((item) => (
            <span key={item} className="flex items-center gap-1">{item}</span>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Shop by Category</h2>
        <p className="text-gray-400 text-center text-sm mb-8">Find exactly what you're looking for</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              to={`/products`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
              <span className="text-xs font-semibold text-gray-700 text-center">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-t border-gray-100 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Why Shop with KubeCart?</h2>
          <p className="text-gray-400 text-center text-sm mb-10">Everything you need for a great shopping experience</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-14 text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to start shopping?</h2>
        <p className="text-blue-100 mb-7 text-sm">Join thousands of happy customers. New deals every day!</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/products" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-md">Browse Products →</Link>
          {!isAuthenticated && <Link to="/register" className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors">Sign Up Free</Link>}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
