require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const cartRoutes = require('./src/routes/cart.routes');
const orderRoutes = require('./src/routes/order.routes');
const profileRoutes = require('./src/routes/profile.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const { closeServiceBus } = require('./src/services/notificationQueue');

const app = express();
const port = Number(process.env.PORT) || 8080;
const frontendBuild = path.join(__dirname, 'Kubecart-frontend', 'build');

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again later.' },
}));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'kubecart-monolith',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    index: false,
  }));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(503).send(
      'KubeCart frontend is not built. Run "npm run build" and restart the application.'
    );
  });
}

app.use((err, req, res, next) => {
  logger.error('Unhandled request error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });
  res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : 'Internal server error',
  });
});

let server;

const start = async () => {
  await connectDB();
  server = app.listen(port, () => {
    logger.info(`KubeCart monolith listening on port ${port}`);
  });
};

const shutdown = async (signal) => {
  logger.info(`Received ${signal}; shutting down`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await Promise.allSettled([closeServiceBus(), mongoose.connection.close()]);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  logger.error('Application startup failed', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
