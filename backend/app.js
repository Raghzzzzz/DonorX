const express = require('express');
const cors = require('cors');
const winston = require('winston');

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

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    if (req.path.startsWith('/api/requests')) {
        logger.info(`${req.method} ${req.path}`, {
            body: req.body,
            headers: { authorization: req.headers.authorization ? 'Bearer ***' : 'none' },
        });
    }
    next();
});

app.get('/', (req, res) => {
    res.send('DonorX Backend API is running...');
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

const requestRoutes = require('./routes/requestRoutes');
app.use('/api/requests', requestRoutes);

const assistRoutes = require('./routes/assistRoutes');
app.use('/api/assist', assistRoutes);

const statsRoutes = require('./routes/statsRoutes');
app.use('/api/stats', statsRoutes);

const auditRoutes = require('./routes/auditRoutes');
app.use('/api/audit', auditRoutes);

const resourceRoutes = require('./routes/resourceRoutes');
app.use('/api/resources', resourceRoutes);

const hospitalRoutes = require('./routes/hospitalRoutes');
app.use('/api/hospitals', hospitalRoutes);

app.use((err, req, res, next) => {
    if (res.headersSent) {
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
        body: req.body,
    });

    try {
        res.status(err.status || 500).json({
            message: err.message || 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        });
    } catch (responseError) {
        logger.error('Failed to send error response:', responseError);
    }
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
