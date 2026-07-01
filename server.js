const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Menggunakan folder 'public' untuk file web (HTML, CSS, JS)
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('User terhubung:', socket.id);

    // User masuk ke room
    socket.on('join-room', (roomCode) => {
        socket.join(roomCode);
        console.log(`User ${socket.id} masuk ke room: ${roomCode}`);
    });

    // Menerima pesan suara dan meneruskannya HANYA ke room yang sama
    socket.on('audio-message', (data) => {
        socket.to(data.room).emit('audio-broadcast', data.audio);
    });

    socket.on('disconnect', () => {
        console.log('User terputus:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
});
