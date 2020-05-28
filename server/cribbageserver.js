
var http = require("http");
let fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var jsonParser = bodyParser.json();
var path = require('path');
var PORT = process.env.PORT || 8081;

// view engine setup
// var router = express.Router();

//Tell Express where we keep our index.ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// var indexRouter = require('./routes/index');
// app.use('/', indexRouter);


const MasterGameData = require('./mastergamedata.js');
const MasterCardinHand = require('./mastergamedata.js');
const Deck = require('./deck.js');
const AllConnections = require('./connections.js');



// array to store details of all current connections and connected players
var myConnections = new AllConnections;
// master game data
var masterData = new MasterGameData;
// deck of cards
var fulldeck = new Deck;
// variable to store player's name, supplied on the socket connection
var playerId = "";
// whether the 'startgame' message has been - or is being processed
var startinggame = false;
var gameStarted = false;


/*****************************
*
*     SOCKET.IO SECTION
*
******************************/


const server = require('http').createServer(app);
const io = require('socket.io')(server,{
  serveClient: false,
  // below are engine.IO options
  pingInterval: 25000,
  pingTimeout: 600000,
  cookie: false
});
server.listen(PORT);
// http.createServer(handleRequest).listen(8000);

// Display a message
var host = server.address().address;
var port = server.address().port;
console.log("Listening at http://%s:%s", host, port);
console.log("Hello World");

function between(min, max) {
   return Math.floor( Math.random() * (max - min + 1) + min );
}

// Create hooks for connections & disconnects 
/* https://socket.io/docs/emit-cheatsheet/ */
io.on('connect', onConnect);
io.on('disconnect', onDisconnect);


function onDisconnect() {
  console.log('***** A user disconnected *****');
};

// function to perform when a connection is made to the server
function onConnect(socket) {
  
  // extract players name from the query token
  playerId = socket.handshake.query.token;
  socket.name = playerId;
  console.log( 'A process connected ...' + socket.id + '/' + socket.name);

  // See if this player is already in the list of connected players !
  ci = myConnections.findConnection( socket.name );
  if (ci>-1) {
    // Seems that this connection has already connected previously  .... 
    console.log( '   The process has previously connected ...');
    if (gameStarted && myConnections.connections[ci].ingame ) {
      // a game is already running, and this connection appears to have been part of it
      console.log('      reconnecting player to game ...')
      socket.emit('gameready', masterData);
    } else if (gameStarted) {
      // game has already started ... so this player cannot join

    }
  } else {
    // New connection for a game that hasn't started
    // send a message back to the newly connected player with other players who have already joined
    for (i=0; i < myConnections.connectionsCount(); i++) {
      console.log( '   sending message back to ' + playerId + ' that ' + myConnections.connections[i].name + ' is already connected');
      socket.emit('playerjoined', myConnections.connections[i].name );
    }
    // send a message to all other players that this player has joined
    socket.broadcast.emit('playerjoined', playerId);
    // Finally ... store this socket and player name so we know all connections
    myConnections.AddConnection( socket );
  }

  myConnections.dumpConnections( 'After onConnect ...');


  // Define function to run when the process disconnects
  socket.on('disconnect', function() {
    //  tell other connections they have left
    // TO DO playerId here is not reliable
    console.log( 'an unidentified player disconnected !!!!!!!');
    /*
    socket.broadcast.emit('playerleft', playerId);

    myConnections.dumpConnections("onDisconnect ... ");

    if ( (myConnections.length <=0 ) && (gameStarted) ) {
      // No more connections ... so bandon the game and reset the game object
      masterData.reset();
      gameStarted = false;
      startinggame = false;
    }
    */
    //Send the disconnect message back to this player only
    // socket.broadcast.emit('playerjoined:', playerId);
    // socket.emit('disconnect', {message: 'Goodbye!'});    NOOOOOOOOOOOOOOOOOOOOOOO
  });

  socket.on('playerjoining', function(playerId) {
    console.log(playerId + ' joined.');
    // TO DO - what does this do that onConnect doesn't ???
    /* Send a message to all other connections that this player has joined */
    socket.broadcast.emit('playerjoined:', playerId);
  });

  socket.on('playerleft', function(playerId) {
    console.log(playerId + ' is leaving ...');
    // TO DO
    // remove from the list of connections ...
    myConnections.RemoveConnection(playerId );
    myConnections.dumpConnections( 'After player left ...');
    /* Send a message to all other connections that this player has left */
    socket.broadcast.emit('playerleft', playerId);
  });

  // A client has clicked the start game button and sent a configData structure for the server
  // to initialise the master gamedata object. 
  socket.on('startgame', function(jsonConfigData) {
    if (this.startinggame == true) {
      // this message has already been received ... so just ignore it as that player
      // should have already - or will get a gameinitialising message
      return;
    }
    this.startinggame = true;
    console.log('game being started...');
    // flag all connections that they are in the game
    for (i=0; i<myConnections.connections; i++) {
      myConnections.connections[i].ingame = true;
    }
    // Send a message to all other connections that this player has initiated the start game sequence 
    socket.broadcast.emit('gameinitialising', playerId);
    // Assign the data to the config data object 
    // TODO catch errors 
     masterData.config = jsonConfigData;
    // Now initialise the activePlayers[] with the players in config object who are connected
    masterData.state.activePlayers.splice(0, masterData.state.activePlayers.length);
    masterData.state.numActivePlayers = 0;
    for (i = 0; i < masterData.config.potentialPlayers.length; i++) {
      if (masterData.config.potentialPlayers[i].isConnected===true) {
        // Add this player to the active players array
        masterData.state.addPlayer( masterData.config.potentialPlayers[i].name, 
                                    masterData.config.potentialPlayers[i].compassSeat );
      }
    }
    // So now we know who is playing, but we need to check compass positions of two-player games
    // and we can initialise the games scores too
    if (masterData.state.numActivePlayers==2) {
      // One player is in the North ...
      masterData.state.activePlayers[0].compassSeat = 'N';
      masterData.scoring.initPlayersScore(0, 'N', masterData.state.activePlayers[0].name );
      // The other in the south
      masterData.state.activePlayers[1].compassSeat = 'S';
      masterData.scoring.initPlayersScore(1, 'S', masterData.state.activePlayers[1].name );
      // Assign dealer randomly
      masterData.state.currentDealer = masterData.state.activePlayers[ between(0, 1) ].name;
      // TEMP - make Brian the dealer !!!!
      // masterData.state.currentDealer = "Brian";
    }
    else {
      // Compass seats are ok as default ... so just the game scores to initialise
      // Team one is North/South ...
      masterData.scoring.initPlayersScore(0, 'NS', 'Flamers' );
      // Team two is East/West ...
      masterData.scoring.initPlayersScore(0, 'EW', 'M&Ms' );
      // Assign dealer randomly
      masterData.state.currentDealer = masterData.state.activePlayers[ between(0, 3) ].name;
    }
    masterData.state.currentActivePlayer = masterData.whoIsNext( masterData.state.currentDealer );

    // Deal cards to all the active players and store the number of cards left in the dek to cut
    masterData.state.cardsToCut = 52 - dealCards();

    // Set the initial game phase ( this should really but cutting for deal, but never got implemented ) 
    masterData.state.currentPhase = 2; /* discarding to box */

    // TEMP - testing
    // masterData.state.currentPhase = 4; /* pegging */
    // masterData.state.currentPhase = 3; /* turnup */
    // masterData.state.currentPhase = 5; /* score-hands */

    // Upate the flag that game is setup
    masterData.config.isSetup = true;
   
    console.log('Starting Game ! ... ');
    console.log('   numPlayers: ' + masterData.state.numActivePlayers);
    for (i=0; i < masterData.state.activePlayers.length; i++) {
      console.log('   Player #' + (i+1) + ': ' + masterData.state.activePlayers[i].name + ' [' + masterData.state.activePlayers[i].compassSeat + ']');
    }

    /* Send a message to all connections with the initialised game data */
    io.emit('gameready', JSON.stringify(masterData));

    // flag the fact the game has started
    gameStarted = true;
  });

  socket.on('discardedtobox', function(jsonPlayerInfo) {
    // Assign the data to a useable data object 
    // TODO check type (should be MasterPlayerInfo & catch errors 
    let recvdPlayerInfo = jsonPlayerInfo;
    console.log(recvdPlayerInfo.name + ' has completed their discards for the box...');
    // find the index of this player in the master data object
    let playerIndex = masterData.getActivePlayerIndex(recvdPlayerInfo.name );
    if (playerIndex<0) {
      // Darn - didn;t find the active player !!!! 
      // TODO
    } else {
      // So now we know the associated index in the master active players list ...
      // we can transfer/update the master hand information with that received
      masterData.state.activePlayers[playerIndex].clearHand();
      for (let c = 0; c < recvdPlayerInfo.hand.length; c++) {
        if (recvdPlayerInfo.hand[c].played == false) {
          masterData.state.activePlayers[playerIndex].addCardtoHand(recvdPlayerInfo.hand[c].card);
        }
      }
      // now we can transer the discards to the box object 
      masterData.theBox.addPlayer( recvdPlayerInfo.name );
      for (c = 0; c < recvdPlayerInfo.discards.length; c++) {
        masterData.theBox.addCardtoBox( recvdPlayerInfo.discards[c] );
      }
      // and now we can get rid of the discarded cards
      masterData.state.activePlayers[playerIndex].clearDiscards();

      // Now we can decide if we can move to the next cycle of the round
      // or just go to the next player
      if (masterData.theBox.playersDiscarded.length == masterData.state.numActivePlayers) {
        // Discards complete !
        // So cycle to next stage of the hand ... and the next player !
        masterData.state.currentPhase++;
        // Now cycle the current player ...
        masterData.state.currentActivePlayer = masterData.whoIsNext( recvdPlayerInfo.name );
        console.log( 'All players have discarded to box. new state is: '+ masterData.state.currentPhase + ' and next player is:' + masterData.state.currentActivePlayer);
        // Now send back to all clients the updated game state object
        io.emit('refreshstate', masterData.state);
      } else {
        // More players to discard ...
        // so cycle player
        masterData.state.currentActivePlayer = masterData.whoIsNext( recvdPlayerInfo.name );
        console.log( 'More players need to discard to box. next player is: ' + masterData.state.currentActivePlayer);
        // and  send back to all clients the updated player's info (and the box)
        io.emit('refreshstate', masterData.state);
      }
    }
  });

  /**
   * Message received with the index number of the card selected in the cut deck operation
   * 
   */
  socket.on('turnupcard', function(turnUpCardIndex) {
    var cardname = fulldeck.getCardAt(turnUpCardIndex);
    console.log ('The turnup card is:' + cardname );
    masterData.state.turnup = cardname;
    // if this is a jack, the player scores 2 points 
    // NB. the client(s) will mirror this score on receipt of the 'turnupcard' message
    if ('j'==cardname.substr(0,1) ) {
      masterData.state.publicMessage = masterData.state.currentDealer + ' scores 2 for his Heels';
      
      //if (masterData.scoring.incrementPlayersScore( masterData.state.activePlayers[ masterData.getActivePlayerIndex(masterData.state.currentDealer) ].compassSeat, 2) ) {
      if (masterData.scoring.incrementPlayersScore( masterData.state.activePlayers[ masterData.getActivePlayerIndex(masterData.state.currentDealer) ].compassSeat, 2) ) {
        // Someone has won !!!!
        masterData.state.currentPhase = 6; // Hmmmm - game over state !!!
        io.emit('gameover', masterData.state, masterData.scoring);
        return;
      }
    }
    // increment game phase
    masterData.state.currentPhase++;
    io.emit('turnupcard', cardname, masterData.theBox );
  } );

  socket.on('turncomplete', function(playersName) {
    console.log(playersName + ' has completed their turn ...');
    // Now send back to all clients that the player's turn is complete
    io.emit('cycleplayer', playersName);
  });

  socket.on('playerdiscarded', function(playerName, cardName) {
    // Player has discard one card in the pegging phase
    console.log(playerName + ' has played the ' + cardName);
    // Delegate this to the masterData function to process
    // and decide what action needs to happen next
    if (masterData.playerPlayedPegCard( playerName, cardName ) ) {
      // Pegging phase is complete
      // Cycle to next phase (taking hand phase) - unless the game is over
      if (masterData.scoring.hasSomeoneWon() ) {
        // Someone has won !!!!
        io.emit('gameover', masterData.state, masterData.scoring);
        masterData.state.currentPhase = 6; // Hmmmm - game over state !!!
        return;
      } else {
        masterData.state.currentPhase++;
        // and reset active player to person after dealer
        masterData.state.currentActivePlayer = masterData.whoIsNext( masterData.state.currentDealer );
        io.emit('startshowhandsequence', masterData.state, masterData.pegging, masterData.scoring );
      }
    } else {
      if (masterData.scoring.hasSomeoneWon() ) {
        // Someone has won !!!!
        io.emit('gameover', masterData.state, masterData.scoring);
        masterData.state.currentPhase = 6; // Hmmmm - game over state !!!
        return;
      } else {
        // keep going on the pegging ....
        io.emit('playerpeggingcomplete', masterData.state, masterData.pegging, masterData.scoring );
      }
    }
  });

  socket.on ( 'playercannotgo',  function(playerName) {
    // Received a player can't go (in the pegging phase)
    console.log(playerName + ' cannot go.');
    // Delegate this to the masterData function to process
    // and decide what action needs to happen next
    if ( masterData.playerCantGo( playerName ) ) {
      // Pegging phase is complete
      // So cycle to next phase (taking hand phase) ... unless the game is over !!!!
      if (masterData.scoring.hasSomeoneWon() ) {
        // Someone has won !!!!
        io.emit('gameover', masterData.state, masterData.scoring);
        masterData.state.currentPhase = 6; // Hmmmm - game over state !!!
        return;
      } else {
        masterData.state.currentPhase++;
        // and reset active player to person after dealer
        masterData.state.currentActivePlayer = masterData.whoIsNext( masterData.state.currentDealer );
        io.emit('startshowhandsequence', masterData.state, masterData.pegging, masterData.scoring  );
      }
    } else {
      if (masterData.scoring.hasSomeoneWon() ) {
        // Someone has won !!!!
        io.emit('gameover', masterData.state, masterData.scoring);
        masterData.state.currentPhase = 6; // Hmmmm - game over state !!!
        return;
      } else {
        // Rotate to next player
        masterData.state.currentActivePlayer = masterData.whoIsNexttoPeg( playerName );
        console.log('     Next player to play is : '+ masterData.state.currentActivePlayer);
        io.emit('playerpeggingcomplete', masterData.state, masterData.pegging, masterData.scoring );
      }
    }
  }); 

  socket.on('viewhandcomplete', function(playersName, score) {
    console.log(playersName + ' has taken their score of ' + score);
    // update the master score
    if (masterData.scoring.incrementPlayersScore( masterData.state.activePlayers[ masterData.getActivePlayerIndex(playersName) ].compassSeat, score) ) {
      // Someone has won !!!!
      io.emit('gameover', masterData.state, masterData.scoring);
      return;
    }
    // increment the number of players who have viewed/scored their hand 
    masterData.state.shownHandsCount++;
    // clear any residual public message
    masterData.state.publicmessage = "";
    if (masterData.state.shownHandsCount >= masterData.state.numActivePlayers + 1 ) {
      console.log('     Everyone has taken their scores ...');
      // TO DO - All players have taken thir hand score ... so now we rest to new hand
      masterData.initNewHand();
      dealCards();
      io.emit('nexthand', masterData.state, masterData.scoring);
    } else if (masterData.state.shownHandsCount == masterData.state.numActivePlayers ) {
      // SO all players have taken the score form their hands,
      // but the dealer next to tkae their box
      console.log('     take the box ...');
      io.emit('nextshowhand', masterData.scoring, playersName, true);
    } else {
      // Now tell all the clients to cycle to the next player
      masterData.state.currentActivePlayer = masterData.whoIsNext( playersName );
      console.log('     next person to take is ' + masterData.state.currentActivePlayer);
      io.emit('nextshowhand', masterData.scoring, masterData.state.currentActivePlayer, false);
    }
  });

}; // onConnect(socket)



/**
 * Shuffles the deck and then deals the appropriate number of cards to each active player.
 * 
 * Returns the number of cards left in the deck after the deal ... which will be used to cut for the turn up.
 */
function dealCards() {
  // number of cards dealt to each player determined by the number of players
  let cardCount = 0;
  let cardsperPlayer = 6; // TEMP - adjust for testing pegging
  var cardname;
  if (masterData.state.numActivePlayers==4) { cardsperPlayer = 5; }
  // shuffle the deck
  fulldeck.shuffleDeck();
  // now deal to each player
  for (let p = 0; p < masterData.state.activePlayers.length; p++) {
    console.log('Dealing cards to: ' + masterData.state.activePlayers[p].name );
    let msg="";
    for (let c = 0; c < cardsperPlayer; c++)
    {      
      cardname = fulldeck.dealCard();
      msg = msg + cardname +'; ';

      masterData.state.activePlayers[p].addCardtoHand(cardname);
      cardCount++;
    }
    console.log( '   ' + masterData.state.activePlayers[p].name + ' cards: ' + msg );
  }
  return ( masterData.state.numActivePlayers * cardsperPlayer );
}



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


let handleRequest = (request, response) => {
  response.writeHead(200, {
      'Content-Type': 'text/html'
  });
  fs.readFile('./index.html', null, function (error, data) {
      if (error) {
          response.writeHead(404);
          respone.write('Whoops! File not found!');
      } else {
          response.write(data);
      }
      response.end();
  });
};



var sometext = 'Here is some text I want rendered on the screen';

app.get('/', function (req, res) { 
  // The render method takes the name of the HTML 
  // page to be rendered as input 
  // This page should be in the views folder 
  // in the root directory. 
  // res.render('home', {name: 'Brian'}); 
  res.send('Cribnight Cribbage Server');
  
}); 
  

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

module.exports = app;
