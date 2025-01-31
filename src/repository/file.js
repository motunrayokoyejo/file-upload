const sqlDB = require('../config/sql');
const { DB: mongoDB } = require('../config/mongo');


class FileRepository {
    constructor(dbType) {
        if (dbType === 'sql') {
            this.dbType = 'sql';
        } else {
            this.dbType = 'mongo';
        }
    }
    async createFile(fileData) {
        try {
            if (this.dbType === 'sql') {
                await sqlDB('files').insert(fileData);
            } else {
                await mongoDB.File.create(fileData);
            }
        } catch (error) {
            throw new Error(error);
        }
    }
    async findAllFilesForUser(userId) {
        try {
            if (this.dbType === 'sql') {
                const files = await sqlDB('files').where({ user_id: userId }).orderBy('created_at', 'desc');
                return files;
            } else {
                const files = await mongoDB.File.find({ user_id: userId }).sort({ created_at: -1 });
                return files;
            }
        } catch (error) {
            throw new Error(error);
        }
    }
    async findFileForUser(userId, fileId) {
        try {
            if (this.dbType === 'sql') {
                const file = await sqlDB('files').where({ user_id: userId, id: fileId }).first();
                return file;
            } else {
                const file = await mongoDB.File.findOne({ user_id: userId, id: fileId });
                return file;
            }
        } catch (error) {
            throw new Error(error);
        }
    }
    
    async deleteFile(fileId, userId) {
        try {
            if (this.dbType === 'sql') {
                await sqlDB('files').where({ id: fileId, user_id: userId }).delete();
            } else {
                await mongoDB.File.deleteOne({ _id: fileId, user_id: userId });
            }
        } catch (error) {
            throw new Error(error);
        }
    }
}
module.exports = FileRepository;