const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const logger = require('../config/logger');
const {
  sendNotificationMessage,
} = require('../services/notificationQueue');

const restoreStock = async (items) => {
  await Promise.allSettled(
    items.map((item) => Product.updateOne(
      { _id: item.productId },
      { $inc: { stock: item.quantity } }
    ))
  );
};

const queueOrderNotification = async (order, type, subject) => {
  const messageId = `${type}:${order._id}`;
  await sendNotificationMessage({
    messageId,
    to: order.userEmail,
    type,
    subject,
    payload: {
      orderId: order._id.toString(),
      totalAmount: order.totalAmount,
      items: order.items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    },
  });
};

const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, notes } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Order must have at least one item',
    });
  }

  const normalizedItems = items.map((item) => ({
    productId: String(item.productId),
    quantity: Number(item.quantity),
  }));
  if (normalizedItems.some(
    (item) => !mongoose.isValidObjectId(item.productId)
      || !Number.isInteger(item.quantity)
      || item.quantity < 1
  )) {
    return res.status(400).json({
      success: false,
      message: 'Each item requires a valid productId and positive quantity',
    });
  }

  const reservedItems = [];
  try {
    const products = await Product.find({
      _id: { $in: normalizedItems.map((item) => item.productId) },
      isActive: true,
    });
    const productMap = new Map(
      products.map((product) => [product._id.toString(), product])
    );

    const enrichedItems = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        const error = new Error(`Product ${item.productId} not found`);
        error.status = 400;
        throw error;
      }
      return {
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl || '',
      };
    });

    for (const item of enrichedItems) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          isActive: true,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!product) {
        const error = new Error(`Insufficient stock for ${item.name}`);
        error.status = 400;
        throw error;
      }
      reservedItems.push(item);
    }

    const order = await Order.create({
      userId: req.user.id,
      userEmail: req.user.email,
      items: enrichedItems,
      totalAmount: enrichedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      notes: notes || '',
    });

    let notificationQueued = true;
    try {
      await queueOrderNotification(
        order,
        'order_confirmation',
        `Order confirmed - #${order._id}`
      );
    } catch (error) {
      notificationQueued = false;
      logger.error('Order created but notification could not be queued', {
        orderId: order._id.toString(),
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order, notificationQueued },
    });
  } catch (error) {
    if (reservedItems.length > 0) await restoreStock(reservedItems);
    logger.error('Create order failed', { message: error.message });
    res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Failed to create order',
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const filter = { userId: req.user.id };
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);
    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error('Get orders failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: { order } });
  } catch {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        status: { $in: ['pending', 'confirmed'] },
      },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    if (!order) {
      const existingOrder = await Order.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in ${existingOrder.status} status`,
      });
    }
    await restoreStock(order.items);

    let notificationQueued = true;
    try {
      await queueOrderNotification(
        order,
        'order_cancelled',
        `Order cancelled - #${order._id}`
      );
    } catch (error) {
      notificationQueued = false;
      logger.error('Cancellation notification could not be queued', {
        orderId: order._id.toString(),
        message: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled',
      data: { order, notificationQueued },
    });
  } catch (error) {
    logger.error('Cancel order failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: { order },
    });
  } catch (error) {
    logger.error('Update order status failed', { message: error.message });
    res.status(400).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);
    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error('Get all orders failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
};
