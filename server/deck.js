class Deck {

    shuffledDeck = [];
    deck = [];
    dealt = [];
    nextCardtoDeal = 0;
    totalCardsDealt = 0;

    constructor() {

        var i, ii;
        var count;
        var suits = "cdhs";
        var cardValues = "a23456789tjqk";
        var card;

        for (i=0; i<suits.length; i++) {
            for (ii=0; ii < cardValues.length; ii++) {
                card = cardValues.substr(ii,1) + suits.substr(i,1)
                count = this.deck.push(card);
                this.dealt.push ( false ) ;
            }
        }

        this.totalCardsDealt = 0;
    };

    shuffleDeck() {
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

        for (ctr=0; ctr< this.dealt.length; ctr++) {
            this.dealt[ctr] = false;
        }

        this.nextCardtoDeal = 0;
        this.totalCardsDealt = 0;
    }

    dealCard() {
        if (this.shuffledDeck == undefined)
        {
            return this.shuffledDeck[0];
            // return "You haven't shuffled yet !";
        }
        else if (this.nextCardtoDeal >=0 && this.nextCardtoDeal < this.shuffledDeck.length )
        {
            this.dealt[this.nextCardtoDeal] = true;
            this.totalCardsDealt++;
            return this.shuffledDeck[this.nextCardtoDeal++];
            
        }
        else
        {
            return this.shuffledDeck[0];
        }
    }


    getCardAt( cardIndex ) {
        var deckIndex = cardIndex + this.totalCardsDealt;
        if ( (deckIndex >= 0) && (deckIndex < this.shuffledDeck.length) ) {
            return this.shuffledDeck[deckIndex];
        }
    }


}

module.exports = Deck;

