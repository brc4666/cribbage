import { CardinHand } from './cardinhand';

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

class PlayerInfo {
    name: string;
    isConnected: boolean = false;
    compassSeat: string;                // N, S, E, W
    screenposition: string;             // top, left, right, bottom
    isDealer: boolean;
    discards: string[]=[];

    constructor(name: string, compassSeat: string) {
        this.name = name;
        this.compassSeat = compassSeat;
        this.isDealer = false;
    }
}

class GameScore {
    seats: string = "";
    displayname: string = "";
    score: number = 0;
    constructor(seats: string, displayname: string) {
        this.seats = seats;
        this.score = 0;
        this.displayname = displayname;
    }
}

export class GameData{

    isSetup: boolean = false;
    isDealerSet = false;          // used to determine if the cut for deal component should be shown
    potentialPlayers: PlayerInfo[] = [];
    activePlayers: PlayerInfo[] = [];
    numActivePlayers: number = 0;
    whoAmI: string = "";                 // should be read-only !
    currentDealer: string;
    sharedCard: string = "ad";
    gameScores: GameScore[] = [];
    
    constructor() { }

    addPotentialPlayer(name: string, seat: string) {
        this.potentialPlayers.push(new PlayerInfo(name,seat));
    }

    setwhoIAm(name:string) {
        this.whoAmI = name;
    }

    initialiseGame( stateData: GameStateData) {
        // Add/Refresh active players and their compass position
        for (let i=0; i< stateData.players.length; i++) {
            // Check if we already have this player in the active players list:
            // if we have, then update the players compassSeat
            // If not, add the player to the list
            let index = this.findActivePlayerIndex(stateData.players[i].name);
            if (index >-1) {
                this.activePlayers[index].compassSeat = stateData.players[i].compassSeat; 
            } else {
                this.activePlayers.push ( new PlayerInfo(stateData.players[i].name, stateData.players[i].compassSeat) );
            }
        }

        // Reset number of active players
        this.numActivePlayers = stateData.numPlayers;

        // Now sort out the relative position of each player (top, left, right, bottom)
        // All we know at the moment is who is sitting at which compass point. 
        // NB. 'this' player will always be at the bottom of the screen - i.e. bottom
        let compassPoints = ["N","E","S","W"];
        let screenPoints = ["top","right","bottom","left"];
        let myCompassPoint = 0;
        let myScreenPoint = 0;
        let pointOffset = 0;
        let myIndex = this.findActivePlayerIndex(this.whoAmI);
        if (myIndex>-1) {
            // so record my compass point me new screen point (which will be 2 as I am sitting at the bottom)
            myCompassPoint = compassPoints.indexOf(this.activePlayers[myIndex].compassSeat);
            this.activePlayers[myIndex].screenposition = "bottom";
            myScreenPoint = screenPoints.indexOf(this.activePlayers[myIndex].screenposition);
            // So now we know the offset between my compass point and my screen position
            pointOffset = myScreenPoint - myCompassPoint;
            if (pointOffset<0)
               pointOffset += 4;
            // and we can apply this to the other players to determine their screen position
            for (let i=0; i< stateData.players.length; i++) {
                if (i!=myIndex) {
                    // get this players compasspoint ... apply the offset ... and set their screeen position
                    let playerCompassPoint = compassPoints.indexOf(this.activePlayers[i].compassSeat);
                    let playerScreenPoint = playerCompassPoint + pointOffset;
                    if (playerScreenPoint>3)
                        playerScreenPoint -= 4;
                    this.activePlayers[i].screenposition = screenPoints[playerScreenPoint];
                }
            }

        } else {
            // oh darn it !!! whoami is not in the list of active players !!! ??? 
        }

        // Initialise scores
        this.initScores();

        // Initialise dealer
        this.initDealer( stateData.dealerName );
    }

    private initScores() {
        if (2==this.numActivePlayers) {
            this.gameScores.push( new GameScore("N", this.playerAtCompassPoint("N")) );
            this.gameScores.push( new GameScore("S", this.playerAtCompassPoint("S")) );
        } else if (4==this.numActivePlayers) {
            if ( (this.playerAtCompassPoint("N")=="Kate") && (this.playerAtCompassPoint("S")=="Brian") ) {
                this.gameScores.push( new GameScore("NS", "Flamers") );
                this.gameScores.push( new GameScore("EW", "M&Ms") ); 
            } else {
                this.gameScores.push( new GameScore("NS", "NS") );
                this.gameScores.push( new GameScore("EW", "EW") );   
            }
            this.gameScores[0].score = 119;
            this.gameScores[1].score = 87;      
        }
    }

    private playerAtCompassPoint(compassPoint: string) : string {
        let retval = "";
        for (let i = 0; i < this.activePlayers.length; i++) {
            if (this.activePlayers[i].compassSeat==compassPoint) {
                retval = this.activePlayers[i].name;
            }
        }  
        return retval;    
    }

    whoIsSeatedAt(screenPoint: string) : string {
        let retval = "";
        for (let i = 0; i < this.activePlayers.length; i++) {
            if (this.activePlayers[i].screenposition==screenPoint) {
                retval = this.activePlayers[i].name;
            }
        }  
        return retval;    
    }

    playersCompassPoint(name: string) {
        let retval = "";
        for (let i = 0; i < this.activePlayers.length; i++) {
            if (this.activePlayers[i].name==name) {
                retval = this.activePlayers[i].compassSeat;
            }
        }  
        return retval;        
    }

    private initDealer(name: string) {
        for (let i = 0; i < this.activePlayers.length; i++) {
            if (this.activePlayers[i].name==name) {
                this.activePlayers[i].isDealer = true;
                this.isDealerSet = true;
                this.currentDealer = this.activePlayers[i].name;
            }
            else {
                this.activePlayers[i].isDealer = false;
            }
        }

    }

    nextDealer(): string {
        let nextDealerIndex=0;
        for (let i = 0; i < this.activePlayers.length; i++) {
            if (this.activePlayers[i].isDealer) {
                nextDealerIndex=i;
                if (nextDealerIndex > this.numActivePlayers) {
                    nextDealerIndex = 1;
                }
                this.activePlayers[nextDealerIndex].isDealer = true;
            }
        }
        return this.activePlayers[nextDealerIndex].name;
    }

    cardDiscarded(name: string, card: string) {
        // this.activePlayers[this.findActivePlayerIndex(name)].discards.push( card );
    }

    clearAllDiscardPiles() {
        for (let i = 0; i < this.activePlayers.length; i++) {
        //    this.activePlayers[i].discards = [];
        }       
    }

    private findActivePlayerIndex(name: string): number {
        for (let i = 0; i < this.activePlayers.length; i++) {
            if (this.activePlayers[i].name == name) {
                return i;
            }
        }
        return -1;
    }

    getDiscardedCards(name: string) : string[] {
        let i = this.findActivePlayerIndex(name);
        if (i>-1) {
           // return this.activePlayers[i].discards;
        } else {
            return [];
        }
    }

    // Refresh the local 'gamedata' object with information received from the server
    refreshGameData ( stateData: GameStateData, hint: string) {
        if ( ("*"==hint) || ("players"==hint) ) {

        }
    }

}

class GameStatePlayerPosition {
    name: string;
    compassSeat: string;
}
export class GameStateData {
    totalscore: number = 0;
    dealerName: string;
    turnupCard: string;
    numPlayers: number = 0;
    players: GameStatePlayerPosition[];
   
}