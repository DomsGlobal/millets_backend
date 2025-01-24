const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const { connectDB } = require('./db');
const app = express();
const port = 5000;
 
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'http://98.130.40.135'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
})); 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage: storage });
 
app.use(bodyParser.json());
 
 
const orderRoutes = require('./routes/orderemail.routes');

const milletuserRoutes = require('./routes/milletusers.routes');
const milletProductsRoutes = require('./routes/milletproducts.routes');
const milletordersRoutes = require('./routes/milletorders.routes');
const milletcontactRoutes = require('./routes/milletcontact.routes');
 
app.use('/api', orderRoutes);

app.use('/api', milletuserRoutes);
app.use('/api', milletProductsRoutes);
app.use('/api', milletordersRoutes);
app.use('/api', milletcontactRoutes);
 
app.use('/uploads', express.static('uploads'));

const { createMilletUsersTable } = require('./models/milletusers.model');
const { createMilletProductsTable } = require('./models/milletproducts.model');
const { createMilletOrdersTable } = require('./models/milletorders.model');
const { createMilletContactTable } = require('./models/milletcontact.model');
 
connectDB()
  .then(() => {
    return Promise.all([ createMilletUsersTable(), createMilletProductsTable(), createMilletOrdersTable(), createMilletContactTable()]);
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to database:', err);
  });
