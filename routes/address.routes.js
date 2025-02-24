const express = require('express');
const { createAddress, getAddressesByUserId } = require('../controllers/address.controller');

const router = express.Router();
 
router.post('/address', createAddress);
router.get('/address/:user_id', getAddressesByUserId);

module.exports = router;