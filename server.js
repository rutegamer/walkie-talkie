const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {}; 

io.on('connection', (socket) => {
    socket.on('join-room', ({ room, name }) => {
        socket.join(room);
        socket.room = room;
        socket.name = name;

        if (!rooms[room]) rooms[room] = [];
        rooms[room].push({ id: socket.id, name: name });

        // PENTING: Kirim daftar nama DAN jumlah user
        io.to(room).emit('update-user-list', rooms[room]);
        io.to(room).emit('user-count', rooms[room].length);
        
        console.log(`User ${name} masuk ke room ${room}`);
    });

    socket.on('audio-message', (data) => {
        // Meneruskan audio ke semua user di room tersebut
        socket.to(data.room).emit('audio-broadcast', data.audio);
    });

    socket.on('disconnect', () => {
        if (socket.room && rooms[socket.room]) {
            rooms[socket.room] = rooms[socket.room].filter(u => u.id !== socket.id);
            
            // PENTING: Update ulang daftar dan jumlah setelah user keluar
            io.to(socket.room).emit('update-user-list', rooms[socket.room]);
            io.to(socket.room).emit('user-count', rooms[socket.room].length);
            
            console.log(`User ${socket.name} keluar dari room ${socket.room}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server aktif di port ${PORT}`);
});
