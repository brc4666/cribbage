// *********************************************
// *
// *  INTERNAL MESSAGES
// *
// *********************************************
export const enum MessageType {
    controller = 0,         
    game,
    players,
    cards
 };

 export const enum MessageHeader {
    // controller messages
    disconnection = 10,     // ??? []
    cyclePlayer,            // indicates the current players turn is complete [name]
    // Game messages   
    gameinitialising = 110, // someone (else) has clicked 'Start Game' and the server is preparing the GameData object 
    initgame,               // initialise gameData object with data from server [ServerGameState]
    gamestarted,            // start the game ;-)
    gameover,               // Someone has won !!!
    refreshgame,            // refresh components with data dependant on gameData []
    statusupdate,           // TODO - is it used ? phase of the game has been updated [new GamePhase]
    refreshstate,           // refresh local gameData state object with server data [ ServerGameStatus ]
    // Players messages
    joinedas = 120,         // ??? [name]
    playerjoined,           // anther player joined [name]
    playerleft,             // a player on another connection left [name]
    // Cards messages ... 
    // refreshcards = 130,         // cards in hands need refreshing (includes discard piles) [ name ]
    refreshdiscards = 130,            // cards in discard pile(s) need refreshing [ name ]
    cardDiscarded,              // a player discarded a card [name, screenPosition, card, boolean] 
    refreshplayerscards,        // TODO - is used ? a remote player's hand has been updated [ ServerPlayerInfo ]
    refreshturnup               // refresh turnup component

 };

 export const enum MessagesToServer {
    playerjoining = 'playerjoining',
    playerleft = 'playerleft',
    startgame = 'startgame',                // [ ServerConfigData ] a player clicked start game button 
    discardedtobox = 'discardedtobox',      // [ ServerPlayerInfo ] a player completed the discard to box process
    turnupcard = 'turnupcard',              // [ cardname ] the turnup card has been cut
    playerdiscarded = 'playerdiscarded',    // [ name, cardname ] a player discarded in the pegging phase
    playercannotgo = 'playercannotgo',      // [ name ] player cannot go in the pegging phase
    turncomplete = 'turncomplete',          // [ player name ] the player has completed thier turn
    viewhandcomplete = 'viewhandcomplete'   // [ player name, score ] a player has viewed his hand and taken the points
}

 export const enum MessagesFromServer {
    playerjoining = 'playerjoining',
    playerleft = 'playerleft',
    gameinitialising = 'gameinitialising',   
    gameready = 'gameready',
    nexthand = 'nexthand',                              // [ ServerGameStatus, ServerGameScores ] cycle to start next hand    
    refreshstate = 'refreshstate',                      // [ ServerGameStatus ] refresh entire state object
    refreshplayerscards = 'refreshplayerscards',        // [ ServerPlayerInfo ] a remote player's nad needs updating
    cycleplayer = 'cycleplayer',                        // [ name ] the spcified player has cmpleted their turn
    playerdiscardcomplete = 'playerdiscardcomplete',    // [ name, playerInfo, pegging data ] the players discard has been processed
    turnupcard = 'turnupcard',                          // [ cardname ] what the turn up card is
    playerpeggingcomplete = 'playerpeggingcomplete',    // [ ServerGameStatus, ServerPeggingData, ServerGameScores ] player's turn in pgging phase complete
    startshowhandsequence = 'startshowhandsequence',    // [ ServerGameStatus, ServerPeggingData, ServerGameScores ] end of the pegging phase: start of the show hands phase
    nextshowhand = 'nextshowhand',                      // [ ServerGameScores, nextPlayer, bScoreBox ] Next player to 'take'
    gameover = 'gameover'                               //  [ ServerGameStatus, ServerGameScores ] Someone has won !!
}

export const enum CompassPoints {
    north = 1,
    east,
    south,
    west
}

export const enum ScreenPositions {
    top = 1,
    right,
    bottom,
    left
}

export enum GamePhase {
    unknown,
    dealing,
    discardingToBox,
    cuttingForTurnup,
    pegging,
    showingHands,
    gameover
}