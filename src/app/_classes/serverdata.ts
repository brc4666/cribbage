import { CardinHand, DiscardedCard } from './cardinhand';
import { GamePhase } from './common';

export class ServerPlayerInfo {
    isConnected: boolean = false;
    name: string;
    compassSeat: string;                // N, S, E, W
    hand: CardinHand[];
    discards: string[];

    constructor(name: string, compassSeat: string) {
        this.name = name;
        this.compassSeat = compassSeat;
        this.hand = [];
        this.discards = [];
    }
}

export class ServerConfigData {
    isSetup: boolean = false;
    potentialPlayers: ServerPlayerInfo[] = [];
    constructor() {
        this.isSetup = false;  
        this.potentialPlayers = [];
    }
}

export class ServerBoxData {
    cards: CardinHand[];  
    playersDiscardedCount: number;
    constructor() {
        this.cards = [];  
        this.playersDiscardedCount = 0;
    }
}

export class ServerPlayerScore {
    seats: string;
    displayname: string;
    score: number;
    constructor() {
        this.seats = "";
        this.displayname = "";
        this.score = 0;
    }
}

export class ServerGameScores {
    playerScores: ServerPlayerScore[];
    constructor() {
        this.playerScores = [];
        this.playerScores.push( new ServerPlayerScore() );
        this.playerScores.push( new ServerPlayerScore() );
    }
}

export class ServerPeggingData {    
    cards: CardinHand[];                        // cards in this pegging sequence
    total: number;                              // current pegging cycle total
    countCardsPlayed: number;                   // total cards played in the pegging phase
    cardScore: number;                          // the score the last played card scored
    lastPlayer: string;                         // name of last player to add to pegging cards
    cantGoList: string[];                       // list of players who cannot play any more cards
    scoremsg: string;                           // message to display to all users explaining the score
    constructor() { 
        this.cards = [];
        this.total = 0;                         
        this.countCardsPlayed = 0;              
        this.cardScore = 0;
        this.lastPlayer = "";     
        this.cantGoList = [];                
        this.scoremsg = "";  
    }
}

export class ServerGameStatus {
    activePlayers: ServerPlayerInfo[];
    numActivePlayers: number;               // Number of active players
    currentDealer: string;                  // name of player who is dealing   
    currentActivePlayer: string ;           // name of player who's turn it is to do something
    currentPhase: GamePhase;
    turnup: string;                         // the name of the turn up card
    cardsToCut: number;                     // the number of cards in the deck to cut
    shownHandsCount = 0;                    // number of players wh have taken ponts from their hand 
    publicmessage = "";                     // message to all players

    constructor () {
        this.activePlayers = [];
        this.numActivePlayers = 0;
        this.currentDealer = "";           
        this.currentActivePlayer = "";    
        this.currentPhase = GamePhase.unknown;
        this.turnup = "";
        this.cardsToCut = 0;
        this.shownHandsCount = 0;     
        this.publicmessage = "";
    }
}



export class ServerGameData {
    config: ServerConfigData;
    state: ServerGameStatus;
    scoring: ServerGameScores;
    thebox: ServerBoxData;
}