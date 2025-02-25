const { Cart } = require('../models/cart.model');
const { pool } = require('../db');

const addToCart = (req, res) => {
    const { user_id, products } = req.body; // Expecting an array of products
  
    if (!user_id || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'User ID and a valid products array are required.' });
    }
  
    const values = products.map(({ product_id, quantity }) => [user_id, product_id, quantity]);
  
    const insertQuery = `
      INSERT INTO cart (user_id, product_id, quantity)
      VALUES ?
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `;
  
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err.stack);
        return res.status(500).json({ message: 'Database connection error', error: err });
      }
  
      connection.query(insertQuery, [values], (err, result) => {
        connection.release();
  
        if (err) {
          console.error('Error inserting into cart:', err);
          return res.status(500).json({ message: 'Error adding items to cart.', error: err });
        }
  
        res.status(201).json({
          message: 'Items added to cart successfully.',
          affectedRows: result.affectedRows,
        });
      });
    });
  };
  
  const getCartByUserId = (req, res) => {
    const { user_id } = req.params;
  
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }
  
    Cart.findByUserId(user_id, (err, cartItems) => {
      if (err) {
        console.error('Error retrieving cart:', err);
        return res.status(500).json({ success: false, message: 'Error retrieving cart.', error: err });
      }
  
      res.status(200).json({
        success: true,
        message: cartItems.length > 0 ? 'Cart retrieved successfully.' : 'Cart is empty.',
        cart: cartItems
      });
    });
  };
  

const removeCartItem = (req, res) => {
    const { id } = req.params;
  
    if (!id) {
      return res.status(400).json({ message: 'Cart item ID is required.' });
    }
  
    Cart.deleteById(id, (err, result) => {
      if (err) {
        console.error('Error deleting cart item:', err);
        return res.status(500).json({ message: 'Error deleting cart item.', error: err });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Cart item not found.' });
      }
  
      res.status(200).json({ message: 'Cart item deleted successfully.' });
    });
  };
  

  const updateCartItem = (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
  
    if (!id || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid cart item ID and quantity are required.' });
    }
  
    Cart.updateById(id, { quantity }, (err, result) => {
      if (err) {
        console.error('Error updating cart item:', err);
        return res.status(500).json({ message: 'Error updating cart item.', error: err });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Cart item not found.' });
      }
  
      res.status(200).json({ message: 'Cart item updated successfully.' });
    });
  };
  
  const clearCart = (req, res) => {
    Cart.deleteAll((err, result) => {
      if (err) {
        console.error('Error clearing cart:', err);
        return res.status(500).json({ message: 'Error clearing cart.', error: err });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Cart is already empty.' });
      }
  
      res.status(200).json({ message: 'Cart cleared successfully.' });
    });
  };
  

module.exports = {
  addToCart,
  getCartByUserId,
  removeCartItem,
  updateCartItem,
  clearCart
};
