const { pool } = require('../db');
const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key';  

const createAddress = (req, res) => {
  const { phone_number, email, address, floor, tag, pin_code } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
 
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err.stack);
        return res.status(500).json({ message: 'Database connection error', error: err });
      }

      const userQuery = `SELECT id FROM user WHERE token = ?`;
      connection.query(userQuery, [token], (err, results) => {
        if (err) {
          connection.release();
          console.error('Error fetching user:', err);
          return res.status(500).json({ message: 'Error verifying user.', error: err });
        }

        if (results.length === 0) {
          connection.release();
          return res.status(401).json({ message: 'Unauthorized: Invalid token or user not found' });
        }

        const userId = results[0].id;

        if (!phone_number || !email || !address) {
          connection.release();
          return res.status(400).json({ message: 'Phone number, email, and address are required.' });
        }

        const insertQuery = `
          INSERT INTO address (user_id, phone_number, email, address, floor, tag, pin_code)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        connection.query(
          insertQuery,
          [userId, phone_number, email, address, floor || null, tag || null, pin_code || null],
          (err, result) => {
            connection.release();

            if (err) {
              console.error('Error inserting address:', err);
              return res.status(500).json({ message: 'Error creating address entry.', error: err });
            }

            res.status(201).json({
              message: 'Address entry created successfully.',
              addressId: result.insertId,
            });
          }
        );
      });
    });
  });
};

const getAddressesByUserId = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    const userId = decoded.user_id;

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err.stack);
        return res.status(500).json({ message: 'Database connection error', error: err });
      }

      const selectQuery = `SELECT * FROM address WHERE user_id = ?`;

      connection.query(selectQuery, [userId], (err, results) => {
        connection.release();

        if (err) {
          console.error('Error fetching addresses:', err);
          return res.status(500).json({ message: 'Error retrieving addresses.', error: err });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: 'No addresses found for this user.' });
        }

        res.status(200).json({
          message: 'Addresses retrieved successfully.',
          addresses: results,
        });
      });
    });
  });
};

const getAddressByUserIdAndAddressId = (req, res) => {
  const { addressId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    const userId = decoded.user_id;

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err.stack);
        return res.status(500).json({ message: 'Database connection error', error: err });
      }

      const selectQuery = `SELECT * FROM address WHERE user_id = ? AND id = ?`;

      connection.query(selectQuery, [userId, addressId], (err, results) => {
        connection.release();

        if (err) {
          console.error('Error fetching address:', err);
          return res.status(500).json({ message: 'Error retrieving address.', error: err });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: 'No address found for this user with the given address ID.' });
        }

        res.status(200).json({
          message: 'Address retrieved successfully.',
          address: results[0],
        });
      });
    });
  });
};

module.exports = { createAddress, getAddressesByUserId, getAddressByUserIdAndAddressId };