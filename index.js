const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const { connectDB } = require('./db');
const app = express();
const port = 5000;
 
// app.use(cors({
//   origin: (origin, callback) => {
//     const allowedOrigins = ['http://localhost:4173', 'https://milletioglobalgrain.in/'];
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(cors({ origin: false }));

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
const milletaddressRoutes = require('./routes/address.routes');
const milletcartRoutes = require('./routes/cart.routes');
const adminRoutes = require('./routes/admin.routes');
const reviewsRoutes = require('./routes/review.routes');
 
app.use('/api', orderRoutes);

app.use('/api/users', milletuserRoutes);
app.use('/api', milletProductsRoutes);
app.use('/api', milletordersRoutes);
app.use('/api', milletcontactRoutes);
app.use('/api', milletaddressRoutes);
app.use('/api', milletcartRoutes);
app.use('/api', adminRoutes);
app.use('/api', reviewsRoutes);
 
app.use('/uploads', express.static('uploads'));

const { createUserTable } = require('./models/milletusers.model');
const { createMilletProductsTable } = require('./models/milletproducts.model');
const { createMilletOrdersTable } = require('./models/milletorders.model');
const { createMilletContactTable } = require('./models/milletcontact.model');
const { createAddressTable } = require('./models/address.model');
const { createCartTable } = require('./models/cart.model');
const { createOtpTable } = require('./models/otp.model');
const { createAdminsTable } = require('./models/admin.model');
const { createReviewsTable } = require('./models/review.model');
 
connectDB()
  .then(() => {
    return Promise.all([ createUserTable(), createMilletProductsTable(), createMilletOrdersTable(), createMilletContactTable(), createAddressTable, createCartTable(), createOtpTable(), createAdminsTable(), createReviewsTable()]);
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to database:', err);
  });
