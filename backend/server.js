const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Logger Setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware (for debugging)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/requests')) {
        logger.info(`${req.method} ${req.path}`, {
            body: req.body,
            headers: { authorization: req.headers.authorization ? 'Bearer ***' : 'none' }
        });
    }
    next();
});

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/donorx');
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Routes Placeholders
app.get('/', (req, res) => {
    res.send('DonorX Backend API is running...');
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

const requestRoutes = require('./routes/requestRoutes');
app.use('/api/requests', requestRoutes);

const assistRoutes = require('./routes/assistRoutes');
app.use('/api/assist', assistRoutes);

// Global Error Handler Middleware (must be after all routes)
// Must have 4 parameters (err, req, res, next) for Express to recognize it as error handler
app.use((err, req, res, next) => {
    // Check if response was already sent
    if (res.headersSent) {
        // If headers were sent, delegate to Express default error handler
        if (typeof next === 'function') {
            return next(err);
        }
        return;
    }

    logger.error('Unhandled error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body
    });
    
    try {
        res.status(err.status || 500).json({
            message: err.message || 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    } catch (responseError) {
        // If we can't send response, log it
        logger.error('Failed to send error response:', responseError);
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;

// Start Scheduler
const startScheduler = require('./cron/scheduler');

connectDB().then(() => {
    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        startScheduler();
    });
});
