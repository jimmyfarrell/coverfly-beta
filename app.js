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
	var artist = req.body.artist.toLowerCase();
	var song = req.body.song.toLowerCase();
	var results = {};
	var findResults = [
		function(done) {

			var spotifyParameters = {
				q: 'cover+track:"' + song + '"',
				market: 'US',
				type: 'track'
			};
			var spotifyQueryArr = [];
			for (var parameter in spotifyParameters) {
				spotifyQueryArr.push(parameter + '=' + spotifyParameters[parameter]);
			}
			var spotifyQuery = spotifyQueryArr.join('&');

			request('https://api.spotify.com/v1/search?' + spotifyQuery, function(error, response, body) {
				if (error) throw 'Spotify Search Error';

				var spotifyResultsAll = JSON.parse(body).tracks.items;
				spotifyResultsAll.sort(spotifyCompare).reverse();

				var spotifyResultsFiltered = [];
				for (var i = 0; i < spotifyResultsAll.length; i++) {

					var artistCounter = 0;
					for (var j = 0; j < spotifyResultsAll.length; j++) {
						if (spotifyResultsAll[j].artists[0].name === spotifyResultsAll[i].artists[0].name) artistCounter++;
					}

					if (artistCounter === 1) spotifyResultsFiltered.push(spotifyResultsAll[i]);
				}

				results.spotifyResults = spotifyResultsFiltered.slice(0, 5);
				done(null);
			});
		},
		
		function(done) {

			var soundcloudParameters = {
				q: 'cover+"' + song + '"+' + artist,
				filter: 'public',
				order: 'hotness',
				consumer_key: keys.soundcloudId
			};
			var soundcloudQueryArr = [];
			for (var parameter in soundcloudParameters) {
				soundcloudQueryArr.push(parameter + '=' + soundcloudParameters[parameter]);
			}
			var soundcloudQuery = soundcloudQueryArr.join('&');

			request('https://api.soundcloud.com/tracks.json?' + soundcloudQuery, function(error, response, body) {
				if (error) throw 'SoundCloud Search Error';

				var soundcloudResultsAll = JSON.parse(body);
				// soundcloudResultsAll.sort(soundcloudCompare).reverse();

				results.soundcloudResults = soundcloudResultsAll.slice(0, 5);
				done(null);
			});
		},

		function(done) {

			var youtubeParameters = {
				q: 'cover+' + song,
				part: 'snippet',
				order: 'viewCount',
				type: 'video',
				videoEmbeddable: 'true',
				key: keys.youtubeKey
			};
			var youtubeQueryArr = [];
			for (var parameter in youtubeParameters) {
				youtubeQueryArr.push(parameter + '=' + youtubeParameters[parameter]);
			}
			var youtubeQuery = youtubeQueryArr.join('&');

			request('https://www.googleapis.com/youtube/v3/search?' + youtubeQuery, function(error, response, body) {
				if (error) throw 'YouTube Search Error';
				var youtubeResults = JSON.parse(body);

				results.youtubeResults = youtubeResults.items;
				console.log(body);
				done(null);
			});
		}
	];
	async.parallel(findResults, function(err) {
		res.render('index', results);
	});
});

function spotifyCompare(a, b) {
	if (a.popularity > b.popularity) return 1;
	if (a.popularity < b.popularity) return -1;
	return 0;
}