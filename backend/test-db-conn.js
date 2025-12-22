const mysql = require('mysql2/promise');

async function testConnection() {
  const passwords = ['root', '', 'password', 'admin'];
  
  for (const pwd of passwords) {
    try {
      console.log(`\nTrying password: "${pwd}"`);
      const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: pwd
      });
      console.log('✓ Connected successfully!');
      
      // Try to create test database
      await conn.query('CREATE DATABASE IF NOT EXISTS dscpms_test');
      console.log('✓ Test database created/exists');
      
      await conn.end();
      console.log(`\n✓✓✓ SUCCESS! Use password: "${pwd}"\n`);
      break;
    } catch (err) {
      console.log(`✗ Failed: ${err.message}`);
    }
  }
}

testConnection();
