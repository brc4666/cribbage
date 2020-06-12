import * as cloneDeep from 'lodash/cloneDeep';

import { CardinHand, DiscardedCard } from './cardinhand';

import { GamePhase } from './common';

import { ServerGameData, ServerPeggingData, ServerConfigData, ServerGameStatus, ServerPlayerInfo, ServerBoxData, ServerGameScores} from './serverdata';
import { environment } from 'src/environments/environment';

export class PlayerInfo {
    private data: ServerPlayerInfo;
    screenposition: string;             // top, left, right, bottom
    constructor(name: string, compassSeat: string) {
        this.data = new ServerPlayerInfo(name, compassSeat);
        this.screenposition = "";
    }
    get compassSeat() : string { return this.data.compassSeat; }
    set compassSeat(newValue: string) { this.data.compassSeat = newValue; }
    get name() : string { return this.data.name; }
    get hand() : CardinHand[] { return this.data.hand; }
    get discards() : string[] { return this.data.discards; }
    AddPlayer(name: string, compassSeat: string, cards: CardinHand[])
    {

    }
}

export class PlayersScore {
    seats: string;
    displayname: string;
    score: number;
    constructor() {
        this.seats = "";                     // compass point seats to which this score applies
        this.displayname = "";               // dislay name for this player or team
        this.score = 0;                      // current score
    }
}

export class GameScores {
    playerScores: PlayersScore[];

    constructor() {
        this.playerScores = [];
        this.playerScores.push( new PlayersScore() );
        this.playerScores.push( new PlayersScore() );
    }

    initPlayersScore( scoreIndex :number, seats :string , displayname :string ) {
        this.playerScores[scoreIndex].seats = seats;
        this.playerScores[scoreIndex].displayname = displayname;
        this.playerScores[scoreIndex].score = 0;
    }

    applyServerScores( serverScores: ServerGameScores ){
        this.playerScores[0].score = serverScores.playerScores[0].score;
        this.playerScores[1].score = serverScores.playerScores[1].score;
    }

    incrementPlayersScore(compassSeat :string, incScore :number) {
        let si = this.getScoreIndex(compassSeat);
        if (si>-1) {
            this.playerScores[si].score += incScore
        }
    }

    getScoreIndex( compassSeat :string) : number {
        for (let p = 0; p < this.playerScores.length; p++ ) {
            if ( this.playerScores[p].seats.indexOf(compassSeat) >-1 ) {
                return p;
            }
        }
        return -1;
    }
    getScore(scoreIndex :number) : number { return this.playerScores[scoreIndex].score };
    getDisplayName(scoreIndex :number) : string { return this.playerScores[scoreIndex].displayname};

    isWinning(scoreIndex :number) : Boolean {
        var otherIndex = 0;
        (scoreIndex==0) ? otherIndex = 1 : otherIndex = 0
        return (  (this.getScore(scoreIndex) > this.getScore(otherIndex) ) );
    }
    isLosing(scoreIndex :number) : Boolean {
        var otherIndex = 0;
        (scoreIndex==0) ? otherIndex = 1 : otherIndex = 0
        return (  (this.getScore(scoreIndex) < this.getScore(otherIndex) ) );
    }
}

class Box {
    private data: ServerBoxData = new ServerBoxData;

    constructor() { }
    
    applyServerBox( serverBox: ServerBoxData ) {
        this.data.playersDiscardedCount = serverBox.playersDiscardedCount;
        this.data.cards.splice(0, this.data.cards.length);
        for (let c = 0; c < serverBox.cards.length; c++ ) {
            this.data.cards.push( serverBox.cards[c]); 
        }
    }
    
    // TO DO - Do we need any of these ????
    AddCardtoBox(card: CardinHand)
    {
        this.data.cards.push( card );
    }

    haveAllPlayersDiscarded(numActivePlayers: number) : boolean {
        return (numActivePlayers==this.data.playersDiscardedCount);
    }

    get cards() : CardinHand[] { return this.data.cards; }
    
    PlayersDiscardsComplete() {
        this.data.playersDiscardedCount++;
    }

    ResetBox() {
        this.data.cards.splice(0,this.data.cards.length);
        this.data.playersDiscardedCount = 0;
    }
}

class Config {
    private data: ServerConfigData = new ServerConfigData;
    get isSetup(): boolean { return this.data.isSetup; }
    set isSetup(newValue: boolean) { this.data.isSetup = newValue; }
    get potentialPlayers() : ServerPlayerInfo[] { return this.data.potentialPlayers; }
    get dataforServer(): ServerConfigData { return this.data };

    addPotentialPlayer(name: string, defaultSeat: string) {
        // TO DO ... shouldn't this only be done on the server ????
        this.data.potentialPlayers.push(new ServerPlayerInfo(name,defaultSeat));
    }

    updateServerData( scd :ServerConfigData ) {
        this.data.isSetup = scd.isSetup;
    }
}

class GamePeggingInfo {
    private data: ServerPeggingData;

    constructor() {
        this.data = new ServerPeggingData();
    }

    get currentTotal() : number { return this.data.total; } 
    get cardScore(): number { return this.data.cardScore; }
    get lastPlayer() : string { return this.data.lastPlayer; }
    get peggingMessage() : string { return this.data.scoremsg; }

    applyServerData( newServerData :ServerPeggingData ) {
        this.data = newServerData;
    }

    debug_forcepeggingtotal( total ) {
        return this.data.total = total;
    }

    /*
    addPeggingCard(newCard: CardinHand) : number {
        var score = 0;
        this.data.cards.push( newCard );
        this.data.total += newCard.valueofCard;
        score = this.calcPegScore();
        return score;
    }
    */

    /*
    private calcPegScore() : number {
        var score = 0;
        if (this.data.cards.length>1) {
            if (this.data.total == 15 ) {
                score += 2; // Fifteen
            }
            if  ( (this.data.cards.length>2) &&
                  ( this.data.cards[ this.data.cards.length - 1 ].cardDenomination ==
                    this.data.cards[ this.data.cards.length - 2 ].cardDenomination ) &&
                  ( this.data.cards[ this.data.cards.length - 2 ].cardDenomination ==
                    this.data.cards[ this.data.cards.length - 3 ].cardDenomination ) ) {
                score += 6; // Three of a kind
            } else if ( this.data.cards[ this.data.cards.length -1 ].cardDenomination ==
                        this.data.cards[ this.data.cards.length - 2 ].cardDenomination ) {
                        score += 2; // Pair            
            }
            if (this.data.total == 31 ) {
                score += 2;
            }
        }
        return score;
    }
    */

}

class GameStatus {
    private data: ServerGameStatus;
    screenposition: string[];
    constructor () {
        this.data = new ServerGameStatus;
        this.screenposition = [];
    }

    get currentPhase() : GamePhase { return this.data.currentPhase; }
    set currentPhase(newPhase: GamePhase) { this.data.currentPhase = newPhase; }
    set currentDealer( name: string) { this.data.currentDealer = name; }
    get currentDealer() : string { return this.data.currentDealer; }
    get currentActivePlayer() : string { return this.data.currentActivePlayer;  }
    set currentActivePlayer(name: string) { this.data.currentActivePlayer = name;  }
    get numActivePlayers() : number { return this.data.numActivePlayers; }
    set numActivePlayers(numPlayers: number) { this.data.numActivePlayers = numPlayers; }
    get requiredDiscardsforBox() : number {
        if (this.data.numActivePlayers==2) { return 2;} else { return 1; }
    }
    set turnUpCard ( cardname: string) { this.data.turnup = cardname; }
    get turnUpCard() : string { return this.data.turnup; }
    get turnUpCardImage() : string {
        if ( ""==this.data.turnup ) {
            return "back.png";
        } else {
            return this.data.turnup + ".png";
        }
    };
    get cardsToCut() : number { return this.data.cardsToCut; }
    set cardsToCut( num : number ) {this.data.cardsToCut = num; }
    get publicMessage() : string { return this.data.publicmessage; }
    set publicMessage( msg : string ) {  this.data.publicmessage = msg; }

    getDiscards(playerIndex: number) : string[] { return this.data.activePlayers[playerIndex].discards; }
    get activePlayers() : ServerPlayerInfo[] { return this.data.activePlayers; } 

    applyServerState( serverData :ServerGameStatus ) {
        this.applyServerPlayerData( serverData );
        for (let i=0; i < this.data.numActivePlayers; i++) {
            this.applyServerPlayersCards( serverData.activePlayers[i], i );
        }
    }   

    applyServerPlayerData( serverData :ServerGameStatus ) {
        this.data.numActivePlayers = serverData.numActivePlayers;
        this.data.currentPhase = serverData.currentPhase;
        this.data.currentDealer = serverData.currentDealer;
        this.data.currentActivePlayer = serverData.currentActivePlayer;
        this.data.turnup = serverData.turnup;
        this.data.cardsToCut = serverData.cardsToCut;
        this.data.publicmessage = serverData.publicmessage;

        // Mannualy copy over player info because the the hand confusion
        this.data.activePlayers.splice(0, this.data.activePlayers.length);
        for (let i=0; i < serverData.activePlayers.length; i++) {
            var newPlayer = new ServerPlayerInfo(  serverData.activePlayers[i].name,  serverData.activePlayers[i].compassSeat );
            newPlayer.isConnected = serverData.activePlayers[i].isConnected;
            this.data.activePlayers.push( newPlayer );
        }
    }

    applyServerPlayersCards( newPlayerInfo :ServerPlayerInfo, playerIndex :number, forceShowCards :boolean = false ) {
        // Determine if the card faces will be shown to the user 
        let showCards = ( (this.screenposition[playerIndex] == "bottom") || (forceShowCards==true) ) ;
        if ( (environment.DEBUG==true) && (this.screenposition[playerIndex] == "top") ) {
            showCards = true;
        }
        // now transfer over the cards and set any local variables at the same time
        this.data.activePlayers[playerIndex].hand.splice(0, this.data.activePlayers[playerIndex].hand.length);
        for( let j=0; j < newPlayerInfo.hand.length; j++) {
            var acard = new CardinHand(newPlayerInfo.hand[j].card, showCards, false );
            acard.played = newPlayerInfo.hand[j].played;
            acard.updateCardImage(this.screenposition[playerIndex]);
            this.data.activePlayers[playerIndex].hand.push( acard );
        }
        // Now transfer over the discards array (cloneDeep ?)
        this.data.activePlayers[playerIndex].discards.splice(0, this.data.activePlayers[playerIndex].discards.length);
        for ( let j=0;j<newPlayerInfo.discards.length; j++) {
            this.data.activePlayers[playerIndex].discards.push (newPlayerInfo.discards[j])
        }
    } 

    clearAllDiscards( ) {
        for (let i=0; i < this.activePlayers.length; i++) {
            this.activePlayers[i].discards.splice(0, this.activePlayers[i].discards.length);
        }
    }

    canPlayerGo( playerIndex : number, currentTotal: number ) : boolean {
        var maxCardValue = 31 - currentTotal;
        for (let c=0; c < this.data.activePlayers[playerIndex].hand.length; c++) {
            if ( (!this.data.activePlayers[playerIndex].hand[c].played) && ( this.data.activePlayers[playerIndex].hand[c].cardValue <= maxCardValue ) ) {
                return true;
            }
        }
        return false;
    }

    addActivePlayer(name: string, seat: string ) : number {
        let newIndex = this.data.activePlayers.push(new ServerPlayerInfo(name,seat)) - 1;
        this.data.numActivePlayers = this.data.activePlayers.length;
        return newIndex;
    }

    addPlayersHand_debug( playerIndex: number, hand: CardinHand[]) {
        this.data.activePlayers[playerIndex].hand = hand.slice();
    }

    /**
     * Updates the local activePlayers[] hand information with data received from server
     * 
     * @param playerInfo - updated player info received back from server
     */
    applyServerHand( playerInfo :ServerPlayerInfo) {
        // Fnd the inedx of the player in the local array
        let playerIndex = -1;
        for (let i=0; i< this.activePlayers.length; i++) {
            if (this.activePlayers[i].name == playerInfo.name ) {
                playerIndex = i;
                break;
            }
        }
        if (playerIndex>-1) {
            // now iterate over local players hand,
            // see the card exists in the server hand ..
            // if not ... remove it from the local hand
            for (let lc=0; lc< this.activePlayers[playerIndex].hand.length; lc++) {
                let foundCard = false;
                for (let sc=0; sc< playerInfo.hand.length; sc++) {
                    if (this.activePlayers[playerIndex].hand[lc].card == playerInfo.hand[sc].card) {
                        foundCard = true;
                        break;
                    }
                }
                if (!foundCard) {
                    this.activePlayers[playerIndex].hand.splice(lc, 1);
                }
            }
        }
    }
}

export class GameData{
    // Local (i.e. unshared data)
    serverAddress: string = "";
    // serverPort: string = "";
    whoAmI: string = "";                
    scoreBox: boolean = false;
    gameoverComment: string = "";

    // config/Setup info ...
    config: Config = new Config;

    // player information ...
    state: GameStatus = new GameStatus;
    // General game information
    scoring: GameScores = new GameScores;
    theBox: Box = new Box;
    pegging: GamePeggingInfo = new GamePeggingInfo;

    constructor() { 
        this.config.isSetup = false;
    }

    addPotentialPlayer(name: string, defaultSeat: string) {
        this.config.addPotentialPlayer(name, defaultSeat);
    }

    //  Initialises the local GameData object with data from the server at the start of a game.
    //  The server will have received the config data to initialise the game and that won't change
    //  What the server will have done is have created ... 
    //      the list of active players,
    //      the score objects,
    //      and randomy assigned a dealer.
    initialiseGame( serverGameData: ServerGameData) {
        // Add/refresh scores
        // this.scores.splice(0, this.scores.length);
        if (serverGameData.scoring.playerScores.length == 2) {
            this.scoring.initPlayersScore( 0, serverGameData.scoring.playerScores[0].seats, 
                                              serverGameData.scoring.playerScores[0].displayname);
            this.scoring.initPlayersScore( 1, serverGameData.scoring.playerScores[1].seats, 
                                            serverGameData.scoring.playerScores[1].displayname);
        }
        // Update player information  
        this.state.applyServerPlayerData( serverGameData.state );
        // determine which player is active
        this.state.currentActivePlayer = this.whoIsNext(this.state.currentDealer);
        // Work out who is placed where on this player's screen
        this.assignScreenPoints();

        // Update each players hand of cards
        for ( let i=0; i < this.state.numActivePlayers; i++ ) {
            this.state.applyServerPlayersCards( serverGameData.state.activePlayers[i], i, false );
        } 
   
        // confirm the local gamedata object is setup 
        this.config.isSetup = true;
    }

    debugSetup() {
        let index = 0;

        this.state.activePlayers.splice(0, this.state.activePlayers.length);

        index = this.state.addActivePlayer("Brian", "S"); 
        let BriansCards = ['9s','7c','tc','kc','3c','js'];
        let Brianshand = [];
        for (let i=0; i<6 ; i++) {
            Brianshand.push( new CardinHand(BriansCards[i], true));
            if ( ( environment.DEBUG_LAYOUT == true) && (i < 2) ) {
                this.addCardtoDiscardPile("Brian", BriansCards[i]);
            }
        }
        this.state.addPlayersHand_debug(index, Brianshand);

        index = this.state.addActivePlayer("Kate", "N");
        let Kateshand = [];
        Kateshand.push( new CardinHand('as', true));
        Kateshand.push( new CardinHand('5d', true));
        Kateshand.push( new CardinHand('6h', true));
        Kateshand.push( new CardinHand('jh', true));
        Kateshand.push( new CardinHand('4s', true));
        Kateshand.push( new CardinHand('js', true));
        this.state.addPlayersHand_debug(index, Kateshand);
        if ( environment.DEBUG_LAYOUT == true) {
            this.addCardtoDiscardPile("Kate","ad");
        }

        this.state.numActivePlayers = 2;
        if (environment.DEBUG_NUMPLAYERS==4) {
            let Matthewshand = [];
            Matthewshand.push( new CardinHand('9s', false));
            Matthewshand.push( new CardinHand('7c', false));
            Matthewshand.push( new CardinHand('tc', false));
            Matthewshand.push( new CardinHand('kc', false));
            Matthewshand.push( new CardinHand('3c', false));
            index = this.state.addActivePlayer("Matthew", "W");
            this.state.addPlayersHand_debug(index, Matthewshand);
    
            let Melshand = [];
            Melshand.push( new CardinHand('as', false));
            Melshand.push( new CardinHand('5d', false));
            Melshand.push( new CardinHand('6h', false));
            Melshand.push( new CardinHand('jh', false));
            Melshand.push( new CardinHand('4s', false));
            index = this.state.addActivePlayer("Melanie", "E");
            this.state.addPlayersHand_debug(index, Melshand);
        
            this.state.numActivePlayers = 4;
        }

        if ( environment.DEBUG_LAYOUT == true) {
            this.state.turnUpCard = "ks";
            this.state.publicMessage = "Pegging messages go here !";
            this.pegging.debug_forcepeggingtotal ( 22 );
        }
     
        this.setwhoIAm("Brian")
        // Work out who is placed where on this player's screen
        this.assignScreenPoints();
        // Initialise scores
        this.debug_initScores();
        // Initialise dealer
        this.state.currentDealer = "Brian";
        // determine which player is active
        this.state.currentActivePlayer = "Brian";
        this.state.cardsToCut = 52 - 12;

    }

    setwhoIAm(name:string) {
        this.whoAmI = name;
    }

    ChangePlayer() : string {
        this.state.currentActivePlayer = this.whoIsNext( this.state.currentActivePlayer);
        return this.state.currentActivePlayer;
    }

    private assignScreenPoints() {
        // Now sort out the relative position of each player (top, left, right, bottom)
        // All we know at the moment is who is sitting at which compass point. 
        // NB. 'this' player will always be at the bottom of the screen - i.e. bottom
        let compassPoints = [];
        let screenPoints = [];
        if (this.state.numActivePlayers == 4) {
            compassPoints = ["N","E","S","W"];
            screenPoints = ["top","right","bottom","left"];
        } else {
            compassPoints = ["N", "S"];
            screenPoints = ["top", "bottom"];
        }
        let myCompassPoint = 0;
        let myScreenPoint = 0;
        let pointOffset = 0;
        let myIndex = this.getActivePlayerIndex(this.whoAmI);
        if (myIndex>-1) {
            // so record my compass point me new screen point (which will be 2 as I am sitting at the bottom)
            myCompassPoint = compassPoints.indexOf(this.state.activePlayers[myIndex].compassSeat);
            this.state.screenposition[myIndex]= "bottom";
            myScreenPoint = screenPoints.indexOf(this.state.screenposition[myIndex]);
            // So now we know the offset between my compass point and my screen position
            pointOffset = myScreenPoint - myCompassPoint;
            if (pointOffset<0)
               pointOffset += compassPoints.length;
            // and we can apply this to the other players to determine their screen position
            for (let i=0; i< this.state.activePlayers.length; i++) {
                if (i!=myIndex) {
                    // get this players compasspoint ... apply the offset ... and set their screeen position
                    let playerCompassPoint = compassPoints.indexOf(this.state.activePlayers[i].compassSeat);
                    let playerScreenPoint = playerCompassPoint + pointOffset;
                    if (playerScreenPoint>=screenPoints.length)
                        playerScreenPoint -= screenPoints.length;
                    this.state.screenposition[i] = screenPoints[playerScreenPoint];
                }
            }

        } else {
            // TODO
            // oh darn it !!! whoami is not in the list of active players !!!  
        }
    }

    private debug_initScores() {
        if (2==this.state.numActivePlayers) {
            this.scoring.initPlayersScore( 0, "N", this.playerAtCompassPoint("N") );
            this.scoring.initPlayersScore( 1, "S", this.playerAtCompassPoint("S") );
        } else if (4==this.state.numActivePlayers) {
            if ( (this.playerAtCompassPoint("N")=="Kate") && (this.playerAtCompassPoint("S")=="Brian") ) {
                this.scoring.initPlayersScore( 0, "NS", "Flamers" );
                this.scoring.initPlayersScore( 1, "EW", "M&Ms" ); 
            } else {
                this.scoring.initPlayersScore( 0, "NS", "N / S" );
                this.scoring.initPlayersScore( 1, "EW", "E / W" );   
            }
        }
    }

    private playerAtCompassPoint(compassPoint: string) : string {
        let retval = "";
        for (let i = 0; i < this.state.activePlayers.length; i++) {
            if (this.state.activePlayers[i].compassSeat==compassPoint) {
                retval = this.state.activePlayers[i].name;
            }
        }  
        return retval;    
    }

    whoIsSeatedAt(screenPoint: string) : string {
        let retval = "";
        for (let i = 0; i < this.state.activePlayers.length; i++) {
            if (this.state.screenposition[i]==screenPoint) {
                retval = this.state.activePlayers[i].name;
                break;
            }
        }  
        return retval;    
    }

    playersCompassPoint(name: string) : string {
        let retval = "";
        for (let i = 0; i < this.state.activePlayers.length; i++) {
            if (this.state.activePlayers[i].name==name) {
                retval = this.state.activePlayers[i].compassSeat;
            }
        }  
        return retval;        
    }

    whoIsNext(afterwho: string ): string {
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

    /*
    nextDealer(): string {
        let nextDealerIndex=0;
        for (let i = 0; i < this.state.activePlayers.length; i++) {
            if (this.state.activePlayers[i].isDealer) {
                nextDealerIndex=i;
                if (nextDealerIndex > this.state.numActivePlayers) {
                    nextDealerIndex = 1;
                }
                this.state.activePlayers[nextDealerIndex].isDealer = true;
                break;
            }
        }
        return this.state.activePlayers[nextDealerIndex].name;
    }
    */

    // PEGGING FUNCTIONS

    applyServerPeggingData( newServerData :ServerPeggingData ) {
        this.pegging.applyServerData( newServerData );
        var newscore = this.pegging.cardScore; 
        if ( newscore > 0 ) {
            this.scoring.incrementPlayersScore( this.playersCompassPoint(this.pegging.lastPlayer), newscore );
        }
    }

    // BOX FUNCTIONS
    applyServerBox( serverBox : ServerBoxData) {
        this.theBox.applyServerBox( serverBox );
    }
    
    // DISCARDED CARDS FUNCTIONS 

    getNumDiscards(playersName: string) : number {
        // find the index of the player in the list of active players
        let playerIndex = this.getActivePlayerIndex( playersName );  
        // return the number of cards in their discard pile
        return this.state.activePlayers[playerIndex].discards.length; 
    }

    private emptyDiscardPile(playersName: string) {
        // find the index of the player in the list of active players
        let playerIndex = this.getActivePlayerIndex( playersName );  
        // empty the discard pile array
        this.state.activePlayers[playerIndex].discards.splice(0, this.state.activePlayers[playerIndex].discards.length); 
    }

    /**
     * Adds the specified card from the players hand to the discard pile,
     * and flags the card in the players hand that is has been played
     * @param playersName 
     * @param cardName 
     */
    addCardtoDiscardPile(playersName: string, cardName: string) {
        // find the index of the player in the list of active players
        let playerIndex = this.getActivePlayerIndex( playersName );
        // add the card to their discard pile
        this.state.activePlayers[playerIndex].discards.push(cardName);
        // now flag in the game store object that this card has been played by the player
        let cardIndex =-1;
        for (let i=0; i< this.state.activePlayers[playerIndex].hand.length; i++) {
            if (this.state.activePlayers[playerIndex].hand[i].card == cardName)
            {
                cardIndex = i;
                break;
            }
        }
        if (cardIndex>-1) {
            this.state.activePlayers[playerIndex].hand[cardIndex].cardPlayed();
        }
    }

    reverse_addCardtoDiscardPile(playersName: string, cardName: string, screenPosition: string) {
        // find the index of the player in the list of active players
        let playerIndex = this.getActivePlayerIndex( playersName );
        // find the card in the discard pile and remove it
        let discardIndex = -1;
        for (let i=0; i< this.state.activePlayers[playerIndex].discards.length; i++) {
            if (this.state.activePlayers[playerIndex].discards[i] == cardName) {
                discardIndex = i;
                break;              
            }
        }
        if (discardIndex >-1) {
            // add the card to their discard pile
            this.state.activePlayers[playerIndex].discards.splice(discardIndex, 1);
        }

        // reset the flag in the game store object that this card has been un-played by the player
        let cardIndex =-1;
        for (let i=0; i< this.state.activePlayers[playerIndex].hand.length; i++) {
            if (this.state.activePlayers[playerIndex].hand[i].card == cardName)
            {
                cardIndex = i;
                break;
            }
        }
        if (cardIndex>-1) {
            this.state.activePlayers[playerIndex].hand[cardIndex].cardUnPlayed(screenPosition);
        }
    }

    clearAllDiscardPiles() {
        for (let i = 0; i < this.state.activePlayers.length; i++) {
        //   TO DO this.state.activePlayers[i].discards = [];
        }       
    }

    getActivePlayerIndex(name: string): number {
        for (let i = 0; i < this.state.activePlayers.length; i++) {
            if (this.state.activePlayers[i].name == name) {
                return i;
            }
        }
        return -1;
    }

    getDiscardedCards(name: string) : string[] {
        let playerIndex = this.getActivePlayerIndex(name);
        if (playerIndex>-1) {
           return this.state.getDiscards(playerIndex);
        } else {
            return [];
        }
    }

    hasGameFinished() : boolean {
        // TODO
        return false;
    }

    ChangePhase() {
        // TO DO - this is BAD !!!!
        this.state.currentPhase++;
        if (this.state.currentPhase == GamePhase.cuttingForTurnup) {
            // TODO - not implemented yet
            this.state.currentPhase = GamePhase.pegging;
        }
    }

    isRoundComplete() : boolean {
        let retval = false;
        switch (this.state.currentPhase) {
            case (GamePhase.discardingToBox):
                retval = this.theBox.haveAllPlayersDiscarded( this.state.numActivePlayers );
                break;
            case (GamePhase.pegging):
                // TO DO
                break;
        }
        return retval;
    }

}

