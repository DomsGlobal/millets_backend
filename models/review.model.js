const { pool } = require('../db');

const createReviewsTableQuery = `
  CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    image VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
    status INT DEFAULT 1  -- Default status is 1 (active)
  )
`;

const createReviewsTable = () => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return;
    }
    connection.query(createReviewsTableQuery, (err) => {
      connection.release();
      if (err) {
        console.error('Error creating reviews table: ' + err.stack);
        return;
      }
      console.log('Reviews table created or already exists.');
    });
  });
};

const Review = {
  create: (reviewData, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }

      const query = 'INSERT INTO reviews (name, email, image, message, stars, status) VALUES (?, ?, ?, ?, ?, ?)';
      connection.query(query, [
        reviewData.name,
        reviewData.email || null,
        reviewData.image,
        reviewData.message,
        reviewData.stars,
        reviewData.status || 1
      ], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },
 
  getAllWithoutStatus: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }

      const query = 'SELECT * FROM reviews';
      connection.query(query, (err, results) => {
        connection.release();
        callback(err, results);
      });
    });
  },

  // Get all reviews where status = 1 (active)
  getAll: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }

      const query = 'SELECT * FROM reviews WHERE status = 1';
      connection.query(query, (err, results) => {
        connection.release();
        callback(err, results);
      });
    });
  },

  updateStatus: (id, status, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }

      const query = 'UPDATE reviews SET status = ? WHERE id = ?';
      connection.query(query, [status, id], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },

  // Delete all reviews
  deleteAll: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }

      const query = 'DELETE FROM reviews';
      connection.query(query, (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },

  // Delete a review by ID
  deleteById: (id, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }

      const query = 'DELETE FROM reviews WHERE id = ?';
      connection.query(query, [id], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  }
};

module.exports = { createReviewsTable, Review };
