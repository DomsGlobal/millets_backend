const { pool } = require('../db');

const createContactTableQuery = `
  CREATE TABLE IF NOT EXISTS milletcontact (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NULL
  )
`;

const createMilletContactTable = () => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return;
    }
    connection.query(createContactTableQuery, (err) => {
      connection.release();
      if (err) {
        console.error('Error creating milletcontact table: ' + err.stack);
        return;
      }
      console.log('Milletcontact table created or already exists.');
    });
  });
};
 
const MilletContact = {
  create: (contactData, callback) => {
    pool.query(
      'INSERT INTO milletcontact (name, email, phone_number, message) VALUES (?, ?, ?, ?)',
      [contactData.name, contactData.email, contactData.phone_number, contactData.message],
      callback
    );
  },

  getAll: (callback) => {
    pool.query('SELECT * FROM milletcontact', callback);
  },

  getById: (id, callback) => {
    pool.query('SELECT * FROM milletcontact WHERE id = ?', [id], callback);
  },

  deleteById: (id, callback) => {
    pool.query('DELETE FROM milletcontact WHERE id = ?', [id], callback);
  },

  deleteAll: (callback) => {
    pool.query('TRUNCATE TABLE milletcontact', callback);
  }
};

module.exports = { MilletContact, createMilletContactTable };
