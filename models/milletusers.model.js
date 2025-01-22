const { pool } = require('../db');  

const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS milletusers ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    phone_number VARCHAR(20) NOT NULL UNIQUE,  -- Ensure phone number is unique
    email VARCHAR(255) NOT NULL, 
    address VARCHAR(255) NOT NULL, 
    floor INT NULL,
    tag VARCHAR(50) NULL  -- Optional field for additional user information
  )
`;

const createMilletUsersTable = () => {
  pool.getConnection((err, connection) => {  
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return;
    }
    connection.query(createUsersTableQuery, (err) => { 
      connection.release();  
      if (err) {
        console.error('Error creating milletusers table: ' + err.stack);
        return;
      }
      console.log('Milletusers table created or already exists.');
    });
  });
};

const User = {
  create: (userData, callback) => {
    pool.getConnection((err, connection) => {  
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }

      const query = 'INSERT INTO milletusers (phone_number, email, address, floor, tag) VALUES (?, ?, ?, ?, ?)';
      connection.query(query, [
        userData.phone_number,
        userData.email,
        userData.address,
        userData.floor || null,
        userData.tag || null,
      ], (err, result) => {
        connection.release();  
        callback(err, result);
      });
    });
  }
};

module.exports = { User, createMilletUsersTable };