const { pool } = require('../db');  

const createUserTableQuery = `
  CREATE TABLE IF NOT EXISTS user ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    email VARCHAR(255) NOT NULL UNIQUE, 
    phone VARCHAR(20) NOT NULL UNIQUE, 
    password VARCHAR(255) NOT NULL, 
    token VARCHAR(255) NULL  -- Optional token field for authentication
  )
`;

const createUserTable = () => {
  pool.getConnection((err, connection) => {  
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return;
    }
    connection.query(createUserTableQuery, (err) => { 
      connection.release();  
      if (err) {
        console.error('Error creating user table: ' + err.stack);
        return;
      }
      console.log('User table created or already exists.');
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

      const query = 'INSERT INTO user (name, email, phone, password, token) VALUES (?, ?, ?, ?, ?)';
      connection.query(query, [
        userData.name,
        userData.email,
        userData.phone,
        userData.password,
        userData.token || null,
      ], (err, result) => {
        connection.release();  
        callback(err, result);
      });
    });
  }
};

module.exports = { User, createUserTable };
