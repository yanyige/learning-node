
var express = require('express');

var http = require('http');

var util = require('util');

var fs = require('fs');

var path = require('path');

var mime = require('mime');

var formidable = require('formidable');

var cache = {};

var cheerio = require('cheerio');

//404error
function send404(res) {
	res.writeHead(404, {'Content-Type': 'text/plain'});
	res.write('Error 404: you are in a black hole');
	res.end();
}

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

http.createServer(function(req, res) {

	if(req.url == '/upload' && req.method.toLowerCase() == 'post') {
		//分析文件上传

		var form = new formidable.IncomingForm();
		form.keepExtensions = true;
		// form.hash = false;

		var rootPath = __dirname;
		// rootPath = path.join(rootPath, '/upload');
		console.log(rootPath);
		console.log(path.basename(rootPath));
		console.log(path.dirname(rootPath));
		var d = new Date();
		var nowDay = d.getDate();
		var nowYear = d.getFullYear();
		var nowMonth = d.getMonth();
		var fileWrap = nowYear + '-' + nowDay + '-' + nowMonth;
		var fileName = d.getTime();

		fileWrap = 'public/upload/' + fileWrap;
		rootPath = path.join(rootPath, '/' + fileWrap);


		mkdirs(fileWrap, function() {

			form.uploadDir = rootPath;

			form.parse(req, function(err, fields, files) {
				res.writeHead(200, {'content-type': 'text/plain'});

				res.write('上传成功\n\n');

				res.end(util.inspect({fields: fields, files: files}));
				var result = files;

				fs.readFile('public/' + 'second.html', 'utf-8', function(err, data) {
					var $ = cheerio.load(data.toString());
					var div = $('body').find('#conferenceContent');
					var divv = $("<span class='time' style='color:red;font-size: 20px;'></span>")
					var wrapper = $("<div></div>");
					divv.text('Time:'+result.upload.lastModifiedDate);
					var divahref = $('<a></a>');
					var _name = path.basename(result.upload.path);
					divahref.attr('href', fileWrap.slice(6, -1)+'/'+_name);
					divahref.text(result.upload.name);
					wrapper.append(divv);
					wrapper.append(divahref);
					div.append(wrapper);
					var ans = $.html();

					fs.writeFile('public/second.html', ans, function(err) {
					    if (err) {
					        throw err;
					    }

					    // 写入成功后读取测试
					    fs.readFile('public/second.html', 'utf-8', function(err, data) {
					        if (err) {
					            throw err;
					        }
					    });
					});
				});
			});
		});

		return;
	}



	var filePath = false;

	if(req.url == '/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + req.url;
	}

	var absPath = './' + filePath;
	serviceStatic(res, cache, absPath);

}).listen(80);;

function mkdirs(dirname, callback) {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback();
        } else {
            //console.log(path.dirname(dirname));
            mkdirs(path.dirname(dirname), function () {
                fs.mkdir(dirname, callback);
            });
        }
    });
}


// { fields: { title: '' },
//   files:{ upload:File {
				//         domain: null,
				//         _events: {},
				//         _eventsCount: 0,
				//         _maxListeners: undefined,
				//         size: 21469,
				//         path: 'D:\\git\\learning-node\\uploadFile\\public\\upload\\2017-4-2\\upload_24bc0e6c603d412356cbfe29fdb56084.gif',
				//         name: '201103040950491866.gif',
				//         type: 'image/gif',
				//         hash: null,
				//         lastModifiedDate: 2017-03-04T09:39:01.000Z,
				//         _writeStream: [Object] } } }
