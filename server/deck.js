class Deck {

    shuffledDeck = [];
    deck = [];

    constructor() {

        var i, ii;
        var count;
        var suits = "CDHS";
        var cardValues = "A23456789TJQK";
        var card;

        for (i=0; i<suits.length; i++) {
            for (ii=0; ii < cardValues.length; ii++) {
                card = cardValues.substr(ii,1) + suits.substr(i,1)
                count = this.deck.push(card);
            }
        }
    };

    shuffle() {
        this.shuffledDeck = this.deck.slice(); 
        var ctr = this.deck.length;
        var temp;
        var index;
    
        // While there are elements in the array
        while (ctr > 0) {
            // Pick a random index
            index = Math.floor(Math.random() * ctr);
            // Decrease ctr by 1
            ctr--;
            // And swap the last element with it
            temp = this.shuffledDeck[ctr];
            this.shuffledDeck[ctr] = this.shuffledDeck[index];
            this.shuffledDeck[index] = temp;
        }
        return;
    }

    getCard(index) {
        if (this.shuffledDeck == undefined)
        {
            return "You haven't shuffled yet !";
        }
        else if (index >=0 && index < this.shuffledDeck.length )
        {
            return this.shuffledDeck[index];
        }
        else
        {
            return this.shuffledDeck[0];
        }
    }

}

module.exports = Deck;

