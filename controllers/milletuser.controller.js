const { pool } = require('../db');  

const createUser = (req, res) => {
  const { phone_number, email, address, floor, tag } = req.body;

  if (!phone_number || !email || !address) {
    return res.status(400).json({ message: 'Phone number, email, and address are required.' });
  }
 
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection: ' + err.stack);
      return res.status(500).json({ message: 'Database connection error', error: err });
    }
 
    const checkQuery = 'SELECT id FROM milletusers WHERE phone_number = ?';
    connection.query(checkQuery, [phone_number], (err, results) => {
      if (err) {
        connection.release();
        console.error('Error checking phone number: ' + err.stack);
        return res.status(500).json({ message: 'Error checking phone number', error: err });
      }

      if (results.length > 0) { 
        connection.release();
        return res.status(200).json({
          success: true,
          message: 'Already exists with phone number.',
          userId: results[0].id, 
        });
      }
 
      const newUser = { phone_number, email, address, floor, tag };

      const insertQuery = 'INSERT INTO milletusers (phone_number, email, address, floor, tag) VALUES (?, ?, ?, ?, ?)';
      connection.query(insertQuery, [
        newUser.phone_number,
        newUser.email,
        newUser.address,
        newUser.floor || null,
        newUser.tag || null,
      ], (err, result) => {
        connection.release();

        if (err) {
          return res.status(500).json({ message: 'Error creating user.', error: err });
        }
         
        res.status(201).json({
          message: 'User created successfully.',
          userId: result.insertId,
        });
      });
    });
  });
};

module.exports = { createUser };
