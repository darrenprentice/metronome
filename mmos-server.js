var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser  = require('body-parser');
var mongoose = require('mongoose');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


mongoose.connect(/*database url goes here*/);

var schema = mongoose.Schema({
    data: Array,
    tempo: Number
});
var Sequence = mongoose.model('Sequence', schema);



var numUsers = 0;

io.on('connection', function(socket){

	++numUsers;
	io.sockets.emit('userupdate', numUsers);

	socket.on('new sequence', function (data) {
		socket.broadcast.emit('new sequence', data);
	});

	socket.on('new tempo', function (data) {
		socket.broadcast.emit('new tempo', data);
	});

	socket.on('playpress', function () {
		socket.broadcast.emit('broadcastedplay');
	});

	socket.on('loop', function () {
		// triggered on client beat 0
		io.sockets.emit('looptrigger');
	});

	socket.on('disconnect', function (data) {
		--numUsers;
		io.sockets.emit('userupdate', numUsers);
	});
});




app.get('/api', function (req, res) {
	Sequence.find(function(err, sequences) {
		if (err)
			res.send(err);
		res.send(sequences);
	});
});

app.post('/api', function (req, res) {

	var sequence = new Sequence();
	sequence.data = req.body.data;
	sequence.tempo = req.body.tempo;

	sequence.save(function(err) {
		if (err)
			res.send(err);
		res.send({message: "Sequence created"});
	});
});

app.put('/api/:sequence_id', function(req, res) {
	Sequence.findOne({
		_id: req.params.sequence_id
	}, function(err, sequence) {
		sequence.data = req.body.data;
		sequence.tempo = req.body.tempo;

		sequence.save(function(err) {
			if (err)
				res.send(err);
			res.send({message: "Sequence created"});
		});
	});
});



http.listen(app.get('port'), function() {
	console.log('listening on port: ' + app.get('port'));
});