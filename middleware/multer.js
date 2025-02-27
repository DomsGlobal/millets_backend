const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); 
  }
});

const upload = multer({
  storage: storage, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {  
      cb(null, true);
    } else {
      cb(new Error('File must be an image'), false);  
    }
  }
});

module.exports = upload;
