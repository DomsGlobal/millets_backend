const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller'); 
const auth = require('../middleware/auth');  
 
router.post('/cart/add', auth, cartController.addToCart);
router.get('/cart/:user_id', auth, cartController.getCartByUserId);
router.delete('/cart/clear', auth, cartController.clearCart);  
router.delete('/cart/:id', auth, cartController.removeCartItem); // cartId
router.put('/cart/:id', auth, cartController.updateCartItem); // cartId

module.exports = router;
