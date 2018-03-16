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

io.on('connection', function(socket) {
    console.log('a user connected');
	socket.on('disconnect', function(){
    	console.log('user disconnected');
  	});
	socket.on('mop', mop => {
		console.log('mop', mop);
		socket.broadcast.emit('mop', mop);
	});
});

http.listen(port, () => console.log('listening on *:3000'));
