const express = require('express');
const { sendAppointmentNotificationEmail } = require('../controllers/orderemail.controller');
const router = express.Router();
 
router.post('/send-order-confirmation', sendAppointmentNotificationEmail);

module.exports = router;
