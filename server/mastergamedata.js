

//  *****************************************************************************
//
//  GAME INITIALISATION SEQUENCE
//
//  *****************************************************************************
//
//  One individual client will be responsible for initiating the "Start Game" sequence.
//      NB. We may receive more than one 'start game' message (from doffierent clients).
//          Any clients that send that message should all send the same seed data,
//          but we don;t want the server tripping over itself with multiple 'start game'
//          messages - so we'll only process the first receipt and filter out any subsequent ones
//
//          We should probably further have a 'game initialising' message back to all (?) clients
//          to stop any more trying to 'start game'
//
//  The initialising client will send only a list of partially filled players in the "PotentialPlayers" array.
//  The 'isConnected' member will determine who is to be part of the game ... and each player will have the
//  default compass seat position - which assumes a 4-person game.
//
//  PROCESS FLOW
//  -------------
//
//  A client will send a 'startgame' message, with a MasterConfigData structure 
//  
//  On receipt of the player data, the server will ...
//      First send a 'gameinitialsing' message to all (other?) connections that the game is being initialised
//          (This is to prevent other players initiating the 'start game' process)      
//      Initialise the activePlayers[] with the 'connected'players in the activePlayers[]
//      Check/update compass points for each active player as necessary
//      NB!: Screen positions are different for each client - so they will be resolved & stored locally 
//      Initialise the game score object
//      

//
//
// const MasterGameScores = require('./mastergamescore.js');

class MasterCardinHand {

    constructor ( cardName ) {
        this.card = cardName;
        this.valueofCard = this.getCardValue();
        this.played = false;
        this.showCard = true;
        this.isInVisible = false;
        this.imageFile = this.card + '.png';
    }

    getCardValue() {
        if (this.valueofCard>0)
            return this.valueofCard;

        this.valueofCard = 0;
        if (this.card.length==2) {
            this.valueofCard = 1 + this.cardDenominationIndex;
            if (this.valueofCard > 10) this.valueofCard = 10; 
        }
        return this.valueofCard;
    }

    /** returns the demonation of the card: i.e. '8' or 'j' or 'a' */   
    get cardDenomination() { return this.card.substr(0, 1); }
    get cardDenominationIndex() { return "a23456789tjqk".indexOf(this.card.substr(0, 1)); }

    cardPlayed() {
        this.played = true;
        // this.isVisible = false;
        this.imageFile = 'back.png';
    }

    lookupCardImage(seat) {
        //'./assets/cards/'
        if ( (seat=="E") || (seat=="W") ) {
            // side views never show the face of the card ... only the back ...
            // and then always the same image 
            this.imageFile = 'back-side.png'; 
        } else if ( (true==this.played) || (this.isInVisible) )  {
            this.imageFile = 'back.png';
        } else {
            this.imageFile = this.card + '.png';
        }
    }

}

class MasterPlayerInfo {
    constructor(name, compassSeat) {
        this.name = name;                       // players name
        this.isConnected = false;               // is this player connected
        this.compassSeat = compassSeat;         // compass point of playing position
        this.hand = [];                         // [MasterCardinHand] - the player's hand
        this.discards = [];                     // [string] - list of players discards
    }

    addCardtoHand(cardname) {
        if ( undefined == this.hand ) {
            this.hand = Array.create[ MasterCardinHand(cardname)];
        } else {
            this.hand.push( new MasterCardinHand( cardname ) );
        }
    }

    addCardtoDiscard( cardname ) {
        if ( undefined == this.discards ) {
            this.discards = Array.create[ string ];
        } else {
            this.discards.push( cardname ) ;
        }
    }

    /**
     * Returns the number of cards to be played left in the current players hand 
     */
    cardsRemaining( ) {
        var cardstobePlayed = 0;
        for (let i=0; i< this.hand.length; i++ ) {
            if ( this.hand[i].played == false) {
                cardstobePlayed++;
            }
        }
        return cardstobePlayed;
    }

    clearHand() {
        this.hand.splice(0, this.hand.length);
    }
    clearDiscards() {
        this.discards.splice(0, this.discards.length);
    }
}

class MasterConfigData {    
    constructor() {
        this.isSetup = false;                   // is the game setup
        this.potentialPlayers = [];             // [MasterPlayerInfo] list of possible players (for game setup)
    }
}

class MasterBoxData {
    constructor() {
        this.cards = [];                        // [MasterCardinHand] - cards in box
        this.playersDiscarded = [];             // List of players who have discarded
    }

    clear() {
        this.cards.splice(0, this.cards.length);
        this.playersDiscarded.splice(0, this.playersDiscarded.length);
    }
    addCardtoBox(cardname) {
        this.cards.push( new MasterCardinHand( cardname ) );
    }
    addPlayer( playersName ) {
        let alreadyDiscarded = false;
        for (let i=0; i<this.playersDiscarded.length; i++ ) {
            if (this.playersDiscarded[i].name == playersName) {
                alreadyDiscarded = true;
                break;
            } 
        }
        if (!alreadyDiscarded) {
            this.playersDiscarded.push( playersName );
        }
    }
}



class MasterGameStatus {
    constructor () {
        this.activePlayers = [];                // [MasterPlayerInfo] list of active players
        this.numActivePlayers = 0;              // Number of active players
        this.currentDealer = "";                // name of player who is dealing 
        this.currentActivePlayer = "";          // name of player who's turn it is to do something
        this.currentPhase = 0;                  // current phase of the game
        this.turnup = "";                       // the name of the turn up card
        this.cardsToCut = 0;                    // the number of cards in the deck to cut 
        this.shownHandsCount = 0;               // number of players wh have taken ponts from their hand
        this.publicmessage = "";
    }

    addPlayer (name, seat) {
       this.activePlayers.push( new MasterPlayerInfo(name, seat) );
       this.numActivePlayers ++;
    }

}

class MasterPeggingData {
    constructor() {
        this.cards = [];                        // [MasterCardinHand] - cards in this pegging sequence
        this.total = 0;                         // current pegging sequence total
        this.countCardsPlayed = 0;              // total card played in the entire pegging phase
        this.cardScore = 0;                     // the score the last played card scored
        this.lastPlayer = "";                   // name of last player to add to pegging cards
        this.cantGoList = []                    // list of players who cannot 'go'
        this.scoremsg = "";                     // message to displat to all users explaining the score
    }

    /**
     * Updates the pegging object with specified card
     * 
     * returns the score associated with that card 
     * 
     * @param playerName the name of the player adding the card
     * @param cardinHand the MasterCardinHand object of the card to add 
     * @param lastCard whether this card is the last card in the pegging sequence
     */
    addCard(playerName, cardinHand, lastCard)  {
        this.cardScore = 0;
        this.lastPlayer = playerName;
        this.cards.push(cardinHand);
        this.countCardsPlayed++;
        this.total += cardinHand.getCardValue();
        this.scoremsg = "";

        console.log('      addCard (Pegging)' + cardinHand.card + ' ' + cardinHand.cardDenomination );

        if (this.cards.length >= 2) {
            var submsgs = [];

            if (this.total == 15) {
                this.cardScore += 2;
                submsgs.push ('Fifteen for 2');
            }
            if (this.total == 31) {
                submsgs.push ('31 for 2');
                this.cardScore += 2;
            }
            if  ( (this.cards.length>3) &&
                ( ( this.cards[ this.cards.length - 1 ].cardDenomination ==
                    this.cards[ this.cards.length - 2 ].cardDenomination ) &&
                  ( this.cards[ this.cards.length - 2 ].cardDenomination ==
                    this.cards[ this.cards.length - 3 ].cardDenomination ) &&
                  ( this.cards[ this.cards.length - 3 ].cardDenomination ==
                    this.cards[ this.cards.length - 4 ].cardDenomination ) ) ) {
                this.cardScore += 12; // Four of a kind
                submsgs.push ('12 for Four of a Kind');
            } else if  ( ( this.cards.length>2) &&
                       ( ( this.cards[ this.cards.length - 1 ].cardDenomination ==
                           this.cards[ this.cards.length - 2 ].cardDenomination ) &&
                         ( this.cards[ this.cards.length - 2 ].cardDenomination ==
                           this.cards[ this.cards.length - 3 ].cardDenomination ) ) ) {
                this.cardScore += 6; // Three of a kind
                submsgs.push ('6 for Three of a Kind');
            } else if ( this.cards[ this.cards.length - 1 ].cardDenomination ==
                        this.cards[ this.cards.length - 2 ].cardDenomination ) {
                this.cardScore += 2; // Pair     
                submsgs.push ('2 for a Pair');       
            }

            // Now score the runs !!!!
            var runscore = this.pegRuns();
            if (runscore > 0 ) {
                this.cardScore += runscore;      
                submsgs.push ('Run of ' + runscore);                 
            }

            if ( (lastCard==true) && (this.total < 31) ) {
                this.cardScore += 1; // last card   
                submsgs.push ('1 for last card');   
            }

            if (this.cardScore>0) {
                var fullmsg = playerName + ' pegged:' + this.cardScore;
                if (submsgs.length>0) {
                    fullmsg = fullmsg + ' (';
                    for (let m=0; m<submsgs.length; m++) {
                        fullmsg = fullmsg + submsgs[m];
                        if (m<submsgs.length-1) {
                            fullmsg = fullmsg + '; ';
                        }
                    }
                    fullmsg = fullmsg + ')';
                }
                this.scoremsg = fullmsg;
            }  
            else {
                this.scoremsg = "";
            }

        } else if (lastCard==true) {
            this.cardScore = 1; // last card  
            var fullmsg = playerName + ' pegged: 1 (last card)';
        }
        return ( this.cardScore );
    }
     
    pegRuns( ) {
        if (this.cards.length < 3) {
            // Not enough cards for a run !
            return 0;
        }
        var partialSeq = [];
        var runsscore = 0;

        // For all possible run lengths (i.e. from all cards to just the last 3 ...)
        for (let i=0; i <= this.cards.length - 3; i++) {
            // sort that partial sequence of cards
            partialSeq = this.pegSortHand(this.cards, i);
            // and see if they make a run
            runsscore = this.pegRunHealper(partialSeq);
            if (runsscore>0) {
                // if this partial sequence is a run,
                // we do not need to check any further partial sequences
                break;
            }
        }
        return runsscore;
    }

    pegRunHealper( partial ) {
        var runscore = 0;
        var runlength = partial.length;
        // Check to any duplicates in the part of the card sequence we are interested in 
        var foundDuplicate = false;
        for (let i=0; i < partial.length - 2; i++) {
            if ( partial[i].cardDenomination == partial[i+1].cardDenomination ) {
                foundDuplicate = true;
                break;
            }
        }
        if (foundDuplicate) {
            // If we have checked over the last runlength cards
            // and there is a duplicate (ie. pair) ... we do not have a run
            return runscore;
        }

        // if the last card played less the csrd runlength indexes prior equals runlength-1 ... we have a run
        if ( partial[ partial.length -1 ].cardDenominationIndex - partial[0].cardDenominationIndex == runlength-1 ) {
            runscore = runlength;
        }

        return runscore;
    }

    /**
     * Returns a sorted MasterCardinHand[] of the part of the paramter MasterCardinHand[] 
     * from the starting index to the end
     */
    pegSortHand(pegcards, startIndex ) {
        var inserted = false;
        var sortedHand = [];
        // Add the cards from the pegCards[] into sortedHand[] in the correct place
        for (let i=startIndex; i < pegcards.length; i++) {
            inserted = false;
            for ( let j=0; j < sortedHand.length ; j++) {
                if ( pegcards[i].cardDenominationIndex <= sortedHand[j].cardDenominationIndex ) {
                    // Insert card from pegged cards before the current sortedHand index
                    sortedHand.splice(j,0, pegcards[i]);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                sortedHand.push( pegcards[i] );
            }
        }
        return sortedHand;
    }
    
    /**
     * Updates the scores for the player who played last to reflect last card
     */
    scoreLastCard() {
        this.scoremsg = this.lastPlayer + ' pegged 1: (last card)';
        this.cardScore = 1;
    }

    clearPeggingComplete() {
        // Reset the running total 
        // (but NOT the card score nor the msg, as we need these in tact for both 
        //    the main server to update the score
        //    AND the client to display the message
        this.total = 0;
        // Clear the list of players who cannot go
        this.cantGoList.splice(0, this.cantGoList.length);
        // Clear the played cards array
        this.cards.splice(0, this.cards.length);
    }

    initNewHand() {
        this.cardScore = 0;
        this.lastPlayer = "";
        this.countCardsPlayed = 0;
        this.total = 0;
        // Clear the list of players who cannot go
        this.cantGoList.splice(0, this.cantGoList.length);
        // Clear the played cards array
        this.cards.splice(0, this.cards.length);
    }
}

class MasterPlayerScore {
    constructor() {
        this.seats = "";                     // compass point seats to which this score applies
        this.displayname = "";               // dislay name for this player or team
        this.score = 0;                      // current score
    }
}
    
class MasterGameScores {
    constructor() {
        this.playerScores = [];
        this.playerScores.push( new MasterPlayerScore() );
        this.playerScores.push( new MasterPlayerScore() );
    }

    initPlayersScore( scoreIndex, seats, displayname) {
        this.playerScores[scoreIndex].seats = seats;
        this.playerScores[scoreIndex].displayname = displayname;
    }

    /**
     * Increments the master score total for the player at the specified compass position
     * Return true if that player was won.
     * 
     * @param {} compassSeat the compass position of the player who scored
     * @param {} incScore the players incremental score
     */
    incrementPlayersScore(compassSeat, incScore) {
        for (let p = 0; p < this.playerScores.length; p++ ) {
            if ( this.playerScores[p].seats.indexOf(compassSeat) >-1 ) {
                this.playerScores[p].score += incScore;
                return ( this.playerScores[p].score >=121 ) ;
                break;
            }
        }
        return false;
        
    }

    hasSomeoneWon() {
        return ( (this.playerScores[0].score >= 121) || (this.playerScores[1].score >= 121) );
    }
}

class MasterGameData{
    constructor() {
        // config/Setup info .
        this.config = new MasterConfigData;
        // player information ...
        this.state = new MasterGameStatus;
        this.pegging = new MasterPeggingData;
        // General game information
        this.scoring = new MasterGameScores;
        this.theBox  = new MasterBoxData;       
    }

    whoIsNext(afterwho) {
        // Find the next player whose turn it is.
        // We do this off the paramter name and thier compass point
        // This is because the order of players in the activePlayers[] is not
        // guaranteed to be in sequence <sigh>
        let index = this.getActivePlayerIndex( afterwho );
        if (index>-1) {
            let compassPoint = this.state.activePlayers[index].compassSeat;
            let compassPoints = ["N","E","S","W"];
            let cpIndex = compassPoints.indexOf( compassPoint );
            (this.state.numActivePlayers==2) ? cpIndex+=2 : cpIndex++
            if (cpIndex>=compassPoints.length) { cpIndex -= compassPoints.length };
            return this.playerAtCompassPoint( compassPoints[cpIndex] );
        }
    }

    getActivePlayerIndex(name) {
        for (let i = 0; i < this.state.activePlayers.length; i++) {
            if (this.state.activePlayers[i].name == name) {
                return i;
            }
        }
        return -1;
    }

    playerAtCompassPoint(compassPoint) {
        let retval = "";
        for (let i = 0; i < this.state.activePlayers.length; i++) {
            if (this.state.activePlayers[i].compassSeat==compassPoint) {
                retval = this.state.activePlayers[i].name;
            }
        }  
        return retval;    
    }

    /**
     * Reset the master game data to initial state
     */
    reset() {
        this.state.numActivePlayers = 0;

    }

    /**
     * Clears down the masterData object as preparation for the next hand
     */
    initNewHand() {
        // Clear each players hand & discard pile
        for (let p=0; p < this.state.numActivePlayers; p++) {
            this.state.activePlayers[p].clearHand();
            this.state.activePlayers[p].clearDiscards();
        }
        // Now clear the box
        this.theBox.clear();
        // and the turn up
        this.state.turnup = "";
        // and the pegging object
        this.pegging.initNewHand();
        // Tidy up any other vaarious bits and pieces
        this.state.publicmessage = "";
        this.state.shownHandsCount = 0;
        // Rotate dealer and set the active player
        this.state.currentDealer = this.whoIsNext( this.state.currentDealer );
        this.state.currentActivePlayer = this.whoIsNext( this.state.currentDealer );
        // Change gameStatues to disarding to box
        this.state.currentPhase = 2;
    }

    /* ***********************************************************************************************
     *
     *              PEGGING FUNCTIONS
     * 
     * 
     *  
    *************************************************************************************************/

    /**
     * Process to handle a player playing a card during the pegging phase
     * Returns true if pegging phase is over
     * @param {*} playername 
     * @param {*} cardName 
     */
    playerPlayedPegCard( playerName, cardName ) {
        var cardIndex = -1;
        // find the card in the players hand ...
        var playerIndex = this.getActivePlayerIndex( playerName );
        if (playerIndex>-1) {     
            for (let c=0; c< this.state.activePlayers[playerIndex].hand.length; c++) {
                if (this.state.activePlayers[playerIndex].hand[c].card == cardName ) {
                cardIndex = c;
                break;
                }
            }
        }
        if (cardIndex>-1) {
            // We found the card, so ...
            // flag the card as played
            this.state.activePlayers[playerIndex].hand[cardIndex].played = true;
            // add the card to the players discard pile
            this.state.activePlayers[playerIndex].discards.push( cardName );
            // before we calcualte the score (if any) of that card,
            // we are going to work out if htat was the last card.
            // Either that can be played ... or the last card of the entire pegging sequence
            var lastCard = false;
            var noMoreCards = ( this.pegging.countCardsPlayed + 1 >= (4 * this.state.numActivePlayers) );
            if (!noMoreCards) {
                // There are more cards yet to be played ... but check if any of them go !!!!
                lastCard = this.countAsLastCard( this.pegging.total + this.state.activePlayers[playerIndex].hand[cardIndex].valueofCard  );
            } else {
                console.log ('     This appears to be the very last card');
                lastCard = true;
            }

            // and to the pegging object
            this.pegging.addCard( playerName,  this.state.activePlayers[playerIndex].hand[cardIndex], lastCard);
            console.log( '     Peg total =' + this.pegging.total);

            // Update any score scored via this function 
            // and the public message
            this.scoring.incrementPlayersScore( this.state.activePlayers[this.getActivePlayerIndex(this.pegging.lastPlayer)].compassSeat, this.pegging.cardScore);
            this.state.publicmessage = this.pegging.scoremsg;

            // Having done all that ... now we can work out what to do next ;-)
            if ( (this.pegging.total == 31) || (lastCard==true) ) {
                // reset everything as we've either reached 31 or that was the last card in current sequence
                this.PeggingHandComplete();
                // Check that there are some cards still to play
                if ( this.pegging.countCardsPlayed >= (4 * this.state.numActivePlayers) ) {
                    // Nope - eveyone has laid all their cards !
                    this.PeggingPhaseComplete(1);
                    return true;
                } else {
                    // More cards left to be played, so work out who is next ...
                    this.state.currentActivePlayer = this.whoIsNexttoPeg(playerName);
                    console.log('     Cycling to next player with cards left: ' + this.state.currentActivePlayer);                  
                }
            /*
            } else if ( this.pegging.countCardsPlayed >= (4 * this.state.numActivePlayers) ) {
                // Haven't hit 31 yet, but there are no more cards left to be played, so ...
                // Score for the last card 
                console.log('     No more cards to play (1) ... scoring last card');
                this.pegging.scoreLastCard();
                // clear everyone's discard arrays
                this.PeggingPhaseComplete(2);
                return true;  */
            } else {
                // Not 31 and more cards left to be played, so work out who is next ...
                this.state.currentActivePlayer = this.whoIsNexttoPeg(playerName);
                console.log('     Cycling to next player with cards left: ' + this.state.currentActivePlayer);
            }
        }

        return false;
    }

    /** 
     * Updates the masterGameData object given the specified player cannot 'go'
     * Returns true if pegging phase complete
     * 
     * @param {} playerName 
     */
    playerCantGo( playerName ) {
        // add players name to list of those who cannot play.
        // should not already be there ... but we'd better check
        this.state.publicmessage = "";
        if (this.pegging.cantGoList.indexOf( playerName ) < 0 ) {
            this.pegging.cantGoList.push( playerName ); 
        }
        if ( this.pegging.cantGoList.length == this.state.numActivePlayers) {
            console.log('     All players have passed.');
            // Update the score as someone must have had the last card
            console.log('     Scoring for last card: ' + this.pegging.lastPlayer);
            this.pegging.scoreLastCard();
            
            // check to see if the pegging phase is over 
            var totalCardstobePlayed = 4 * this.state.numActivePlayers ;
            if ( this.pegging.countCardsPlayed >= totalCardstobePlayed ) {
                // No more cards to play ... so cycle to next phase of game
                this.PeggingPhaseComplete(3);
                return true;
            } else {
                // reset everything as everyone has passed so prepare for next hand
                console.log('     Current pegging hand complete' );
                this.PeggingHandComplete();
                // Set active player to the next payer who still has some cards to play
                this.state.currentActivePlayer = this.whoIsNexttoPeg( playerName );
                console.log('     Cycling to next player.' + this.state.currentActivePlayer);
            }
        } else {
            // more players left with cards to play
            // Set active player to the next player who still has some cards to play
            this.state.currentActivePlayer = this.whoIsNexttoPeg( playerName );
            console.log('     Not everyone has passed: Cycling to next player.' + this.state.currentActivePlayer);
            if ( this.state.currentActivePlayer == playerName ) {
                console.log( '          Next player is player who just passed, so hand must be over');
                // The next player with cards left ... is the same player who just passed !
                // Which means they may have cards, but none of them are playable.
                // so make sure last card is scored
                this.pegging.scoreLastCard();
                // and flag the hand as complete
                this.PeggingHandComplete();
            }
        }

        // Update any score scored via this function 
        // and the public message
        this.scoring.incrementPlayersScore( this.state.activePlayers[this.getActivePlayerIndex(this.pegging.lastPlayer)].compassSeat, this.pegging.cardScore);
        this.state.publicmessage = this.pegging.scoremsg;
        return false;
    }

    PeggingPhaseComplete( debugId ) {
        console.log('     All cards have been played (' + debugId + ') ! End of Pegging phase.');
        // clear everyone's discard arrays
        for (let p = 0; p < this.state.activePlayers.length; p++) {
            this.state.activePlayers[p].clearDiscards();
        }
        // No more cards to play ... so ...
        /* handled by main server function !!!!
        // Advance game status
        this.state.currentPhase++;
        // and reset who is next to do something - the person after the dealer
        this.state.currentActivePlayer = this.whoIsNext( this.state.currentDealer );
        console.log('     Next player:' + this.state.currentActivePlayer);
        */
    }

    PeggingHandComplete() {
        // clear everyone's discard arrays
        for (let p = 0; p < this.state.activePlayers.length; p++) {
            this.state.activePlayers[p].clearDiscards();
        }
        // Reset pegging total
        this.pegging.clearPeggingComplete();
    }

    /**
     * Returns the name of the next player to play a card in the pegging phase 
     * (as we need to skip those players who do not have any more cards to play)
     * @param {*} afterwho 
     */
    whoIsNexttoPeg( afterwho ) {
        var nextPlayer = afterwho;
        var playerCount = 0;
        // Cycle to next player and repeat if the 'nextplayer' ...
        //      has no more cards to play; OR
        //      has already 'Go'd in the cycle; AND
        //      we haven't iterated over every player.
        do {
            nextPlayer= this.whoIsNext( nextPlayer );
            playerCount++
        } while ( ( ( this.state.activePlayers[this.getActivePlayerIndex(nextPlayer)].cardsRemaining() <=0 ) 
                      || ( this.pegging.cantGoList.indexOf( nextPlayer ) > -1) )
                 && (playerCount< this.state.numActivePlayers) ) ;
        return nextPlayer;
    }

    /**
     * Determines if any player has a card remaining that can be played. 
     * Returns true if 
     *      a. no player has got a card that can be played; AND
     *      b. any player with cards has already passed 
     * @param {} currentTotal current total of the cards in the current pegging sequence
     */
    countAsLastCard(currentTotal) {
        var playerHasCardsRemaining;
        // var playerCanGo;
        var playersName;
        
        //For each player .. 
        for (let p = 0; p < this.state.activePlayers.length; p++) {
            playersName =  this.state.activePlayers[p].name;
            // See if this player has already passed.
            // If they have, we don't need to check anything further for this player
            // but just move on to next player.
            if (this.pegging.cantGoList.indexOf( playersName ) < 0 ) {
                // iterate over hand to see if there is a non-played card that can be played
                // AND that player has not yet passed
                playerHasCardsRemaining = false;
                // playerCanGo = false;
                for (let c=0; c < this.state.activePlayers[p].hand.length; c++ ) {
                    if (this.state.activePlayers[p].hand[c].played == false) {
                        playerHasCardsRemaining = true;
                        break;
                        //if (this.state.activePlayers[p].hand[c].valueofCard <= (31 - currentTotal) )) {
                        //    playerCanGo = true;
                        //    break;
                        // }
                    }
                }
                // Now we known the status of the hand 
                if ( (playerHasCardsRemaining) /* && (playerCanGo) */ ) {
                    // the player does have cards ... and has not yet passed ... so
                    // we cannot (yet) declare the current state as the last card.
                    return false;
                }
            }
        }
        return true;
    }

}

module.exports = MasterGameData;