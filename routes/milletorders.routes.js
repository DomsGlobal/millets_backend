const express = require('express');
const { createOrder, deleteOrderById, deleteAllOrders, contactForm, updateOrderStatus, getAllOrders, getOrderByOrderId } = require('../controllers/milletorders.controller'); 

const router = express.Router();
 
router.post('/orders', createOrder);
router.post('/orders/delete/:id', deleteOrderById);
router.post('/orders/delete', deleteAllOrders);
router.post('/contact', contactForm);
router.get('/orders', getAllOrders); 
router.get('/orders/:orderId', getOrderByOrderId); 
router.put("/status/:orderIdentifier", updateOrderStatus);


module.exports = router;
