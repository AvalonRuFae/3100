const { sequelize } = require('./connection');
const models = require('../models');
const logger = require('../utils/logger');

const migrate = async () => {
  try {
    logger.info('Starting database migration...');
    
    // Sync all models with the database
    await sequelize.sync({ force: false, alter: true });
    
    logger.info('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed:', error);
    process.exit(1);
  }
};

migrate();
