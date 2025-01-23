const { Order } = require('../models/milletorders.model'); 
 
const generateOrderId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
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
 
  const orderId = generateOrderId();

  const newOrder = { 
    user_id, 
    products: productsString, 
    total_mrp, 
    discount_on_mrp: discount, 
    total_amount,
    order_id: orderId  
  };

  Order.create(newOrder, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error creating order.', error: err });
    }
    res.status(201).json({
      message: 'Order created successfully.',
      orderId: result.insertId,   
      randomOrderId: orderId,     
    });
  });
};

module.exports = { createOrder };
