var express = require('express'),
    app = express(),
    http = require('http').createServer(app);
    io = require('socket.io').listen(http);


app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080// set the port
var ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
http.listen(port, ip_address);

var number = 0;
var INT_MAX = 1999999999;

function randomBW(l, u) {	//generate random numbers from l to (u - 1)
	return parseInt(Math.random() * (u - l) + l);
}

io.on('connection', function(socket) {

	function getClientsInRoomOfSocket(s) {
		return io.sockets.adapter.rooms[s.room];
	}
	
	socket.getNumberClientsInRoom = function() {
		var room = io.sockets.adapter.rooms[this.room];
		return (Object.keys(room).length);
	}

	socket.getOtherSocketInRoomWithTwoSockets = function() {
		var clients = getClientsInRoomOfSocket(socket);
		for (var clientId in clients) {
			var clientSocket = io.sockets.connected[clientId];
		    if (clientSocket != socket) {
		    	return clientSocket;
		    }
		}
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
		if (socket.player == 1) {
			socket.randomNum = [randomBW(20, 46), 1, randomBW(2, 5), 5, randomBW(6, 8)];
		}
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
			    if (clientSocket.player == 2) {
			    	clientSocket.randomNum = (clientSocket.getOtherSocketInRoomWithTwoSockets()).randomNum;
			    	console.log(clientSocket.randomNum);
			    }
			    clientSocket.emit('begin', clientSocket.player, clientSocket.randomNum);
			}
		}
	});

	socket.on('move made', function(msg) {
		var clients = getClientsInRoomOfSocket(socket);
		for (var clientId in clients) {
		    var clientSocket = io.sockets.connected[clientId];
		    if (clientSocket.player != msg.playerNum) {
				clientSocket.emit('give turn', msg.move);
			    if (msg.total == clientSocket.randomNum[0]) {
			    	clientSocket.emit('winner', msg.playerNum);
			    }
		    }
		}

		if (msg.total == clientSocket.randomNum[0]) {
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
