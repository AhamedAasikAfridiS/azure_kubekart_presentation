const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/order.controller');
const { requireAuth, requireAdmin } = require('../middleware/entraAuth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();
router.use(requireAuth);

router.post(
  '/',
  [
    body('items').isArray({ min: 1 }),
    body('shippingAddress.street').notEmpty(),
    body('shippingAddress.city').notEmpty(),
    body('shippingAddress.state').notEmpty(),
    body('shippingAddress.postalCode').notEmpty(),
  ],
  validateRequest,
  createOrder
);
router.get('/', getMyOrders);
router.get('/admin/all', requireAdmin, getAllOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);
router.patch(
  '/:id/status',
  requireAdmin,
  [
    body('status').isIn([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ]),
  ],
  validateRequest,
  updateOrderStatus
);

module.exports = router;
