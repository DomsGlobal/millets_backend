const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { Otp } = require('../models/otp.model');
const SECRET_KEY = 'your_secret_key';  

// Email sending function
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
    console.error('Error in sendEmail:', error);
    return { success: false, message: "Failed to send email", error: error.message, stack: error.stack };
  }
};

 

// Register User
const register = (req, res) => {
  const { name, email, phone, password } = req.body;
  
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Failed to connect to database. Please try again later.' });

    // Check if email already exists in user table
    const checkEmailUserQuery = 'SELECT * FROM user WHERE email = ?';
    connection.query(checkEmailUserQuery, [email], (err, userEmailResults) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Error checking existing user. Please try again.' });
      }

      if (userEmailResults.length > 0) {
        connection.release();
        return res.status(409).json({ message: 'Email already in use in user table. Please choose a different email.' });
      }

      // Check if email already exists in admins table
      const checkEmailAdminQuery = 'SELECT * FROM admins WHERE email = ?';
      connection.query(checkEmailAdminQuery, [email], (err, adminEmailResults) => {
        if (err) {
          connection.release();
          return res.status(500).json({ message: 'Error checking existing admin. Please try again.' });
        }

        if (adminEmailResults.length > 0) {
          connection.release();
          return res.status(409).json({ message: 'Email already in use in admin table. Please choose a different email.' });
        }

        // Check if phone number already exists in user table
        const checkPhoneUserQuery = 'SELECT * FROM user WHERE phone = ?';
        connection.query(checkPhoneUserQuery, [phone], (err, phoneUserResults) => {
          if (err) {
            connection.release();
            return res.status(500).json({ message: 'Error checking phone number. Please try again.' });
          }

          if (phoneUserResults.length > 0) {
            connection.release();
            return res.status(409).json({ message: 'Phone number already in use in user table. Please choose a different one.' });
          }

          // Check if phone number already exists in admins table
          const checkPhoneAdminQuery = 'SELECT * FROM admins WHERE phone = ?';
          connection.query(checkPhoneAdminQuery, [phone], (err, phoneAdminResults) => {
            if (err) {
              connection.release();
              return res.status(500).json({ message: 'Error checking phone number. Please try again.' });
            }

            if (phoneAdminResults.length > 0) {
              connection.release();
              return res.status(409).json({ message: 'Phone number already in use in admin table. Please choose a different one.' });
            }

            // Generate OTP and send email
            const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
            const otpExpiration = new Date(Date.now() + 15 * 60 * 1000); // OTP expires in 15 minutes

            // Save OTP to database with role as "customer"
            Otp.create(email, otp, otpExpiration, 'customer', (err, result) => {
              if (err) {
                console.error('Error saving OTP:', err);
                return res.status(500).json({ message: 'Error saving OTP. Please try again.' });
              }

              // Send OTP email
              const emailData = {
                to: email,
                subject: 'Your OTP for Registration',
                body: `<h3>Your OTP is: ${otp}</h3><p>This OTP will expire in 15 minutes.</p>`,
              };

              sendEmail(emailData).then((emailResponse) => {
                if (emailResponse.success) {
                  // OTP sent successfully
                  res.status(200).json({
                    message: 'OTP sent successfully. Please verify your OTP.',
                    otpExpiration, // Optionally, include OTP expiration time
                  });
                } else {
                  return res.status(500).json({ message: 'Error sending OTP. Please try again.' });
                }
              }).catch((err) => {
                console.error('Error sending OTP:', err);
                return res.status(500).json({ message: 'Error sending OTP. Please try again.' });
              });
            });
          });
        });
      });
    });
  });
};


const verifyOtpAndRegister = (req, res) => {
  const { name, email, phone, password, otp } = req.body;

  if (!name || !email || !phone || !password || !otp) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Verify the OTP and get the role from the OTP table
  Otp.verify(email, otp, (err, otpResults) => {
    if (err) {
      console.error('Error verifying OTP:', err);
      return res.status(500).json({ message: 'Error verifying OTP. Please try again.' });
    }

    if (otpResults.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP or OTP has expired.' });
    }

    // Get the role from OTP results
    const role = otpResults[0].role;  // This will be either 'admin' or 'customer'

    // Proceed to hash the password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ message: 'Error securing your password. Please try again.' });
      }

      const token = jwt.sign({ email, phone }, SECRET_KEY, { expiresIn: '1h' });

      const newUser = { name, email, phone, password: hash, token };

      pool.getConnection((err, connection) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to connect to database. Please try again later.' });
        }

        // Check if phone number already exists
        const checkPhoneQuery = 'SELECT * FROM user WHERE phone = ?';
        connection.query(checkPhoneQuery, [phone], (err, phoneResults) => {
          if (err) {
            connection.release();
            return res.status(500).json({ message: 'Error checking phone number. Please try again.' });
          }

          if (phoneResults.length > 0) {
            connection.release();
            return res.status(409).json({ message: 'Phone number already in use. Please choose a different one.' });
          }

          // Insert the new user without the role column (because it's stored in OTP table)
          const insertUserQuery = 'INSERT INTO user (name, email, phone, password, token) VALUES (?, ?, ?, ?, ?)';
          connection.query(insertUserQuery, [newUser.name, newUser.email, newUser.phone, newUser.password, newUser.token], (err, result) => {
            connection.release();
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).json({ message: 'Error creating user. Please try again.' });
            }

            res.status(201).json({
              message: 'Registration successful!',
              userId: result.insertId,
              token: newUser.token,
              role: role,  // Include role in the response
            });
          });
        });
      });
    });
  });
};



// Login User
const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Database connection error' });

    const query = 'SELECT * FROM user WHERE email = ?';
    connection.query(query, [email], (err, results) => {
      connection.release();
      if (err) return res.status(500).json({ message: 'Error fetching user' });

      if (results.length === 0) {
        return res.status(401).json({ message: 'Incorrect email or password. Please try again.' });
      }

      const user = results[0];
      console.log('Stored Hash:', user.password);
      console.log('Entered Password:', password);

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ message: 'Error verifying password' });

        console.log('Password Match:', isMatch);
        if (!isMatch) {
          return res.status(401).json({ message: 'Incorrect email or password. Please try again.' });
        }
 
        const token = jwt.sign(
          { email: user.email, phone: user.phone, role: 'customer' },
          SECRET_KEY,
          { expiresIn: '1h' }
        );
 
        if (!token) {
          return res.status(500).json({ message: 'Error generating token' });
        }

        pool.getConnection((err, connection) => {
          if (err) return res.status(500).json({ message: 'Database connection error' });

          const updateQuery = 'UPDATE user SET token = ? WHERE id = ?';
          connection.query(updateQuery, [token, user.id], (err) => {
            connection.release();
            if (err) return res.status(500).json({ message: 'Error updating token' });

            res.status(200).json({
              message: 'Login successful',
              userId: user.id,
              role: 'customer',
              token, 
            });
          });
        });
      });
    });
  });
};


const logout = (req, res) => {
  const { userId } = req.params; // Get userId from params

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required for logout' });
  }

  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Database connection error' });

    const query = 'UPDATE user SET token = NULL WHERE id = ?';
    connection.query(query, [userId], (err, result) => {
      connection.release();
      if (err) return res.status(500).json({ message: 'Error logging out' });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Logout successful' });
    });
  });
};


// Get all users
const getAllUsers = (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Database connection error' });

    const query = `
      SELECT u.id, u.name, u.email, u.phone, 
             COUNT(o.id) AS total_orders 
      FROM user u
      LEFT JOIN milletorders o ON u.id = o.user_id
      GROUP BY u.id
    `;

    connection.query(query, (err, results) => {
      connection.release();
      if (err) return res.status(500).json({ message: 'Error fetching users' });

      res.status(200).json({ users: results });
    });
  });
};


// Get user by ID
const getUserById = (req, res) => {
  const { userId } = req.params;

  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Database connection error' });

    const query = `
      SELECT u.id, u.name, u.email, u.phone, 
             COUNT(o.id) AS order_count, 
             GROUP_CONCAT(DISTINCT o.products) AS product_ids
      FROM user u
      LEFT JOIN milletorders o ON u.id = o.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `;

    connection.query(query, [userId], (err, results) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Error fetching user' });
      }

      if (results.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'User not found' });
      }

      const user = results[0];

      // Extract unique product IDs
      const productIds = user.product_ids ? [...new Set(user.product_ids.split(','))] : [];

      if (productIds.length === 0) {
        connection.release();
        return res.status(200).json({ user: { ...user, products: [] } });
      }
 
      const productQuery = `SELECT * FROM milletproducts WHERE id IN (?)`;
      connection.query(productQuery, [productIds], (err, productResults) => {
        connection.release();
        if (err) return res.status(500).json({ message: 'Error fetching products' });

        user.products = productResults;
        res.status(200).json({ user });
      });
    });
  });
};


module.exports = { register, login, logout, getAllUsers, getUserById, verifyOtpAndRegister };

