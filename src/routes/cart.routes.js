const express = require('express');
const { body, param } = require('express-validator');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cart.controller');
const { requireAuth } = require('../middleware/entraAuth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();
router.use(requireAuth);

router.get('/', getCart);
router.post(
  '/items',
  [
    body('productId').isMongoId(),
    body('quantity').optional().isInt({ min: 1 }),
  ],
  validateRequest,
  addToCart
);
router.patch(
  '/items/:productId',
  [
    param('productId').isMongoId(),
    body('quantity').isInt({ min: 1 }),
  ],
  validateRequest,
  updateCartItem
);
router.delete(
  '/items/:productId',
  [param('productId').isMongoId()],
  validateRequest,
  removeFromCart
);
router.delete('/', clearCart);

module.exports = router;
