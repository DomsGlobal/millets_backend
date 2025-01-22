const express = require('express');
const multer = require('multer');
const path = require('path');  
const { createProduct, getAllProducts, getProductById, deleteAllProducts, deleteProductById, updateProductById } = require('../controllers/milletproduct.controller'); 
 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});
 
const upload = multer({ storage: storage });

const router = express.Router();
 
router.post('/products', upload.single('image'), createProduct); 
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.delete('/products', deleteAllProducts);
router.delete('/products/:id', deleteProductById);
router.put('/products/:id', upload.single('image'), updateProductById);


module.exports = router;
