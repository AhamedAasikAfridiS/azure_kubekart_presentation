import React from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  Electronics: 'bg-violet-100 text-violet-700',
  Clothing: 'bg-pink-100 text-pink-700',
  Books: 'bg-amber-100 text-amber-700',
  'Home & Garden': 'bg-green-100 text-green-700',
  Sports: 'bg-orange-100 text-orange-700',
  Toys: 'bg-yellow-100 text-yellow-700',
  Beauty: 'bg-rose-100 text-rose-700',
  Other: 'bg-gray-100 text-gray-600',
};

const CATEGORY_IMAGE_MAP = {
  Electronics: '/images/products/electronics.svg',
  Clothing: '/images/products/clothing.svg',
  Books: '/images/products/books.svg',
  'Home & Garden': '/images/products/home-garden.svg',
  Sports: '/images/products/sports.svg',
  Toys: '/images/products/toys.svg',
  Beauty: '/images/products/beauty.svg',
  Other: '/images/products/other.svg',
};

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = React.useState(false);
  const categoryImage = CATEGORY_IMAGE_MAP[product.category] || CATEGORY_IMAGE_MAP.Other;
  const getFallbackImage = React.useCallback(
    () => categoryImage,
    [categoryImage]
  );
  const getFinalPlaceholderImage = React.useCallback(
    () => CATEGORY_IMAGE_MAP.Other,
    []
  );
  const [imageSrc, setImageSrc] = React.useState(product.imageUrl || getFallbackImage());
  const [fallbackTried, setFallbackTried] = React.useState(false);

  React.useEffect(() => {
    setImageSrc(product.imageUrl || getFallbackImage());
    setFallbackTried(false);
  }, [product.imageUrl, getFallbackImage]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addToCart(product._id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const catColor = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Other;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group animate-fade-in flex flex-col">
      {/* Product image placeholder */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 h-44 flex items-center justify-center overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
              if (!fallbackTried) {
                setImageSrc(getFallbackImage());
                setFallbackTried(true);
              } else {
                setImageSrc(getFinalPlaceholderImage());
              }
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-blue-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full ${catColor}`}>
          {product.category}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-3">{product.brand}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map(s => (
            <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(product.rating?.average || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-xs text-gray-400 ml-1">({product.rating?.count || 0})</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
            {product.stock > 0 && product.stock < 10 && (
              <p className="text-xs text-orange-500 font-medium">Only {product.stock} left!</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="btn-primary text-xs px-3 py-2 rounded-lg"
            id={`add-to-cart-${product._id}`}
          >
            {adding ? <span className="spinner w-4 h-4"></span> : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
