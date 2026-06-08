const express = require('express');
const { body } = require('express-validator');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { requireAuth, requireAdmin } = require('../middleware/entraAuth');

const router = express.Router();
const productValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }),
  body('category').isIn([
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Toys',
    'Beauty',
    'Other',
  ]),
  body('stock').isInt({ min: 0 }),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
];

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', requireAuth, requireAdmin, productValidation, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

module.exports = router;
