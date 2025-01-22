const express = require('express');
const router = express.Router();
const milletContactController = require('../controllers/milletcontact.controller');
 
router.post('/contactus', milletContactController.createContact);  
router.get('/contactus', milletContactController.getAllContacts);  
router.get('/contactus/:id', milletContactController.getContactById); 
router.delete('/contactus/:id', milletContactController.deleteContactById);  
router.delete('/contactus', milletContactController.deleteAllContacts); 

module.exports = router;
