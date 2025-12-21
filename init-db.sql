-- Create the main database
CREATE DATABASE IF NOT EXISTS dscpms;

-- Create the test database
CREATE DATABASE IF NOT EXISTS dscpms_test;

-- Grant permissions to the user
GRANT ALL PRIVILEGES ON dscpms.* TO 'dscpms_user'@'%';
GRANT ALL PRIVILEGES ON dscpms_test.* TO 'dscpms_user'@'%';
FLUSH PRIVILEGES;
