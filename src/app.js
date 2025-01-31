require('dotenv').config();

const express = require('express');
const createAuthRoutes = require('./routes/authRoutes');
const createFileRoutes = require('./routes/fileRoutes');
const { connectToDB } = require('./config/mongo');

const createApp = async (dbType) => {
    const app = express();

    if (dbType === 'sql') {
        const childProcess = require('child_process')
     
        childProcess.execSync('npm run migrate', (err, data) => {
            if (err) {
                throw err
            } else {
                console.log(data)
            }
        })
    } else {
        await connectToDB();
    }

    app.use(express.json());
    app.use('/api/auth', createAuthRoutes(dbType));
    app.use('/api', createFileRoutes(dbType));

    return app;
}
module.exports = createApp;