var express = require('express');
var app = express();
var logger = require('morgan');
var swig = require('swig');
var bodyParser = require('body-parser');
var request = require('request');
// var Q = require('q');
var async = require('async');
var keys = require('./keys');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);
// app.set('css', __dirname + '/node_modules/bootstrap/dist/css');
// app.set('js', __dirname + '/node_modules/bootstrap/dist/js');
swig.setDefaults({ cache: false });

app.listen(2289, function() {
	console.log('Server is up and running...');
});

app.use(express.static(__dirname + '/public'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.render('index', {});
});

app.get('/search', function(req, res) {
	res.redirect('/');
});

app.post('/search', function(req, res) {
	var artist = req.body.artist;
	var song = req.body.song;
	var results = {};
	var findResults = [
		function(done) {
			request('https://api.spotify.com/v1/search?q=' + song + '&type=track', function(error, response, body) {
				if (error) throw 'Spotify Search Error';
				results.spotifyResults = JSON.parse(body).tracks.items;
				console.log('spotify results');
				done(null);
			});
		},
		function(done) {
			request('https://api.soundcloud.com/tracks.json?consumer_key=' + keys.soundcloudId + '&q=' + song + ' ' + artist, function(err, res, body) {
				if (err) throw 'SoundCloud Search Error';
				results.soundcloudResults = JSON.parse(body);
				console.log('soundcloud results', console.log(results.soundcloudResults[0]));
				done(null);
			});
		},
		function(done) {
			request('https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + song + ' cover' + '&key=' + keys.youtubeKey, function(err, res, videos) {
				if (err) throw 'YouTube Search Error';
				console.log('youtube results');
				done(null);
			});
		}
	];
	async.parallel(findResults, function(err) {
		console.log('then results');
		res.render('index', results);
	});
});