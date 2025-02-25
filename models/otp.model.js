const { pool } = require('../db');

const createOtpTableQuery = `
CREATE TABLE IF NOT EXISTS otp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  role VARCHAR(255) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;


const createOtpTable = () => {
  pool.getConnection((err, connection) => {  
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return;
    }
    connection.query(createOtpTableQuery, (err) => { 
      connection.release();  
      if (err) {
        console.error('Error creating otp table: ' + err.stack);
        return;
      }
      console.log('OTP table created or already exists.');
    });
  });
};

const Otp = {
    create: (email, otp, expiresAt, role, callback) => {
      pool.getConnection((err, connection) => {  
        if (err) {
          console.error('Error getting connection: ' + err.stack);
          return;
        }
  
        const query = 'INSERT INTO otp (email, otp, expires_at, role) VALUES (?, ?, ?, ?)';
        connection.query(query, [
          email,
          otp,
          expiresAt,
          role,  // Add role to the OTP table (set to 'customer' in this case)
        ], (err, result) => {
          connection.release();  
          callback(err, result);
        });
      });
    },
  
    verify: (email, otp, callback) => {
      pool.getConnection((err, connection) => {  
        if (err) {
          console.error('Error getting connection: ' + err.stack);
          return;
        }
  
        const query = 'SELECT * FROM otp WHERE email = ? AND otp = ? AND expires_at > NOW()';
        connection.query(query, [email, otp], (err, result) => {
          connection.release();  
          callback(err, result);
        });
      });
    }
  };
  
module.exports = { Otp, createOtpTable };