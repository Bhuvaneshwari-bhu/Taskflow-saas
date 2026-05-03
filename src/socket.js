const { Server } = require('socket.io');

let io = null;

const init = (httpServer) => {
    io = new Server(httpServer, {
        cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
        console.log(`[socket] connected: ${socket.id}`);

        socket.on('join-project', (projectId) => {
            socket.join(projectId);
            console.log(`[socket] ${socket.id} joined project ${projectId}`);
        });

        socket.on('join-user', (userId) => {
            socket.join(userId);
            console.log(`[socket] ${socket.id} joined user room ${userId}`);
        });

        socket.on('join-org', (orgId) => {
            socket.join(`org:${orgId}`);
            console.log(`[socket] ${socket.id} joined org room ${orgId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[socket] disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
};

module.exports = { init, getIO };
