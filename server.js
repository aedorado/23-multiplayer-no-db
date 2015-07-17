var express = require('express'),
    app = express(),
    http = require('http').createServer(app);
    io = require('socket.io').listen(http);

// var express = require('express');
// var app = express();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);
var INT_MAX = 1999999999;

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080// set the port
var ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
http.listen(port, ip_address);

var number = 0;

io.on('connection', function(socket) {


	function getClientsInRoomOfSocket(s) {
		return io.sockets.adapter.rooms[s.room];
	}
	
	socket.getNumberClientsInRoom = function() {
		var room = io.sockets.adapter.rooms[this.room];
		return (Object.keys(room).length);
	}

	socket.on('user connected', function(msg) {
		number++;
		if (number > INT_MAX) {
			number = 0;
			return ;
		}
		socket.username = msg;
		socket.room = (parseInt((number - 1) / 2)) + '';
		socket.begin = false;
		socket.join(socket.room);
		socket.player = socket.getNumberClientsInRoom();
		console.log(socket.username + " joined.\tRoom : " + socket.room + "\tPlayer : " + socket.player + "\t" + socket.begin);
	});

	socket.on('begin', function() {	//when begin button is clicked
		socket.begin = true;
		if (socket.getNumberClientsInRoom() == 2) {
			
			var clients = getClientsInRoomOfSocket(socket);
			for (var clientId in clients) {
				var clientSocket = io.sockets.connected[clientId];
			    if (!clientSocket.begin) {
			    	return ;
			    }
			}

			for (var clientId in clients) {
			    var clientSocket = io.sockets.connected[clientId];
			    clientSocket.emit('begin', clientSocket.player);
			}
		}
	});

	socket.on('move made', function(msg) {
		var clients = getClientsInRoomOfSocket(socket);
		for (var clientId in clients) {
		    var clientSocket = io.sockets.connected[clientId];
		    if (clientSocket.player != msg.playerNum) {
				clientSocket.emit('give turn', msg.move);
			    if (msg.total == 23) {
			    	clientSocket.emit('winner', msg.playerNum);
			    }
		    }
		}

		if (msg.total == 23) {
			for (clientId in clients) {
				var clientSocket = io.sockets.connected[clientId];
			    clientSocket.begin = false;
			}
		}

	});

	socket.on('disconnect', function() {
		socket.broadcast.to(socket.room).emit('opp disconnected');
		console.log(socket.username + " disconnected.");
	});
});
