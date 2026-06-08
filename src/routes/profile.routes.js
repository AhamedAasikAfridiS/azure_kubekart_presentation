const express = require('express');
const {
  getMyProfile,
  updateMyProfile,
  addAddress,
  deleteAddress,
} = require('../controllers/profile.controller');
const { requireAuth } = require('../middleware/entraAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.post('/me/addresses', addAddress);
router.delete('/me/addresses/:addressId', deleteAddress);

module.exports = router;
