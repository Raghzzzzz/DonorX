const http = require('http');
const dns = require('dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const winston = require('winston');
const app = require('./app');
const { initIO } = require('./socket');

dotenv.config();

// Fix SRV DNS resolution issues on some Windows/network setups
dns.setDefaultResultOrder('ipv4first');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

const connectDB = async () => {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/donorx';
    const fallbackUri = process.env.MONGO_URI_FALLBACK;

    try {
        const conn = await mongoose.connect(uri);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.warn(`Primary MongoDB connection failed: ${error.message}`);
        if (fallbackUri) {
            try {
                logger.info('Retrying with fallback MongoDB connection string...');
                const conn = await mongoose.connect(fallbackUri);
                logger.info(`MongoDB Connected (fallback): ${conn.connection.host}`);
                return;
            } catch (fallbackError) {
                logger.error(`Fallback connection failed: ${fallbackError.message}`);
            }
        }
        logger.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const PORT = process.env.PORT || 5000;
const startScheduler = require('./cron/scheduler');

const server = http.createServer(app);
initIO(server);

if (require.main === module) {
    connectDB().then(() => {
        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            startScheduler();
        });
    });
}

module.exports = { app, server, connectDB };
