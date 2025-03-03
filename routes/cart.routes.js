const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller'); 
const auth = require('../middleware/auth');  
 
router.post('/cart/add', auth, cartController.addToCart);
router.get('/cart/user', auth, cartController.getCartByUserId);
router.delete('/cart/clear', auth, cartController.clearCart);  
router.delete('/cart/:id', auth, cartController.removeCartItem);
router.put('/cart/:id', auth, cartController.updateCartItem);

module.exports = router;
