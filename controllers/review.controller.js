const { Review } = require('../models/review.model');
const upload = require('../middleware/multer');  
 
const createReview = (req, res) => { 
    const { Name, email, message, stars } = req.body; 
    const image = req.file ? req.file.path : null; 
   
    if (!Name || !image || !message || !stars) {
      return res.status(400).json({ message: 'Name, image, message, and stars are required' });
    }
   
    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Stars must be between 1 and 5' });
    }
   
    const reviewData = {
      name: Name,  
      email,  
      image,  
      message,
      stars,
      status: 1  
    };
   
    Review.create(reviewData, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error adding review', error: err });
      }
  
      res.status(201).json({
        message: 'Review created successfully',
        reviewId: result.insertId
      });
    });
  };
     
  const getAllReviews = (req, res) => { 
    const status = req.query.status;
   
    if (status) {
      Review.getAllByStatus(status, (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching reviews', error: err });
        }
        res.status(200).json({ reviews: results });
      });
    } else { 
      Review.getAllWithoutStatus((err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching reviews', error: err });
        }
        res.status(200).json({ reviews: results });
      });
    }
  };
  
  
  const getActiveReviews = (req, res) => {
    Review.getAll((err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching active reviews', error: err });
      }
      res.status(200).json({ reviews: results });
    });
  };

const updateReviewStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
   
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Status must be either 0 (inactive) or 1 (active)' });
    }
   
    Review.updateStatus(id, status, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating review status', error: err });
      }
   
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Review not found' });
      }
   
      res.status(200).json({ message: 'Review status updated successfully' });
    });
  };
  
// Delete all reviews
const deleteAllReviews = (req, res) => {
  Review.deleteAll((err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting reviews', error: err });
    }

    res.status(200).json({ message: 'All reviews deleted successfully' });
  });
};

// Delete a review by ID
const deleteReviewById = (req, res) => {
  const { id } = req.params;

  Review.deleteById(id, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting review', error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  });
};

module.exports = { createReview, getAllReviews, updateReviewStatus, deleteAllReviews, deleteReviewById,  getActiveReviews };
