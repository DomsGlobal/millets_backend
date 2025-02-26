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
  const { user_id, address_id, products, total_mrp, discount_on_mrp, total_amount } = req.body;

  if (!user_id || !address_id || !Array.isArray(products) || !total_mrp || !total_amount) {
    return res.status(400).json({ message: 'Missing or invalid required fields.' });
  }

  const orderId = generateOrderId();
  const orderDate = new Date().toLocaleString();
  const formattedProducts = JSON.stringify(products); // Save as JSON in DB

  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Database connection error', error: err });

    const userQuery = 'SELECT email, phone FROM user WHERE id = ?';
    connection.query(userQuery, [user_id], (err, userResults) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Error fetching user details.', error: err });
      }

      if (!userResults.length) {
        connection.release();
        return res.status(404).json({ message: 'User not found.' });
      }

      const user = userResults[0];

      // Fetch address separately
      const addressQuery = 'SELECT address, floor, tag FROM address WHERE id = ? AND user_id = ?';
      connection.query(addressQuery, [address_id, user_id], (err, addressResults) => {
        if (err) {
          connection.release();
          return res.status(500).json({ message: 'Error fetching address details.', error: err });
        }

        const address = addressResults.length
          ? addressResults[0]
          : { address: 'Not Provided', floor: 'Not Provided', tag: 'Not Provided' };

        // Insert order
        const orderQuery = `
          INSERT INTO milletorders (user_id, address_id, products, total_mrp, discount_on_mrp, total_amount, order_status, order_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        connection.query(orderQuery, [
          user_id,
          address_id,
          formattedProducts,
          total_mrp,
          discount_on_mrp || null,
          total_amount,
          'pending',
          orderId
        ], (err, result) => {
          if (err) {
            connection.release();
            return res.status(500).json({ message: 'Error creating order.', error: err });
          }

          const productIds = products.map(p => p.id);
          const productQuery = 'SELECT id, name, price, discount, image FROM milletproducts WHERE id IN (?)';

          connection.query(productQuery, [productIds], async (err, productResults) => {
            connection.release();

            if (err) {
              return res.status(500).json({ message: 'Error fetching product details.', error: err });
            }

            const productDetails = productResults.map(product => {
              const productData = products.find(p => p.id === product.id);
              return {
                id: product.id,
                name: product.name,
                price: product.price,
                discount: product.discount,
                quantity: productData.quantity,
                imageUrl: product.image
                  ? `https://api.milletioglobalgrain.in/${product.image}`
                  : 'https://api.milletioglobalgrain.in/uploads/default-image.jpg'
              };
            });

            // **Seller Email**
            const sellerEmailBody = `
              <h1>New Order Received - Order # ${orderId}</h1>
              <p><strong>Order Date:</strong> ${orderDate}</p>
              <h3>Customer Details:</h3>
              <ul>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Phone:</strong> ${user.phone}</li>
                <li><strong>Shipping Address:</strong> ${address.address}, Floor: ${address.floor}</li>
                <li><strong>Tag:</strong> ${address.tag}</li>
              </ul>
              <h3>Ordered Products:</h3>
              ${generateProductTable(productDetails)}
              <h3>Total Amount: ${total_amount}</h3>  
              <p>Please prepare the order for shipment and ensure it reaches the customer within the expected timeframe.</p>
            `;

            await sendEmail({
              to: 'kramsai122000@gmail.com',
              subject: `New Order Received - Order # ${orderId}`,
              body: sellerEmailBody,
            });

            // **Customer Email**
            const customerEmailBody = `
              <h1>Order Confirmation - Order # ${orderId}</h1>
              <p><strong>Order Date:</strong> ${orderDate}</p>
              <h3>Ordered Products:</h3>
              ${generateProductTable(productDetails)}
              <h3>Total Amount: ${total_amount}</h3> 
              <p>Thank you for shopping with us! Your order will be processed soon.</p>
            `;

            await sendEmail({
              to: user.email,
              subject: `Order Confirmation from Milletio`,
              body: customerEmailBody,
            });

            res.status(201).json({
              message: 'Order created successfully.',
              orderId: result.insertId,
              randomOrderId: orderId,
            });
          });
        });
      });
    });
  });
};

// Helper function to generate product table HTML
const generateProductTable = (products) => {
  return `
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Image</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Product</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Quantity</th>  
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Discount</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(item => `
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
 

const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']; // Removed "dispatched" and fixed spelling

const updateOrderStatus = (req, res) => {
  const { orderIdentifier } = req.params;
  const { order_status } = req.body;

  if (!orderIdentifier) {
    return res.status(400).json({ message: "Order Identifier (ID or Order ID) is required." });
  }

  if (!order_status || !allowedStatuses.includes(order_status)) {
    return res.status(400).json({ message: `Invalid order status. Allowed values: ${allowedStatuses.join(', ')}` });
  }

  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: "Database connection error", error: err });

    let updateQuery;
    let queryParams;

    if (/^\d+$/.test(orderIdentifier)) {
      updateQuery = "UPDATE milletorders SET order_status = ? WHERE id = ?";
      queryParams = [order_status, orderIdentifier];
    } else {
      updateQuery = "UPDATE milletorders SET order_status = ? WHERE order_id = ?";
      queryParams = [order_status, orderIdentifier];
    }

    connection.query(updateQuery, queryParams, (err, result) => {
      connection.release();

      if (err) {
        return res.status(500).json({ message: "Error updating order status.", error: err });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Order not found or no changes made." });
      }

      res.status(200).json({
        message: "Order status updated successfully.",
        order_status,
        orderIdentifier
      });
    });
  });
};

const getAllOrders = (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ message: "Database connection error", error: err });
    }

    const query = "SELECT * FROM milletorders ORDER BY created_at DESC"; // Assuming you have a created_at column

    connection.query(query, (err, orders) => {
      connection.release();

      if (err) {
        return res.status(500).json({ message: "Error fetching orders.", error: err });
      }

      // If there are orders, process them
      if (orders.length === 0) {
        return res.status(404).json({ message: "No orders found." });
      }

      // Fetch user and address details along with the products for each order
      const ordersWithDetailsPromises = orders.map(order => {
        return new Promise((resolve, reject) => {
          // Fetch user details by user_id
          connection.query('SELECT * FROM user WHERE id = ?', [order.user_id], (err, userResults) => {
            if (err) return reject(err);
            const user = userResults[0];

            // Fetch address details by address_id
            connection.query('SELECT * FROM address WHERE id = ?', [order.address_id], (err, addressResults) => {
              if (err) return reject(err);
              const address = addressResults[0];

              // Fetch product details for each product in the order
              const productIds = order.products.map(p => p.id);
              connection.query('SELECT * FROM milletproducts WHERE id IN (?)', [productIds], (err, productResults) => {
                if (err) return reject(err);

                // Map products with details
                const productsWithDetails = order.products.map(product => {
                  const productDetails = productResults.find(p => p.id === product.id);
                  return {
                    id: product.id,
                    quantity: product.quantity,
                    name: productDetails.name,
                    description: productDetails.description,
                    price: productDetails.price,
                    discount: productDetails.discount,
                    original_price: productDetails.original_price,
                    image: productDetails.image,
                    stars: productDetails.stars
                  };
                });

                // Map the full order object with user, address, and products
                resolve({
                  id: order.id,
                  order_id: order.order_id,
                  user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                  },
                  address: address ? {
                    id: address.id,
                    phone_number: address.phone_number,
                    email: address.email,
                    address: address.address,
                    floor: address.floor,
                    tag: address.tag,
                    pin_code: address.pin_code
                  } : null,
                  products: productsWithDetails,
                  total_mrp: order.total_mrp,
                  discount_on_mrp: order.discount_on_mrp,
                  total_amount: order.total_amount,
                  order_status: order.order_status,
                  created_at: order.created_at,
                  updated_at: order.updated_at
                });
              });
            });
          });
        });
      });

      // Wait for all promises to resolve and send the response
      Promise.all(ordersWithDetailsPromises)
        .then(ordersWithDetails => {
          return res.status(200).json({ message: "Orders retrieved successfully.", orders: ordersWithDetails });
        })
        .catch(err => {
          return res.status(500).json({ message: "Error processing orders.", error: err });
        });
    });
  });
};

const getOrderByOrderId = (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required." });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ message: "Database connection error", error: err });
    }

    let query;
    let queryParams;

    // Check if the orderId is numeric (ID) or alphanumeric (order_id)
    if (/^\d+$/.test(orderId)) {
      query = `
        SELECT o.*, u.id AS user_id, u.name, u.email, u.phone, a.id AS address_id, a.phone_number, a.email AS address_email, a.address, a.floor, a.tag, a.pin_code
        FROM milletorders o
        JOIN user u ON o.user_id = u.id
        LEFT JOIN address a ON o.address_id = a.id
        WHERE o.id = ?
      `;
      queryParams = [orderId];
    } else {
      query = `
        SELECT o.*, u.id AS user_id, u.name, u.email, u.phone, a.id AS address_id, a.phone_number, a.email AS address_email, a.address, a.floor, a.tag, a.pin_code
        FROM milletorders o
        JOIN user u ON o.user_id = u.id
        LEFT JOIN address a ON o.address_id = a.id
        WHERE o.order_id = ?
      `;
      queryParams = [orderId];
    }

    connection.query(query, queryParams, (err, results) => {
      connection.release();

      if (err) {
        return res.status(500).json({ message: "Error fetching order.", error: err });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: `Order with ID ${orderId} not found.` });
      }

      // Fetch product details for each product in the order
      const order = results[0];
      const productIds = order.products.map(product => product.id);  // Extract product IDs

      // Query to fetch product details for the given product IDs
      const productQuery = `
        SELECT * FROM milletproducts WHERE id IN (?);
      `;
      connection.query(productQuery, [productIds], (err, products) => {
        if (err) {
          return res.status(500).json({ message: "Error fetching product details.", error: err });
        }

        // Map product details to order products, including quantity
        const productsWithDetails = order.products.map(product => {
          const productDetails = products.find(p => p.id === product.id);
          return {
            id: product.id,
            quantity: product.quantity,
            name: productDetails.name,
            description: productDetails.description,
            price: productDetails.price,
            discount: productDetails.discount,
            original_price: productDetails.original_price,
            image: productDetails.image,
            stars: productDetails.stars
          };
        });

        // Format the order response with product details
        const formattedOrder = {
          id: order.id,
          order_id: order.order_id,
          user: {
            id: order.user_id,
            name: order.name,
            email: order.email,
            phone: order.phone
          },
          address: order.address_id ? {
            id: order.address_id,
            phone_number: order.phone_number,
            email: order.address_email,
            address: order.address,
            floor: order.floor,
            tag: order.tag,
            pin_code: order.pin_code
          } : null,
          products: productsWithDetails,
          total_mrp: order.total_mrp,
          discount_on_mrp: order.discount_on_mrp,
          total_amount: order.total_amount,
          order_status: order.order_status,
          created_at: order.created_at,
          updated_at: order.updated_at
        };

        return res.status(200).json({ message: "Order retrieved successfully.", order: formattedOrder });
      });
    });
  });
};

  
module.exports = { createOrder, sendEmail, deleteAllOrders, deleteOrderById, contactForm, updateOrderStatus, getAllOrders, getOrderByOrderId};
