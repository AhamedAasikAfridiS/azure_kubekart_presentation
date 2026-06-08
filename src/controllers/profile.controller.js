const Profile = require('../models/profile.model');
const logger = require('../config/logger');

const identityDefaults = (user) => ({
  email: user.email,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
});

const getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      {
        $setOnInsert: {
          userId: req.user.id,
          ...identityDefaults(req.user),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    logger.error('Get profile failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = [
      'firstName',
      'lastName',
      'phone',
      'dateOfBirth',
      'gender',
      'avatarUrl',
      'preferences',
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: updates,
        $setOnInsert: {
          userId: req.user.id,
          email: req.user.email,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
    res.status(200).json({
      success: true,
      message: 'Profile updated',
      data: { profile },
    });
  } catch (error) {
    logger.error('Update profile failed', { message: error.message });
    res.status(400).json({ success: false, message: 'Failed to update profile' });
  }
};

const addAddress = async (req, res) => {
  try {
    const {
      street,
      city,
      state,
      postalCode,
      country = 'India',
      label = 'Home',
      isDefault = false,
    } = req.body;
    if (!street || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Street, city, state, and postal code are required',
      });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      {
        $setOnInsert: {
          userId: req.user.id,
          ...identityDefaults(req.user),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (isDefault) {
      profile.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }
    profile.addresses.push({
      street,
      city,
      state,
      postalCode,
      country,
      label,
      isDefault,
    });
    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Address added',
      data: { addresses: profile.addresses },
    });
  } catch (error) {
    logger.error('Add address failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    const address = profile.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    address.deleteOne();
    await profile.save();
    res.status(200).json({
      success: true,
      message: 'Address deleted',
      data: { addresses: profile.addresses },
    });
  } catch (error) {
    logger.error('Delete address failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  addAddress,
  deleteAddress,
};
