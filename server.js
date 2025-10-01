const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Раздаем статические файлы
app.use(express.static('public'));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io логика
const users = {};
const messages = {};

io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    socket.on('register', (userData) => {
        users[userData.username] = {
            socketId: socket.id,
            ...userData
        };
        console.log(`👤 User ${userData.username} registered`);
    });

    socket.on('send-message', (data) => {
        const { from, to, text } = data;
        
        console.log(`📨 Message from ${from} to ${to}: ${text}`);
        
        if (!messages[from]) messages[from] = [];
        if (!messages[to]) messages[to] = [];
        
        const message = {
            from, to, text,
            timestamp: Date.now(),
            id: Date.now().toString()
        };
        
        messages[from].push(message);
        messages[to].push(message);
        
        const targetUser = users[to];
        if (targetUser) {
            io.to(targetUser.socketId).emit('new-message', message);
            console.log(`✅ Message delivered to ${to}`);
        }
        
        socket.emit('new-message', message);
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
        for (const [username, user] of Object.entries(users)) {
            if (user.socketId === socket.id) {
                delete users[username];
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 NotMax Server running on port ${PORT}`);
});
