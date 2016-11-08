var socketio = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
var hashRoom = {};

exports.listen = function(server) {

	//这里 socketio(server) 也可以 socketio().attach  socketio.listen(server)
	io = socketio().attach(server);
	io.set('log level', 1);
	// console.log(io);
	io.sockets.on('connection', function(socket) {
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
		joinRoom(socket, 'Lobby');
		handleMessageBroadcasting(socket, nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleRoomJoining(socket);
		socket.on('rooms', function() {
			// console.log(io.sockets.adapter.rooms);
			socket.emit('rooms', hashRoom);
		});

		handleClientDisconnection(socket, nickNames, namesUsed);
	});
}

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	var name = 'Guset' + guestNumber;
	nickNames[socket.id] = name;

	socket.emit('nameResult', {
		success:  true,
		name: name
	});

	namesUsed.push(name);
	return guestNumber + 1;
}

function joinRoom(socket, room) {
	if(hashRoom[room] == undefined) {
		hashRoom[room] = true;
	}

	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit('joinResult', {
		room: room
	});

	socket.broadcast.to(room).emit('message', {
		text: nickNames[socket.id] + ' has joined ' + room + '.'
	});
	var usersInRoom = io.sockets.adapter.rooms[room];
	// console.log('room = ' + room);
	if(usersInRoom.length && usersInRoom.length > 1) {
		var usersInRoomSummary = 'Users currently in ' + room + ': ';
		for(var index in usersInRoom.sockets) {
			var userSocketId = index;
			if(userSocketId != socket.id) {
				usersInRoomSummary += ' ';
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary +='.';
		// console.log(usersInRoomSummary);
		socket.emit('message', {text: usersInRoomSummary});
	}
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {

	socket.on('nameAttempt', function(name) {
		if(name.indexOf('Guest') == 0) {
			socket.emit('nameResult', {
				success: false,
				message: 'Names connot begin with "Guest"',
			});
		} else {
			if(namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
					success: true,
					name: name,
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text: previousName + 'now is known as ' + name + '.',
				});
			} else {
				socket.emit('nameResult', {
					success: false,
					message: 'That name is already in use',
				});
			}
		}
	});
}

function handleMessageBroadcasting(socket) {
	socket.on('message', function(message) {
		console.log(message.text);
		console.log(' from + ');
		console.log(message.room);
		socket.broadcast.to(currentRoom[message.room]).emit('message', {
			text: nickNames[socket.id] + ': ' + message.text
		});
	});
}

function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		// hashRoom[currentRoom[socket.id]] = false;
		joinRoom(socket, room.newRoom);
	});
}

function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}
