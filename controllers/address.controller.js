const { pool } = require('../db');
 
const createAddress = (req, res) => {
  const { user_id, phone_number, email, address, floor, tag, pin_code } = req.body;

  if (!user_id || !phone_number || !email || !address) {
    return res.status(400).json({ message: 'User ID, phone number, email, and address are required.' });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection:', err.stack);
      return res.status(500).json({ message: 'Database connection error', error: err });
    }

    const insertQuery = `
      INSERT INTO address (user_id, phone_number, email, address, floor, tag, pin_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      insertQuery,
      [user_id, phone_number, email, address, floor || null, tag || null, pin_code || null],
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
};
 
const getAddressesByUserId = (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection:', err.stack);
      return res.status(500).json({ message: 'Database connection error', error: err });
    }

    const selectQuery = `SELECT * FROM address WHERE user_id = ?`;

    connection.query(selectQuery, [user_id], (err, results) => {
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
};

const getAddressByUserIdAndAddressId = (req, res) => {
  const { userId, addressId } = req.params;

  if (!userId || !addressId) {
    return res.status(400).json({ message: 'User ID and Address ID are required.' });
  }

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
};

module.exports = { createAddress, getAddressesByUserId, getAddressByUserIdAndAddressId };
