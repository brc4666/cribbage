
var http = require("http");
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var ServerGameState = require('./servergamestate.js');
var Deck = require('./deck.js');
var AllConnections = require('./connections.js');


/*****************************
*
*     SOCKET.IO SECTION
*
******************************/

// array to store details of all current connections and connected players
var myConnections = [];
// 
var gameState = new ServerGameState();
// variable to store player's name, supplied on the socket connection
var playerId;

// socket.io pre-configuration 
const server = require('http').createServer(app);
const io = require('socket.io')(server);
server.listen(8081);
    
// Display a message
var host = server.address().address;
var port = server.address().port;
console.log("Listening at http://%s:%s", host, port);

// Create hooks for connections & disconnects 
/* https://socket.io/docs/emit-cheatsheet/ */
io.on('connect', onConnect);
io.on('disconnect', onDisconnect);

// function to perform when a connection is made to the server
function onConnect(socket) {
  
  // extract players name from the query token
  playerId = socket.handshake.query.token;
  socket.name = playerId;

  console.log( 'A process connected ...');
  console.log( '     socket.id     :' + socket.id );
  console.log( '     socket.name   :' + socket.name );
  console.log( '     playerId      :' + playerId );
  // send a message to all other players that this player has joined
  socket.broadcast.emit('playerjoined', playerId);
  
  // send a message back to the newly connected player with other players who have already joined
  for (i=0; i < myConnections.length; i++) {
    console.log( '  sending message back to ' + playerId + ' that ' + myConnections[i].name + ' is already connected');
    socket.emit('playerjoined', myConnections[i].name );
  }

  // Finally ... store this socket and player name so we know all connections
  myConnections.push( socket );

  DumpPlayersList( 'After onConnect ...');

  // Define function to run when the process disconnects
  socket.on('disconnect', function() {
    //  tell other connections they have left
    socket.broadcast.emit('playerleft', playerId);

    // remove this connection from the list of all connected sockets
    var index = myConnections.indexOf(socket);
    myConnections.splice(index, 1);

    DumpPlayersList("onDisconnect ... ");
    //Send the disconnect message back to this player only
    // socket.broadcast.emit('playerjoined:', playerId);
    // socket.emit('disconnect', {message: 'Goodbye!'});    NOOOOOOOOOOOOOOOOOOOOOOO
  });

  socket.on('playerjoining', function(playerId) {
    console.log(playerId + ' joined.');
    /* Send a message to all other connections that this player has joined */
    socket.broadcast.emit('playerjoined:', playerId);
  });

  socket.on('playerleft', function(playerId) {
    console.log(playerId + ' is leaving ...');
    /* Send a message to all other connections that this player has left */
    socket.broadcast.emit('playerleft', playerId);
  });

  socket.on('startgame', function(numPlayers){
    // Initialise default seating plan
    if (numPlayers==2) {
      gameState.addPlayer(myConnections[0].name, 'N');
      gameState.addPlayer(myConnections[1].name, 'S');
    } else {
      gameState.addPlayer('Kate', 'N');
      gameState.addPlayer('Brian', 'S');
      gameState.addPlayer('Mel', 'E');
      gameState.addPlayer('Matthew', 'W');
    }
    gameState.IncrementScore( 57 );

    console.log('game being started...');
    console.log('   numPlayers: ' + numPlayers);
    for (i=0; i<gameState.players.length; i++) {
      console.log('   Player #' + (i+1) + ': ' + gameState.players[i].name + ' [' + gameState.players[i].compassSeat + ']');
    }

    /* Send a message to all other connections that the game has started */
    io.emit('gamestarted', gameState);
  });

  // Function to execute when a 'my message' message is received
  socket.on('my message', (msg) => {
    console.log('message: ' + msg);
    io.emit('my broadcast', 'Server to ' + playerId + `: ${msg}`);
  });

  function DumpPlayersList( title ) {
    console.log('   ' + title);
    console.log('       Number of connections=' + myConnections.length);
    for (i=0; i < myConnections.length; i++) {
      console.log( '          Player ' + i + ':' + myConnections[i].name);
    }
  };

};

function onDisconnect() {
  console.log('***** A user disconnected *****');
};



  /*
  // sending to the client
  socket.emit('hello', 'can you hear me?', 1, 2, 'abc');
  // sending to all connected clients
  io.emit('an event sent to all connected clients');
  
};
*/

/*****************************
*
*     HTTP SECTION
*
******************************/

// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }))
// create application/json parser
app.use(bodyParser.json())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", 'OPTIONS,GET,HEAD,POST,PUT,DELETE');
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Authorization, Access-Control-Allow-Methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  res.type('json');
  // allow preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

deck = new Deck;
heroes = [];

console.log("Hello World");

/*
heroes.push( new Hero(11, 'Tiger', 'Nike') );
heroes.push( new Hero(12, 'Jack', 'Titleist') );
heroes.push( new Hero(13, 'Jordan', 'Calloway') );
heroes.push( new Hero(14, 'Sergio', 'Titleist') );
heroes.push( new Hero(15, 'Rory', 'Nike') );
heroes.push( new Hero(16, 'Tom', 'Dunlop') );
heroes.push( new Hero(17, 'Ernie' , 'Titleist') );
heroes.push( new Hero(18, 'Justin', 'Nike') );
heroes.push( new Hero(19, 'Seve', 'Topflite') );
heroes.push( new Hero(20, 'Tony', 'Dunlop') ); 
*/

function between(min, max) {
   return Math.floor(
     Math.random() * (max - min + 1) + min
   )
}

deck.shuffle();



// This responds with "Hello World" on the homepage
app.get('/', function (req, res) {
  console.log("Got a GET request for the homepage");
  res.send('Hello GET');
} )

// This responds a GET request for the /brian page.
app.get('/brian', function (req, res) {
  console.log("Got a GET request for /brian");
  res.send('Brians page');
})

// This responds a GET request for a random number.
app.get('/rnd', function (req, res) {
  console.log("Got a GET request for a random number");
  var r = between(10, 100);
  res.send(r.toString());
})

/*
// This responds a GET request for a random number.
app.get('/golfers', function (req, res) {
  console.log("Got a GET request for a list of golfers");
  const timeoutObj = setTimeout(() => { 
    res.send( JSON.stringify( this.heroes ) );
  }, 2500);
  
})
*/

