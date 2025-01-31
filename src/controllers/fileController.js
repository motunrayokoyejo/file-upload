const fs = require('fs');
const FileService = require('../services/fileService');
const path = require('path');
const { Readable, pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

class FileController {
  constructor(dbType) {
    this.fileService = new FileService(dbType);
    this.uploadFile = this.uploadFile.bind(this);
    this.streamUpload = this.streamUpload.bind(this);
    this.listFiles = this.listFiles.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
  }

  async uploadFile(req, res) {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    try {
      if (!this.fileService.validateFileType(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type' });
      }

      await this.fileService.saveFileMetadata(req.user.userId, {
        path: req.file.path,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      res.status(201).json({
        message: 'File uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
  }

  async streamUpload(req, res) {
    let fileSize = 0;

    try {
      const contentLength = parseInt(req.headers['content-length']);
      
      if (contentLength > 100 * 1024 * 1024) {
        return res.status(413).json({ message: 'File too large' });
      }
      let originalName = req.headers['x-file-name'];

      if (!originalName) {
          originalName = `upload-${Date.now()}.bin`;
      }

      const tempPath = path.join(this.fileService.uploadDir, `temp-${Date.now()}${path.extname(originalName)}`);
      const writeStream = fs.createWriteStream(tempPath);

      req.on('data', (chunk) => {
        fileSize += chunk.length;
      });

      await streamPipeline(req, writeStream);

      await this.fileService.saveFileMetadata(req.user.userId, {
        path: tempPath,
        originalname: originalName,
        mimetype: req.headers['content-type'] || 'application/octet-stream',
        size: fileSize
      });

      res.json({ message: 'File uploaded successfully' });
    } catch (error) {
      console.error('Stream upload error:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
  }

  async listFiles(req, res) {
    try {
      const files = await this.fileService.getUserFiles(req.user.userId);
      res.json(files);
    } catch (error) {
      console.error('List files error:', error);
      res.status(500).json({ message: 'Error listing files' });
    }
  }

  async downloadFile(req, res) {
    try {
      const file = await this.fileService.getFile(req.params.fileId, req.user.userId);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      const fileStream = fs.createReadStream(file.path);
     
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Length', file.size);

      fileStream.on('error', (err) => {
        console.error('File streaming error:', err);
        res.status(500).json({ message: 'Error reading file' });
    });

      fileStream.pipe(res);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Error downloading file' });
    }
  }

  async deleteFile(req, res) {
    try {
      await this.fileService.deleteFile(req.params.fileId, req.user.userId);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      if (error.message === 'File not found') {
        return res.status(404).json({ message: 'File not found' });
      }
      res.status(500).json({ message: 'Error deleting file' });
    }
  }
}

module.exports = FileController;