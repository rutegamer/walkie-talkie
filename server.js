const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('User terhubung:', socket.id);

    // 1. User masuk ke room
    socket.on('join-room', (roomCode) => {
        socket.join(roomCode);
        socket.room = roomCode; // Simpan info room di socket user
        
        // Hitung dan kirim jumlah user ke semua orang di room tsb
        const count = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
        io.to(roomCode).emit('user-count', count);
        
        console.log(`User ${socket.id} masuk ke room: ${roomCode}. Total: ${count}`);
    });

    // 2. Menerima pesan suara
    socket.on('audio-message', (data) => {
        // Kirim ke semua orang di room, KECUALI pengirim (opsional)
        socket.to(data.room).emit('audio-broadcast', data.audio);
    });

    // 3. Handle saat user keluar/putus koneksi
    socket.on('disconnect', () => {
        if (socket.room) {
            const count = io.sockets.adapter.rooms.get(socket.room)?.size || 0;
            io.to(socket.room).emit('user-count', count);
            console.log(`User ${socket.id} keluar dari ${socket.room}. Sisa: ${count}`);
        }
        console.log('User terputus:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
});
