const express = require('express');
const router = express.Router();
 
const { registerAdmin, logoutAdmin  } = require('../controllers/admin.controller');
 
router.post('/admin/register', registerAdmin);  
router.post('/admin/logout/:admin_id', logoutAdmin);  

module.exports = router;
