const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const logger = require('../config/logger');

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }
    res.status(200).json({ success: true, data: { cart } });
  } catch (error) {
    logger.error('Get cart failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

    const item = cart.items.find((entry) => entry.productId === productId);
    const requestedQuantity = item ? item.quantity + Number(quantity) : Number(quantity);
    if (product.stock < requestedQuantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    if (item) {
      item.quantity = requestedQuantity;
      item.price = product.price;
      item.name = product.name;
      item.imageUrl = product.imageUrl || '';
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity: Number(quantity),
        imageUrl: product.imageUrl || '',
      });
    }

    await cart.save();
    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: { cart },
    });
  } catch (error) {
    logger.error('Add to cart failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);
    const product = await Product.findOne({
      _id: req.params.productId,
      isActive: true,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    const item = cart?.items.find(
      (entry) => entry.productId === req.params.productId
    );
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    item.quantity = quantity;
    item.price = product.price;
    await cart.save();
    res.status(200).json({
      success: true,
      message: 'Item quantity updated',
      data: { cart },
    });
  } catch (error) {
    logger.error('Update cart item failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    cart.items = cart.items.filter(
      (entry) => entry.productId !== req.params.productId
    );
    await cart.save();
    res.status(200).json({
      success: true,
      message: 'Item removed',
      data: { cart },
    });
  } catch (error) {
    logger.error('Remove cart item failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
};

const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });
    cart.items = [];
    await cart.save();
    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: { cart },
    });
  } catch (error) {
    logger.error('Clear cart failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
