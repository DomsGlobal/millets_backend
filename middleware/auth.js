const { pool } = require('../db');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided.' });
  }

  const token = authHeader.split(' ')[1];
 
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Database connection error:', err.stack);
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }

    const query = 'SELECT id FROM user WHERE token = ?';
    connection.query(query, [token], (err, results) => {
      connection.release();

      if (err) {
        console.error('Error verifying token:', err);
        return res.status(500).json({ success: false, message: 'Error verifying token.', error: err });
      }

      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token.' });
      }

      req.user = { id: results[0].id };  
      next();
    });
  });
};

module.exports = authenticateUser;
