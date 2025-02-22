const nodemailer = require('nodemailer');
require('dotenv').config();   
const { Order } = require('../models/milletorders.model'); 
const { User } = require('../models/milletusers.model');
const { pool } = require('../db'); 


const generateOrderId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const sendEmail = async (emailData) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, 
      },
    });
    
    console.log("Transporter configured successfully");
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.body,
    };
    
    console.log("Sending email to:", emailData.to);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log("Email sent successfully:", info.response);
    return { success: true, message: "Email sent successfully", info };
  } catch (error) {
    console.error('Error in sendEmail:', error.message);
    return { success: false, message: "Failed to send email", error: error.message };
  }
};


const contactForm = async (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!name || !phone || !email || !message) {
    return res.status(400).json({
      message: "Name, phone, email, and message are required."
    });
  }

  const emailContent = `
    <h1>New Contact Request</h1>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong> ${message}</p>
  `;

  const emailData = {
    to: "Milletioglobalgrain@gmail.com",
    subject: "New Contact Request Received",
    body: emailContent,
  };

  try {
    const emailResponse = await sendEmail(emailData);
    if (emailResponse.success) {
      return res.status(200).json({
        message: "Email sent successfully",
        info: emailResponse.info
      });
    } else {
      return res.status(500).json({
        message: "Failed to send email",
        error: emailResponse.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while sending the email",
      error: error.message
    });
  }
};

const createOrder = (req, res) => {
  const { user_id, products, quantities, total_mrp, discount_on_mrp, total_amount } = req.body;

  if (!user_id || !products || !total_mrp || !total_amount) {
    return res.status(400).json({ message: 'User ID, products, total MRP, and total amount are required.' });
  }

  const discount = discount_on_mrp !== undefined ? discount_on_mrp : null;

  if (!Array.isArray(products) || products.some(isNaN)) {
    return res.status(400).json({ message: 'Invalid products format. Must be an array of product IDs.' });
  }

  const quantitiesString = (quantities && Array.isArray(quantities)) ? quantities.join(',') : null;
  const productsString = products.join(',');
  const orderId = generateOrderId();
  const orderDate = new Date().toLocaleString();  

  pool.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ message: 'Error getting connection for user search', error: err });
    }

    const query = 'SELECT email, phone_number, address, floor, tag FROM milletusers WHERE id = ?';
    connection.query(query, [user_id], (err, results) => {
      connection.release();

      if (err) {
        return res.status(500).json({ message: 'Error fetching user.', error: err });
      }

      if (!results.length) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const user = results[0];
      const userEmail = user.email;
      const userPhone = user.phone_number;
      const userAddress = user.address;
      const userFloor = user.floor || "Not Provided";
      const userTag = user.tag || "Not Provided";

      const newOrder = {
        user_id,
        products: productsString,
        quantities: quantitiesString,
        total_mrp,
        discount_on_mrp: discount,
        total_amount,
        order_id: orderId
      };

      const orderQuery = 'INSERT INTO milletorders (user_id, products, quantities, total_mrp, discount_on_mrp, total_amount, order_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
      pool.getConnection((err, connection) => {
        if (err) {
          return res.status(500).json({ message: 'Error getting connection for order creation', error: err });
        }

        connection.query(orderQuery, [
          newOrder.user_id,
          newOrder.products,
          newOrder.quantities,
          newOrder.total_mrp,
          newOrder.discount_on_mrp,
          newOrder.total_amount,
          newOrder.order_id
        ], async (err, result) => {
          connection.release();

          if (err) {
            return res.status(500).json({ message: 'Error creating order.', error: err });
          }

          const productQuery = 'SELECT id, name, price, discount, image FROM milletproducts WHERE id IN (?)';
          connection.query(productQuery, [products.map(id => parseInt(id))], async (err, productResults) => {
            if (err) {
              return res.status(500).json({ message: 'Error fetching products.', error: err });
            }


            const productDetails = productResults.map(product => {
              const productIndex = products.findIndex(prodId => parseInt(prodId) === product.id);
              const quantity = productIndex !== -1 ? quantities[productIndex] : 0;
              
              const imageUrl = product.image ? `https://api.milletioglobalgrain.in/${product.image}` : 'https://api.milletioglobalgrain.in/uploads/default-image.jpg'; // Fallback image URL
              
              console.log('Image URL:', imageUrl);
              
              return {
                name: product.name,
                price: product.price,
                discount: product.discount,
             
                quantity: quantity,
                imageUrl: imageUrl, 
              };
            });
             
            const productDetailsHtml = `
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: Arial, sans-serif;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Image</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Product</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Quantity</th>  
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">discount</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${productDetails.map(item => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                      <img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: auto; border-radius: 5px;">
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td> 
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.discount}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
          
             
          const sellerEmailBody = `
            <h1>New Order Received - Order # ${orderId}</h1>
            <strong>Dear Admin</strong>,
            <p><strong>Order Date:</strong> ${orderDate}</p>
            <h3>Customer Details:</h3>
            <ul>
              <li><strong>Email:</strong> ${userEmail}</li>
              <li><strong>Phone:</strong> ${userPhone}</li>
              <li><strong>Shipping Address:</strong> ${userAddress}, Floor: ${userFloor}</li>
              <li><strong>Tag:</strong> ${userTag}</li>
            </ul>
            <h3>Ordered Products:</h3>
            ${productDetailsHtml} <!-- Use directly without wrapping another table -->
            <h3>Total Amount: ${total_amount}</h3>  
            <p>Please prepare the order for shipment and ensure it reaches the customer within the expected timeframe.</p>
          `;
 
            const sellerEmailResponse = await sendEmail({ 
              to: 'Milletioglobalgrain@gmail.com', 
              subject: `New Order Received - Order # ${orderId}`,  
              body: sellerEmailBody,
            });
 
           const customerEmailBody = `
            <h1>Order Confirmation - Order # ${orderId}</h1>
            <p><strong>Order Date:</strong> ${orderDate}</p> 
            <h3>Ordered Products:</h3>
            ${productDetailsHtml} <!-- Use directly without wrapping another table -->
            <h3>Total Amount: ${total_amount}</h3> 
            <p>Thank you for shopping with us! Your order will be processed soon.</p>
            <p>If you need any additional information or assistance, feel free to <a href="https://milletioglobalgrain.in/contact">contact us</a></p>.
            <p>Best regards,</p>
            <p><strong>Milletio</strong></p>
          `;
           
            const customerEmailResponse = await sendEmail({
              to: userEmail,  
              subject: `Order Confirmation from Milletio`, 
              body: customerEmailBody,
            });
 
            res.status(201).json({
              message: 'Order created successfully.',
              orderId: result.insertId,
              randomOrderId: orderId,
              emailStatus: { sellerEmailResponse, customerEmailResponse }
            });
          });
        });
      });
    });
  });
};



const deleteAllOrders = (req, res) => { 
  Order.deleteAll((err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting all orders.', error: err });
    }
 
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No orders found to delete.' });
    }

    return res.status(200).json({ message: 'All orders deleted successfully.' });
  });
};

const deleteOrderById = (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required.' });
  }
 
  Order.deleteById(orderId, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting order.', error: err });
    }
 
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Order with ID ${orderId} not found.` });
    }

    return res.status(200).json({ message: `Order with ID ${orderId} deleted successfully.` });
  });
};

module.exports = { createOrder, sendEmail, deleteAllOrders, deleteOrderById, contactForm };
