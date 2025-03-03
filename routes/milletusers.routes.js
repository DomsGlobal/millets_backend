const express = require('express');
const { register, login, logout, getAllUsers, getUserById, verifyOtpAndRegister } = require('../controllers/milletuser.controller');

const router = express.Router();
 
router.post('/register', register); 
router.post('/verify', verifyOtpAndRegister); 
router.post('/login', login);
router.post('/logout/:userId', logout);
router.get('/all', getAllUsers); 
router.get('/profile', getUserById);

module.exports = router;
