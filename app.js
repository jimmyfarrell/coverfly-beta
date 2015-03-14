var express = require('express');
var app = express();
var logger = require('morgan');
var swig = require('swig');
var bodyParser = require('body-parser');

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
	console.log(artist, song);
	res.redirect('/');
});