const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Tambahkan opsi maxHttpBufferSize agar data audio tidak terpotong
const io = new Server(server, {
    maxHttpBufferSize: 1e6, // 1MB, cukup untuk data audio stream
    transports: ['websocket']
});

app.use(express.static('public'));

const rooms = {}; 

io.on('connection', (socket) => {
    
    const leaveCurrentRoom = () => {
        if (socket.room && rooms[socket.room]) {
            rooms[socket.room] = rooms[socket.room].filter(u => u.id !== socket.id);
            io.to(socket.room).emit('update-user-list', rooms[socket.room]);
            io.to(socket.room).emit('user-count', rooms[socket.room].length);
            socket.leave(socket.room);
        }
    };

    socket.on('join-room', ({ room, name }) => {
        leaveCurrentRoom();
        socket.join(room);
        socket.room = room;
        socket.name = name;

        if (!rooms[room]) rooms[room] = [];
        rooms[room].push({ id: socket.id, name: name });

        io.to(room).emit('update-user-list', rooms[room]);
        io.to(room).emit('user-count', rooms[room].length);
        console.log(`User ${name} masuk ke room ${room}`);
    });

    socket.on('audio-message', (data) => {
        // Broadcast ke orang lain di room yang sama
        socket.to(data.room).emit('audio-broadcast', data.audio);
    });

    socket.on('leave-room', () => {
        leaveCurrentRoom();
        socket.room = null;
    });

    socket.on('disconnect', () => {
        leaveCurrentRoom();
        console.log(`User terputus`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server aktif di port ${PORT}`);
});
