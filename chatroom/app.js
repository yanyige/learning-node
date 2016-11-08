var http = require('http');

var fs = require('fs');

var path = require('path');

var mime = require('mime');

var cache = {};

//404error
function send404(res) {
	res.writeHead(404, {'Content-Type': 'text/plain'});
	res.write('Error 404: you are in a black hole');
	res.end();
}

//mime提供文件数据
function sendFile(res, filePath, fileContents) {
	res.writeHead(200, 
		{"Content-Type": mime.lookup(path.basename(filePath))}
	);
	res.end(fileContents);
}

//serviceStatic
function serviceStatic(res, cache, absPath) {
	if(cache[absPath]) {
		sendFile(res, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists) {
			if(exists) {
				fs.readFile(absPath, function(err, data){
					if(err) {
						send404(res);
					} else {
						cache[absPath] = data;
						sendFile(res, absPath, data);
					}
				})
			} else {
				send404(res);
			}
		});
	}
}

var server = http.createServer(function(req, res){

	var filePath = false;

	if(req.url == '/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + req.url;
	}

	var absPath = './' + filePath;
	serviceStatic(res, cache, absPath);
});



server.listen(3000, function() {
	console.log('Server now listening on port 3000');
});

//define Socket.IO Server
var chatServer = require('./lib/chat_server');
chatServer.listen(server);


