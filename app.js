
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var path = require('path');
var fs = require('fs');

var http = require('https');  // note https, not http!
var MongoStore = require('connect-mongo')(express);

var app = express();

var options = {
  key: fs.readFileSync('keys/comp2406-private-key.pem'),
  cert: fs.readFileSync('keys/comp2406-cert.pem')
};

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

app.use(express.cookieParser('COMP 2406 adventure demo!'));
app.use(express.session({
    cookie: {maxAge: 60000 * 20} // 20 minutes
    , secret: "Shh... I'm a secret"
    , store: new MongoStore({db: "adventure-demo"})
}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// set NODE_ENV environment variable to change from development mode
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.all('/', routes.index);
app.post("/register", routes.register);
app.get('/game', routes.game);
app.get('/editor', routes.editor);
app.post('/startEditor', routes.startEditor);
app.get('/getContents', routes.getContents);
app.post('/start', routes.start);
app.post('/quit', routes.quit);
app.post('/doAction', routes.doAction);
app.post('/saveRoom', routes.saveRoom);

routes.connectToDBs();

http.createServer(options, app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port') +
	      ' in ' + app.get('env') + ' mode.');
});
