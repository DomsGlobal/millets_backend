const { pool } = require('../db');   

const createOrdersTableQuery = `
  CREATE TABLE IF NOT EXISTS milletorders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, 
    products TEXT NOT NULL,
    total_mrp DECIMAL(10, 2) NOT NULL, 
    discount_on_mrp DECIMAL(10, 2) DEFAULT NULL,  -- Make discount_on_mrp optional
    total_amount DECIMAL(10, 2) NOT NULL,
    order_id VARCHAR(8) NOT NULL,  -- Add the new column for order_id
    FOREIGN KEY (user_id) REFERENCES milletusers(id)
  )
`;

const createMilletOrdersTable = () => {
  pool.getConnection((err, connection) => {  
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return;
    }
    connection.query(createOrdersTableQuery, (err) => { 
      connection.release();  
      if (err) {
        console.error('Error creating milletorders table: ' + err.stack);
        return;
      }
      console.log('Milletorders table created or already exists.');
    });
  });
};

const Order = { 
  create: (orderData, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      } 
      const query = 'INSERT INTO milletorders (user_id, products, total_mrp, discount_on_mrp, total_amount, order_id) VALUES (?, ?, ?, ?, ?, ?)';
      connection.query(query, [
        orderData.user_id, 
        orderData.products, 
        orderData.total_mrp, 
        orderData.discount_on_mrp, 
        orderData.total_amount,
        orderData.order_id  
      ], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },
 
  find: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }
      const query = 'SELECT * FROM milletorders';
      connection.query(query, (err, results) => {
        connection.release();
        callback(err, results);
      });
    });
  },
 
  findById: (id, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }
      const query = 'SELECT * FROM milletorders WHERE id = ?';
      connection.query(query, [id], (err, results) => {
        connection.release();
        callback(err, results.length > 0 ? results[0] : null);
      });
    });
  }
};

module.exports = { Order, createMilletOrdersTable };
