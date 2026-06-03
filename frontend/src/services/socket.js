import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, { autoConnect: true });
    }
    return socket;
};

export const joinHospitalRoom = (hospitalId) => {
    const s = getSocket();
    s.emit('join_hospital', String(hospitalId));
    return s;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
