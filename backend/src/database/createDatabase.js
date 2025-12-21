require('dotenv').config();
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const createDatabase = async () => {
  try {
    // Connect without database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'dscpms'}`);
    logger.info(`Database '${process.env.DB_NAME || 'dscpms'}' created successfully`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    logger.error('Create database error:', error);
    console.error('\nPlease ensure MySQL is running and credentials are correct in .env file');
    process.exit(1);
  }
};

createDatabase();
