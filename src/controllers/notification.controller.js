const NotificationLog = require('../models/notification.model');
const logger = require('../config/logger');

const getLogs = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [logs, total] = await Promise.all([
      NotificationLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      NotificationLog.countDocuments(filter),
    ]);
    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error('Get notification logs failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification logs',
    });
  }
};

module.exports = { getLogs };
