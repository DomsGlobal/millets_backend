const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  connectionLimit: 10
});

const connectDB = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Connected to MySQL server as ID ' + connection.threadId);
      createDatabase(connection).then(() => {
        connection.release(); 
        resolve();
      }).catch((err) => {
        connection.release(); 
        reject(err);
      });
    });
  });
};

const createDatabase = (connection) => {
  return new Promise((resolve, reject) => {
    connection.query('CREATE DATABASE IF NOT EXISTS millets_backend', (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Database created or already exists.');
      connection.changeUser({ database: 'millets_backend' }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
};

module.exports = { pool, connectDB };
