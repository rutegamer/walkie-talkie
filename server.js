const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {}; // Objek untuk simpan { roomCode: [ {id, name} ] }

io.on('connection', (socket) => {
    socket.on('join-room', ({ room, name }) => {
        socket.join(room);
        socket.room = room;
        socket.name = name;

        if (!rooms[room]) rooms[room] = [];
        rooms[room].push({ id: socket.id, name: name });

        io.to(room).emit('update-user-list', rooms[room]);
    });

    socket.on('audio-message', (data) => {
        socket.to(data.room).emit('audio-broadcast', data.audio);
    });

    socket.on('disconnect', () => {
        if (socket.room && rooms[socket.room]) {
            rooms[socket.room] = rooms[socket.room].filter(u => u.id !== socket.id);
            io.to(socket.room).emit('update-user-list', rooms[socket.room]);
        }
    });
});

server.listen(process.env.PORT || 3000, '0.0.0.0');
