const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const notificationRoutes = require('./notificationRoutes');
const licenseRoutes = require('./licenseRoutes');
const bountyRoutes = require('./bountyRoutes');
const teamRoutes = require('./teamRoutes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DSCPMS API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/licenses', licenseRoutes);
router.use('/bounties', bountyRoutes);
router.use('/teams', teamRoutes);

module.exports = router;
