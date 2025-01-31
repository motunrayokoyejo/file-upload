const sqlDB = require('../config/sql');
const { DB: mongoDB } = require('../config/mongo');

class UserRepository {
    constructor(dbType) {
        if (dbType === 'sql') {
            this.dbType = 'sql';
        } else {
            this.dbType = 'mongo';
        }
    }
    async findUser(email) {
        try {
            if (this.dbType === 'sql') {
                const existingUser = await sqlDB('users').where({ email }).first();
                return existingUser;
            } else {
                const existingUser = await mongoDB.User.findOne({ email });
                return existingUser;
            }
        } catch (error) {
            throw new Error(error);
        }
    }
    async findOne(filter) {
        try {
            if (this.dbType === 'sql') {
                let query = sqlDB('users');
    
                for (const key in filter) {
                    if (typeof filter[key] === 'object' && filter[key] !== null) {
                        // Handle special MongoDB operators manually
                        if ('$gt' in filter[key]) {
                            query = query.where(key, '>', filter[key]['$gt']);
                        } else if ('$lt' in filter[key]) {
                            query = query.where(key, '<', filter[key]['$lt']);
                        } else if ('$eq' in filter[key]) {
                            query = query.where(key, '=', filter[key]['$eq']);
                        } else {
                            throw new Error(`Unsupported operator in filter: ${key}`);
                        }
                    } else {
                        query = query.where(key, filter[key]);
                    }
                }
    
                const user = await query.first();
                return user;
            } else {
                const user = await mongoDB.User.findOne(filter);
                return user;
            }
        } catch (error) {
            throw new Error(error);
        }
    }
    async createUser(userData) {
        try {
            if (this.dbType === 'sql') {
                const [userId] = await sqlDB('users').insert({
                    email: userData.email,
                    password: userData.password,
                    name: userData.name,
                    created_at: sqlDB.fn.now()
                });
                return userId;
            } else {
                const newUser = await mongoDB.User.create(userData);
                return newUser.id;
            }
        } catch (error) {
            throw new Error(error);
        }
    }
    async updateUser(filter, updateData) {
        try {
            if (this.dbType === 'sql') {
                updateData.updated_at = sqlDB.fn.now();
                await sqlDB('users').where(filter).update(updateData);
            } else {
                await mongoDB.User.findOneAndUpdate(filter, { $set: updateData });
            }
        } catch (error) {
            throw new Error(error);
        }
    }
}
module.exports = UserRepository;