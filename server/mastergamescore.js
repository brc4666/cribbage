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
        this.totalScore = 0;
    }

    initPlayersScore( scoreIndex, seats, displayname) {
        this.playerScores[scoreIndex].seats = seats;
        this.playerScores[scoreIndex].displayname = displayname;
    }

    incrementPlayersScore(compassSeat, incScore) {
        for (let p = 0; p < this.playerScores.length; p++ ) {
            if ( this.playerScores[p].seats.indexOf(compassSeat) >-1 ) {
                this.playerScores[p].score += incScore;
                break;
            }
        }
    }

}

module.exports = MasterGameScores;