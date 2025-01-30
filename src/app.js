const express = require('express');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');


const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', fileRoutes);

module.exports = app;