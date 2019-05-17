const express = require('express');
const app = express();

var usersOnline = 0;

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    let previousId;
    
    const safeJoin = currentId => {
        socket.leave(previousId);
        socket.join(currentId);
        previousId = currentId;
    }
    
    socket.on("getUsersOnline", () => {
        socket.emit('usersOnline', usersOnline);
    })
    
    console.log('a user connected');
    usersOnline += 1;
    socket.on('disconnect', () => {
        console.log('a user disconnected');
        usersOnline -= 1;
        console.log(`Number of users online: ${usersOnline}\n`);
        socket.emit('usersOnline', usersOnline);

    });
    console.log(`Number of users online: ${usersOnline}\n`);
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});