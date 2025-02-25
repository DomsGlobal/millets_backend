const express = require('express');
const { createAddress, getAddressesByUserId, getAddressByUserIdAndAddressId } = require('../controllers/address.controller');

const router = express.Router();
 
router.post('/address', createAddress);
router.get('/address/userId/:user_id', getAddressesByUserId);
router.get('/address/userId/:userId/addressId/:addressId', getAddressByUserIdAndAddressId);

module.exports = router;