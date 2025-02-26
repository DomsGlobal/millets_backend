const { pool } = require('../db');

const createOrdersTableQuery = `
  CREATE TABLE IF NOT EXISTS milletorders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, 
    address_id INT NOT NULL,  
    products JSON NOT NULL,  -- Store products and their quantities in JSON format
    total_mrp DECIMAL(10,2) NOT NULL, 
    discount_on_mrp DECIMAL(10,2) DEFAULT NULL, 
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    order_id VARCHAR(12) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES address(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id)
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
      if (err) return callback(err, null);

      const query = `
      INSERT INTO milletorders (user_id, address_id, products, total_mrp, discount_on_mrp, total_amount, order_status, order_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

      // ✅ Ensure products include quantity
      const productsArray = orderData.products.map((productId, index) => ({
        id: productId,
        quantity: orderData.quantities[index] || 1 // Ensure quantity is included
      }));

      const productsJSON = JSON.stringify(productsArray); // Convert to JSON

      connection.query(
        query,
        [
          orderData.user_id,
          orderData.address_id,
          productsJSON, // ✅ Store properly formatted JSON
          orderData.total_mrp,
          orderData.discount_on_mrp,
          orderData.total_amount,
          orderData.order_status || 'pending',
          orderData.order_id,
        ],
        (err, result) => {
          connection.release();
          callback(err, result);
        }
      );
    });
  },

find: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) return callback(err, null);

      const query = `
        SELECT o.*, a.address, a.phone_number, a.email, a.pin_code 
        FROM milletorders o
        JOIN address a ON o.address_id = a.id
      `;

      connection.query(query, (err, results) => {
        connection.release();
        
        // ✅ Convert products column back to JSON
        if (results) {
          results.forEach(order => {
            order.products = JSON.parse(order.products);
          });
        }

        callback(err, results);
      });
    });
  },

  findById: (id, callback) => {
    pool.getConnection((err, connection) => {
      if (err) return callback(err, null);

      const query = `
        SELECT o.*, a.address, a.phone_number, a.email, a.pin_code 
        FROM milletorders o
        JOIN address a ON o.address_id = a.id
        WHERE o.id = ?
      `;
      connection.query(query, [id], (err, results) => {
        connection.release();

        if (results.length > 0) {
          results[0].products = JSON.parse(results[0].products);
        }

        callback(err, results.length > 0 ? results[0] : null);
      });
    });
  },

  updateOrderStatus: (id, newStatus, callback) => {
    pool.getConnection((err, connection) => {
      if (err) return callback(err, null);

      const query = `
        UPDATE milletorders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `;
      connection.query(query, [newStatus, id], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },

  deleteAll: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) return callback(err, null);

      const query = 'DELETE FROM milletorders';
      connection.query(query, (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },

  deleteById: (id, callback) => {
    pool.getConnection((err, connection) => {
      if (err) return callback(err, null);

      const query = 'DELETE FROM milletorders WHERE id = ?';
      connection.query(query, [id], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  }
};

module.exports = { Order, createMilletOrdersTable };
