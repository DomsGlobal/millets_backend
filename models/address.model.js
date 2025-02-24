const { pool } = require('../db');

const createAddressTableQuery = `
  CREATE TABLE IF NOT EXISTS address ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL,  -- Associate the address with a user
    phone_number VARCHAR(20) NOT NULL,  
    email VARCHAR(255) NOT NULL,  
    address VARCHAR(255) NOT NULL, 
    floor INT NULL,
    tag VARCHAR(50) NULL,
    pin_code VARCHAR(20) NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  )
`;

const createAddressTable = () => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return;
    }
    connection.query(createAddressTableQuery, (err) => {
      connection.release();
      if (err) {
        console.error('Error creating address table: ' + err.stack);
        return;
      }
      console.log('Address table created or already exists.');
    });
  });
};

const Address = {
  create: (addressData, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }

      const query = `
        INSERT INTO address (user_id, phone_number, email, address, floor, tag, pin_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      connection.query(query, [
        addressData.user_id,  // Store user_id but don't enforce uniqueness
        addressData.phone_number,
        addressData.email,
        addressData.address,
        addressData.floor || null,
        addressData.tag || null,
        addressData.pin_code || null,
      ], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  }
};

module.exports = { Address, createAddressTable };
