const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const SECRET_KEY = 'your_secret_key';  

const registerAdmin = (req, res) => {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    pool.getConnection((err, connection) => {
      if (err) return res.status(500).json({ message: 'Failed to connect to database. Please try again later.' });
   
      const checkEmailAdminQuery = 'SELECT * FROM admins WHERE email = ?';
      connection.query(checkEmailAdminQuery, [email], (err, adminResults) => {
        if (err) {
          connection.release();
          return res.status(500).json({ message: 'Error checking existing admin. Please try again.' });
        }
   
        if (adminResults.length > 0) {
          connection.release();
          return res.status(409).json({ message: 'Email already in use in admin table. Please choose a different email.' });
        }
   
        const checkEmailUserQuery = 'SELECT * FROM user WHERE email = ?';
        connection.query(checkEmailUserQuery, [email], (err, userResults) => {
          if (err) {
            connection.release();
            return res.status(500).json({ message: 'Error checking existing user. Please try again.' });
          }
   
          if (userResults.length > 0) {
            connection.release();
            return res.status(409).json({ message: 'Email already in use in user table. Please choose a different email.' });
          }
   
          const checkPhoneQuery = 'SELECT * FROM admins WHERE phone = ?';
          connection.query(checkPhoneQuery, [phone], (err, phoneResults) => {
            if (err) {
              connection.release();
              return res.status(500).json({ message: 'Error checking phone number. Please try again.' });
            }
  
            if (phoneResults.length > 0) {
              connection.release();
              return res.status(409).json({ message: 'Phone number already in use in admins table. Please choose a different one.' });
            }
   
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
   
              bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                  connection.release();
                  return res.status(500).json({ message: 'Error securing your password. Please try again.' });
                }
  
                const token = jwt.sign({ email, phone }, SECRET_KEY, { expiresIn: '1h' });
   
                const insertAdminQuery = 'INSERT INTO admins (name, email, phone, password, token) VALUES (?, ?, ?, ?, ?)';
                connection.query(insertAdminQuery, [name, email, phone, hash, token], (err, result) => {
                  connection.release();
                  if (err) {
                    console.error('Error creating admin:', err);
                    return res.status(500).json({ message: 'Error creating admin. Please try again.' });
                  }
  
                  res.status(201).json({
                    message: 'Registration successful!',
                    adminId: result.insertId,
                    token: token,
                  });
                });
              });
            });
          });
        });
      });
    });
  };


  const logoutAdmin = (req, res) => {
    const { admin_id } = req.params; // Get admin_id from URL parameter

    if (!admin_id) {
        return res.status(400).json({ message: 'Admin ID is required' });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection error', error: err });
        }

        const updateTokenQuery = 'UPDATE admins SET token = NULL WHERE id = ?';
        connection.query(updateTokenQuery, [admin_id], (err, result) => {
            connection.release();
            if (err) {
                return res.status(500).json({ message: 'Error logging out admin', error: err });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Admin not found' });
            }

            res.status(200).json({ message: 'Logout successful' });
        });
    });
}; 
   
module.exports = { registerAdmin, logoutAdmin};
