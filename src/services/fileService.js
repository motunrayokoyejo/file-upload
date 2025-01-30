const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const crypto = require('crypto');
const knex = require('../config/database');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const { mkdir } = require('fs/promises');

class FileService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDirectory();
  }

  generateFileName(originalName) {
    const ext = path.extname(originalName);
    return `${uuidv4()}${ext}`;
  }

  async ensureUploadDirectory() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  generateFileName(originalName) {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    return `${hash}${ext}`;
  }

  validateFileType(mimetype) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];
    return allowedTypes.includes(mimetype);
  }

  async saveFileMetadata(userId, fileData) {
    try {
        const fileName = this.generateFileName(fileData.originalname);
        const newPath = path.join(this.uploadDir, fileName);

        await fs.promises.rename(fileData.path, newPath);
  
        return await knex('files').insert({
          user_id: userId,
          filename: fileName,
          original_name: fileData.originalname,
          mime_type: fileData.mimetype,
          size: fileData.size,
          path: newPath,
          status: 'completed'
        });
      } catch (error) {
        if (fileData.path && fs.existsSync(fileData.path)) {
          await fs.promises.unlink(fileData.path);
        }
        throw error;
      }
  }

  async getUserFiles(userId) {
    return await knex('files')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
  }

  async getFile(fileId, userId) {
    return await knex('files')
      .where({
        id: fileId,
        user_id: userId
      })
      .first();
  }

  async deleteFile(fileId, userId) {
    const file = await this.getFile(fileId, userId);
    
    if (!file) {
      throw new Error('File not found');
    }

    await fs.promises.unlink(file.path);
    await knex('files')
      .where({
        id: fileId,
        user_id: userId
      })
      .delete();

    return true;
  }
}

module.exports = new FileService();