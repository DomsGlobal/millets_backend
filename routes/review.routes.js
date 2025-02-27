const express = require('express');
const { createReview, getAllReviews, updateReviewStatus, deleteAllReviews, deleteReviewById,  getActiveReviews } = require('../controllers/review.controller');
const router = express.Router();
const upload = require('../middleware/multer');   

 
router.post('/reviews', upload.single('image'), createReview);
router.get('/reviews', getAllReviews); 
router.get('/active/reviews',  getActiveReviews); 
router.put('/reviews/status/:id', updateReviewStatus); 
router.delete('/reviews', deleteAllReviews); 
router.delete('/reviews/:id', deleteReviewById);

module.exports = router;
