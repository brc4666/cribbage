class ServerPlayerPosition {
    constructor(name, compassSeat) {
        this.name = name;
        this.compassSeat = compassSeat;
    }
}

class ServerGameState {
    
    constructor() {
        this.totalscore = 0;
        this.dealerName = 'Brian';
        this.turnupCard = 'ad';
        this.numPlayers = 0;
        this.players = [];
    }

    addPlayer(name, compassSeat) {
        var alreadyListed = false;
        for (i=0; i< this.players.length; i++) {
            if (this.players[i].name === name) {
                this.players[i].compassSeat = compassSeat;
                alreadyListed = true;
            }
        }
        if (!alreadyListed) {
            this.players.push( new ServerPlayerPosition(name, compassSeat) );
        }
        this.numPlayers = this.players.length; 
    }

    IncrementScore( score2Add ) {
        this.totalscore += score2Add;
        return this.totalscore;
    }
}

module.exports = ServerGameState;