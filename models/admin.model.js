const { pool } = require('../db');  

const createAdminsTableQuery = `
  CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    email VARCHAR(255) NOT NULL UNIQUE, 
    phone VARCHAR(20) NOT NULL UNIQUE, 
    password VARCHAR(255) NOT NULL, 
    token VARCHAR(255) NULL  -- Optional token field for authentication
  )
`;

  
const createAdminsTable = () => {
  pool.getConnection((err, connection) => {  
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return;
    }
    connection.query(createAdminsTableQuery, (err) => { 
      connection.release();  
      if (err) {
        console.error('Error creating admins table: ' + err.stack);
        return;
      }
      console.log('Admins table created or already exists.');
    });
  });
};

const Admin = {
  create: (adminData, callback) => {
    pool.getConnection((err, connection) => {  
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }

      const query = 'INSERT INTO admins (name, email, phone, password, token ) VALUES (?, ?, ?, ?, ?, ?)';
      connection.query(query, [
        adminData.name,
        adminData.email,
        adminData.phone,
        adminData.password,
        adminData.token || null,
       ], (err, result) => {
        connection.release();  
        callback(err, result);
      });
    });
  }
};

module.exports = { Admin, createAdminsTable };
