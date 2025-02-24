const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { User } = require('../models/milletusers.model');

const SECRET_KEY = 'your_secret_key'; // Change this to a secure key

// Register User
const register = (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Failed to connect to database. Please try again later.' });

    // Check if email already exists
    const checkQuery = 'SELECT * FROM user WHERE email = ?';
    connection.query(checkQuery, [email], (err, results) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Error checking existing user. Please try again.' });
      }

      if (results.length > 0) {
        connection.release();
        return res.status(409).json({ message: 'Email already in use. Please choose a different email.' });
      }

      // Hash the password
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({ message: 'Error securing your password. Please try again.' });
        }
        
        console.log('Hashed Password:', hash); // Log hashed password
      
        // Generate token before using it
        const token = jwt.sign({ email, phone }, SECRET_KEY, { expiresIn: '1h' });
      
        const newUser = { name, email, phone, password: hash, token }; // Now token is defined
      
        User.create(newUser, (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Error creating user. Please try again.' });
          }
      
          res.status(201).json({
            message: 'Registration successful!',
            userId: result.insertId,
            token,
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

        // ✅ Define the token here before using it
        const token = jwt.sign(
          { email: user.email, phone: user.phone, role: 'customer' },
          SECRET_KEY,
          { expiresIn: '1h' }
        );

        // Ensure token is not undefined
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
              token, // ✅ Return the token in response
            });
          });
        });
      });
    });
  });
};

module.exports = { register, login };
