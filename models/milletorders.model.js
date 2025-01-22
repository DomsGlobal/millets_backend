const { pool } = require('../db');   

const createOrdersTableQuery = `
  CREATE TABLE IF NOT EXISTS milletorders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, 
    products TEXT NOT NULL,
    total_mrp DECIMAL(10, 2) NOT NULL, 
    discount_on_mrp DECIMAL(10, 2) DEFAULT NULL,  -- Make discount_on_mrp optional
    total_amount DECIMAL(10, 2) NOT NULL,
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
      const query = 'INSERT INTO milletorders (user_id, products, total_mrp, discount_on_mrp, total_amount) VALUES (?, ?, ?, ?, ?)';
      connection.query(query, [
        orderData.user_id, 
        orderData.products, 
        orderData.total_mrp, 
        orderData.discount_on_mrp, 
        orderData.total_amount
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

const createOrder = (req, res) => {
  const { user_id, products, total_mrp, discount_on_mrp, total_amount } = req.body;

  if (!user_id || !products || !total_mrp || !total_amount) {
    return res.status(400).json({ message: 'User ID, products, total MRP, and total amount are required.' });
  }
 
  const discount = discount_on_mrp !== undefined ? discount_on_mrp : null;

  if (!Array.isArray(products) || products.some(isNaN)) {
    return res.status(400).json({ message: 'Invalid products format. Must be an array of product IDs.' });
  }

  const productsString = products.join(',');

  const newOrder = { 
    user_id, 
    products: productsString, 
    total_mrp, 
    discount_on_mrp: discount, 
    total_amount 
  };

  Order.create(newOrder, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error creating order.', error: err });
    }
    res.status(201).json({
      message: 'Order created successfully.',
      orderId: result.insertId,
    });
  });
};

module.exports = { Order, createMilletOrdersTable };
