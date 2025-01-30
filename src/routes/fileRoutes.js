const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const fileController = require('../controllers/fileController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post('/upload', authenticateToken, upload.single('file'), fileController.uploadFile);

router.post('/upload/stream', authenticateToken, fileController.streamUpload);

router.get('/files', authenticateToken, fileController.listFiles);
router.get('/files/:fileId', authenticateToken, fileController.downloadFile);
router.delete('/files/:fileId', authenticateToken, fileController.deleteFile);

module.exports = router;