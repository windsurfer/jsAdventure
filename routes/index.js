var bcrypt = require("bcrypt");
var mc = require('mongodb').MongoClient;
var playersCollection;
var roomsCollection;
var currentPlayers = [];

var defaultRoom = {   name: "theVoid",
		      title: "The Void",
		      description: "You are in the Void.  How did you get here?  There are no exits.",
		      roomExits: ['theVoid']
		  };	    

var connectToDBs = function(callback) {
    mc.connect('mongodb://localhost/adventure-demo', function(err, db) {
	if (err) {
	    throw err;
	}
	
	playersCollection = db.collection('players');
	roomsCollection = db.collection('rooms');

	if (callback) {
	    callback();
	}
    });
}

var savePlayer = function(player) {
    playersCollection.update({"playername": player.playername},
			     player, function(err, count) {
					 if (err) {
						 console.log(
						 "Couldn't save player state");
					 }
			     });
}

var index = function(req, res) {
    
    if (req.session.player) {
        res.redirect("/game");
    } else {
		res.render('index', { title: 'COMP 2406 AJAX Adventure Demo', 
							  error: req.query.error 
							}
		);
    }
}

var register = function(req, res) {
    var playername = req.body.playeredname;
    var password   = req.body.password;

    var addPlayer = function(err, players) {
		if(players.length!=0){
			res.redirect("/?error=name already exists");	
			return;
		}
	
		//generate a salt, with 10 rounds (2^10 iterations)
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(password, salt, function(err, hash) {
				var newPlayer = {
					playername: playername,
					password: hash,
					online: false,
					room: "bridge"
				};
				
				playersCollection.insert(newPlayer, function(err, newPlayers){
					if (err) {
					throw err;
					} else {
						res.render('registered', 
						   { playername: newPlayers[0].playername });
					}
				});    
			});
		});	
    };	
    
    playersCollection.find({playername: playername}).toArray(addPlayer);
}

var checkPass = function(req, res, name, password, sessionName, successURL) {
    playersCollection.findOne({playername: name}, function(err, name){
	
		if (err || !name){
			req.session.destroy(function(err) {
			res.redirect("/?error=invalid name or password");	
			});
			return;
		}
		
		bcrypt.compare(password, name.password, function(err, authenticated){
			if (authenticated) {
				req.session[sessionName] = name;
				delete req.session[sessionName]._id;
				res.redirect(successURL);
			} else {
				req.session.destroy(function(err) {
					res.redirect("/?error=invalid name or password");
				});
			}
		});
    });
}

var start = function(req, res){
    var playername = req.body.playeredname;
    var password   = req.body.password;
    
    checkPass(req, res, playername, password, "player", "/game");

}

var quit = function(req, res){
	if (req.session.player) {
		var player = req.session.player;
		player.playing = false;
		savePlayer(player);
	}
    
    req.session.destroy(function(err){
		if (err) {
			console.log("Error: %s", err);
		}
		res.redirect("/");
    });	
}

var game = function(req, res) {
    if (req.session.player) {
	res.render("room.jade", {title: "AJAX Adventure Demo"});
    } else {
        res.redirect("/");
    }
}

var doAction = function(req, res) {
    var action = req.body.action;
    var room   = req.body.room;

    if (!req.session.player) {
		res.send("Error: NotLoggedIn");
		return;
    }

    if (action === "move") {
		req.session.player.room = room;
		savePlayer(req.session.player);
		res.send("Success");
    } else {
		res.send("Error: InvalidAction");
    }
}

var getContents = function(req, res) {        
    var roomValue;
    // var currentPlayer;
    if(req.session.player) {
		roomValue     = req.session.player.room;
		// currentPlayer = req.session.player;
	} else if (req.session.editorName) {
		roomValue = req.query.roomValue;
    } else {
		res.send("Error: NotLoggedIn");
		return;
    }
    
    roomsCollection.findOne(
		{name: roomValue},
		function(err, room) {
			if (err || !room) {
				room = defaultRoom;
			}
			res.send(room);
		}
    );
    //res.send(currentPlayer);
}

var startEditor = function(req, res) {
    var editorName = req.body.playeredname;
    var password = req.body.password;
    
    checkPass(req, res, editorName, password, "editorName", "/editor");
}

var editor = function(req, res) {
    if (req.session.editorName) {
		res.render("editor.jade", {editorName:
				   req.session.editorName.playername});
    } else {
        res.redirect("/");
    }
}

var saveRoom = function(req, res) {
    var editRoom = req.body.roomName;
    var editDesc = req.body.roomDesc;
    var editActv = req.body.roomActv;
    var editExit = req.body.roomExit;
    var theExits = editExit.split(",");
    
    roomsCollection.update(
		{ name: editRoom },
		{ $unset: { roomExits: "" } },
	function(err, editRoom){
		if(err) {
			console.log("Couldn't save room state: " + err);
		}
	});
	
	roomsCollection.findOne({ name: editRoom }, function(err, theRoom) {
	  if (err)
		throw err;
	  if (theRoom) {
		roomsCollection.update(
			theRoom,
			{ 
				$set: {roomExits: theExits}
			},
			function(err, theRoom){
				if (err){
					console.log("Result: " + JSON.stringify(theRoom));
					throw err;
				}
			}
		);
	  }
	});
    
	roomsCollection.update(
		{ name: editRoom },
		{ name: editRoom,
		  description: editDesc,
		  activity: editActv,
		},
		{ upsert: true },
	function(err, editRoom){
		if(err) {
			console.log("Couldn't save room state: " + err);
		}
	});
}

exports.index        = index;
exports.register     = register;
exports.start        = start;
exports.quit         = quit;
exports.game         = game;
exports.connectToDBs = connectToDBs;
exports.doAction     = doAction;
exports.getContents  = getContents;
exports.startEditor  = startEditor;
exports.editor       = editor;
exports.saveRoom     = saveRoom;


// test cases

process.argv.forEach(function(val, index, array) {
	if (val == "test"){
		console.log("TEST MODE ENGAGED");
		connectToDBs(function(){
			onlinePlayers.push("somePlayer");
			console.log(onlinePlayers);
			process.exit(-1);
		});
	}
});

		
		
		
		
		
		
		
		
