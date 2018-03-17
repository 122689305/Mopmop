const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/game.html', function(req, res) {
    res.sendFile(__dirname + '/public/game.html');
});

var random_seed = (new Date).getTime();
var players = new Set();

io.on('connection', function(socket) {
    console.log('a user connected');
	socket.on('disconnect', function(){
        players.clear();
    	console.log('user disconnected');
  	});
    socket.on('sync', data => {
        socket.broadcast.emit('sync', data);
    });
    var start_game_ack = id => {
        if (!(players.has(id))) {
            players.add(id);
        };
        console.log(players);
        if (players.size == 2) {
            players.clear();
            console.log('game start');
            io.emit('start_game_ack', random_seed);
        }
    };
    socket.on('start_game', start_game_ack);
});

http.listen(port, () => console.log('listening on *:3000'));
