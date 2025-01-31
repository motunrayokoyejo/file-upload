require('dotenv').config();

const mongoose = require('mongoose');

const connectToDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MongoDB connection URI is missing. Check your .env file.");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
    } catch (error) {
        process.exit(1);
    }
};
const userSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    reset_token: String,
    reset_token_expiry: Date,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
});
const fileSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    filename: {
        type: String,
        required: true,
    },
    original_name: {
        type: String,
        required: true,
    },
    mime_type: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'processing',
        enum: ['processing', 'completed', 'failed'],
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
});
const User = mongoose.model('User', userSchema);
const File = mongoose.model('File', fileSchema);

module.exports = { connectToDB, DB: { User, File } };