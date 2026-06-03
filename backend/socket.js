const { Server } = require('socket.io');

let io = null;

const initIO = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        socket.on('join_hospital', (hospitalId) => {
            if (hospitalId) {
                socket.join(String(hospitalId));
            }
        });

        socket.on('consultation_request', ({ fromHospitalId, toHospitalId, message }) => {
            if (toHospitalId) {
                io.to(String(toHospitalId)).emit('consultation_incoming', {
                    fromHospitalId,
                    message,
                    timestamp: new Date(),
                });
            }
        });
    });

    return io;
};

const getIO = () => io;

module.exports = { initIO, getIO };
