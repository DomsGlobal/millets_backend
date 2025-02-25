const { pool } = require('../db');

const createCartTableQuery = `
  CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES milletproducts(id) ON DELETE CASCADE
  )
`;

const createCartTable = () => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection:', err.stack);
      return;
    }
    connection.query(createCartTableQuery, (err) => {
      connection.release();
      if (err) {
        console.error('Error creating cart table:', err.stack);
        return;
      }
      console.log('Cart table created or already exists.');
    });
  });
};

const Cart = {
  create: (cartData, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err.stack);
        return;
      }
      const query = `
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `;
      connection.query(query, [
        cartData.user_id,
        cartData.product_id,
        cartData.quantity || 1
      ], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },

  findByUserId: (user_id, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err.stack);
        return;
      }
      const query = `
        SELECT cart.id, cart.user_id, cart.product_id, cart.quantity, milletproducts.name, milletproducts.price, milletproducts.image
        FROM cart
        INNER JOIN milletproducts ON cart.product_id = milletproducts.id
        WHERE cart.user_id = ?
      `;
      connection.query(query, [user_id], (err, results) => {
        connection.release();
        callback(err, results);
      });
    });
  },

  deleteAll: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err.stack);
        return;
      }
      const query = 'DELETE FROM cart';
      connection.query(query, (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },

  deleteById: (id, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err.stack);
        return;
      }
      const query = 'DELETE FROM cart WHERE id = ?';
      connection.query(query, [id], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },

  updateById: (id, updatedData, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err.stack);
        return;
      }
      const { quantity } = updatedData;
      const query = 'UPDATE cart SET quantity = ? WHERE id = ?';
      connection.query(query, [quantity, id], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  }
};

module.exports = { Cart, createCartTable };
