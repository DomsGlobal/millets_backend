const express = require('express');
const { createUser } = require('../controllers/milletuser.controller');

const router = express.Router();
 
router.post('/users', createUser);

module.exports = router;