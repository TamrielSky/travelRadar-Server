var express = require('express');
var https = require('https');
var fs = require('fs');

var path = require('path');
var cors = require('cors');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes');

var search = require('./routes/search');


var app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public/dist')));

app.use(routes);
app.use(search);

var options = {
  key: fs.readFileSync('./privatekey.pem'),
  cert: fs.readFileSync('./server.crt')
};

https.createServer(options, app).listen(8080);

app.get('/', function (req, res, next) {
  res.status(200).sendFile(path.join(__dirname+'/public/dist/index.html')); 

});


module.exports = app;
