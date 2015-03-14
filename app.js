var express = require('express');
var app = express();
var logger = require('morgan');
var swig = require('swig');
var bodyParser = require('body-parser');
var request = require('request');
var keys = require('./keys');
// var SpotifyWebApi = require('spotify-web-api-node');
// var spotifyApi = new SpotifyWebApi({
// 	clientId : keys.spotifyId,
//   clientSecret : keys.spotifySecret,
//   redirectUri : 'http://localhost:2289/'
// });

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
// app.set('views', __dirname + '/views');
swig.setDefaults({ cache: false });

app.listen(2289, function() {
	console.log('Server is up and running...');
});

app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.render('index', {});
});

app.post('/search', function(req, res) {
	var artist = req.body.artist;
	var song = req.body.song;
	request('https://api.spotify.com/v1/search?q=' + song + ' cover' + '&type=track', function(err, res, songs) {
		if (err) throw 'Spotify Search Error';
		var spotifyResults = {};
		console.log(songs);
	});
	request('https://api.soundcloud.com/tracks.json?consumer_key=' + keys.soundcloudId + '&q=' + song + ' ' + artist + '&order=original', function(err, res, songs) {
		if (err) throw 'SoundCloud Search Error';

	});
	request('https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + song + ' cover' + '&key=' + keys.youtubeKey, function(err, res, videos) {
		if (err) throw 'YouTube Search Error';

	});
	res.redirect('/');
});