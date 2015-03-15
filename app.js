var express = require('express');
var app = express();
var logger = require('morgan');
var swig = require('swig');
var bodyParser = require('body-parser');
var request = require('request');
var async = require('async');
var keys = require('./keys');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);
// app.set('css', __dirname + '/public/css');
// app.set('js', __dirname + '/public/js');
swig.setDefaults({ cache: false });

app.listen(2289, '0.0.0.0', function() {
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
	
	var artist = '';
	artist = req.body.artist.toLowerCase();//.replace( /\W(the)\W|\Wa\W|\W(an)\W/ , ' ');
	var song = '';
	song = req.body.song.toLowerCase();//.replace( /\W(the)\W|\Wa\W|\W(an)\W/ , ' ');

	if (!artist && !song) {
		res.render('index', {});
		return;
	}

	var results = {};
	var findResults = [
		function(done) {

			var spotifyBaseUrl = 'https://api.spotify.com/v1/search';
			var spotifyParameters = {
				q: 'track:"' + song + '"+' + artist,
				market: 'US',
				type: 'track'
			};
			var spotifyQueryArr = [];
			for (var spotifyFilter in spotifyParameters) {
				spotifyQueryArr.push(spotifyFilter + '=' + spotifyParameters[spotifyFilter]);
			}
			var spotifyQuery = spotifyQueryArr.join('&');

			request(spotifyBaseUrl + '?' + spotifyQuery, function(error, response, body) {

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

			var soundcloudBaseUrl = 'https://api.soundcloud.com/tracks';
			var soundcloudParameters = {
				q: 'cover+' + song + '+' + artist + '+NOT+karaoke',
				filter: 'public',
				order: 'hotness',
				consumer_key: keys.soundcloudId
			};
			var soundcloudQueryArr = [];
			for (var soundcloudFilter in soundcloudParameters) {
				soundcloudQueryArr.push(soundcloudFilter + '=' + soundcloudParameters[soundcloudFilter]);
			}
			var soundcloudQuery = soundcloudQueryArr.join('&');

			request(soundcloudBaseUrl + '.json?' + soundcloudQuery, function(error, response, body) {
				if (error) throw 'SoundCloud Search Error';

				var soundcloudResultsAll = JSON.parse(body);
				soundcloudResultsAll.sort(soundcloudCompare).reverse();

				results.soundcloudResults = soundcloudResultsAll.slice(0, 5);
				done(null);
			});
		},

		function(done) {

			var youtubeBaseUrl = 'https://www.googleapis.com/youtube/v3/search';
			var youtubeParameters = {
				q: 'cover+' + song + artist,
				part: 'snippet',
				order: 'relevance',
				type: 'video',
				videoEmbeddable: 'true',
				key: keys.youtubeKey
			};
			var youtubeQueryArr = [];
			for (var youtubeFilter in youtubeParameters) {
				youtubeQueryArr.push(youtubeFilter + '=' + youtubeParameters[youtubeFilter]);
			}
			var youtubeQuery = youtubeQueryArr.join('&');

			request(youtubeBaseUrl + '?' + youtubeQuery, function(error, response, body) {
				if (error) throw 'YouTube Search Error';
				var youtubeResults = JSON.parse(body);

				results.youtubeResults = youtubeResults.items;
				done(null);
			});
		}
	];

	async.parallel(findResults, function(err) {
		res.render('index', results);
		console.log('Search: ' + artist + ' - ' + song);
	});
});

function spotifyCompare(a, b) {
	if (a.popularity > b.popularity) return 1;
	if (a.popularity < b.popularity) return -1;
	return 0;
}

function soundcloudCompare(a, b) {
	if (a.playback_count + a.favoritings_count > b.playback_count + b.favoritings_count) return 1;
	if (a.playback_count + a.favoritings_count < b.playback_count + b.favoritings_count) return -1;
	return 0;
}