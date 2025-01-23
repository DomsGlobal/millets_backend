const { pool } = require('../db');  

const createProductsTableQuery = `
  CREATE TABLE IF NOT EXISTS milletproducts ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(255) NOT NULL, 
    description TEXT NOT NULL, 
    image VARCHAR(255) NOT NULL, 
    stars INT NOT NULL, 
    price DECIMAL(10, 2) NOT NULL, 
    discount DECIMAL(5, 2) NOT NULL, 
    original_price DECIMAL(10, 2) NOT NULL, 
    ingredient VARCHAR(255),  
    allergens VARCHAR(255),   
    tag VARCHAR(255)          
  )
`;



const createMilletProductsTable = () => {
  pool.getConnection((err, connection) => {  
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return;
    }
    connection.query(createProductsTableQuery, (err) => { 
      connection.release();  
      if (err) {
        console.error('Error creating milletproducts table: ' + err.stack);
        return;
      }
      console.log('Milletproducts table created or already exists.');
    });
  });
};

const Product = {
  create: (productData, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }
      const query = 'INSERT INTO milletproducts (name, description, image, stars, price, discount, original_price, ingredient, allergens, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      connection.query(query, [
        productData.name,
        productData.description,
        productData.image,
        productData.stars,
        productData.price,
        productData.discount,
        productData.original_price,
        productData.ingredient, 
        productData.allergens,  
        productData.tag || null 
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
      const query = 'SELECT * FROM milletproducts';
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
      const query = 'SELECT * FROM milletproducts WHERE id = ?';
      connection.query(query, [id], (err, results) => {
        connection.release();  
        callback(err, results.length > 0 ? results[0] : null);  
      });
    });
  },

  deleteAll: (callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }
      const query = 'DELETE FROM milletproducts';
      connection.query(query, (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },

  deleteById: (id, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }
      const query = 'DELETE FROM milletproducts WHERE id = ?';
      connection.query(query, [id], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  },

  updateById: (id, updatedData, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection: ' + err.stack);
        return;
      }
      const { name, description, image, stars, price, discount } = updatedData;
      const query = 'UPDATE milletproducts SET name = ?, description = ?, image = ?, stars = ?, price = ?, discount = ? WHERE id = ?';
      connection.query(query, [name, description, image, stars, price, discount, id], (err, result) => {
        connection.release();
        callback(err, result);
      });
    });
  }
};


module.exports = { Product, createMilletProductsTable };
