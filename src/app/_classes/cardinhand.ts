export class CardinHand {
    /** the name of the card : the demoniation and suit i.e. js = jack of spades*/
    card: string;
    /** Value of card for scoring purposes */
    valueofCard: number;
    /** whether the card has been played (in the correct context) */
    played: boolean;
    showCard: boolean;                  // not to be confused with showCards on a view
    isInVisible: boolean = true;
    imageFile: string;

    constructor ( cardname: string, showCard: boolean, isInVisible :boolean = false){
        this.card = cardname;
        this.valueofCard = this.calcCardValue(cardname);
        this.played = false;
        this.showCard = showCard;
        this.isInVisible = isInVisible;
        if (showCard) {
            this.imageFile = cardname + ".png";
        } else {
            this.imageFile = 'back.png';
        }
    }   

    get cardValue() : number {
        if (this.valueofCard<=0) {
            this.valueofCard = this.calcCardValue(this.card);    
        } 
        return this.valueofCard;
    }

    /** returns the demonation of the card: i.e. '8' or 'j' or 'a' */
    get cardDenomination() : string { return this.card.substr(0, 1); }

    calcCardValue(card: string) : number {
        let value = 0;
        if (card.length==2) {
            value = 1 + "a23456789tjqk".indexOf(this.card.substr(0, 1));
            if (value > 10) value = 10; 
        }
        return value;
    }

    updateCardImage(screenPosition: string) {
        //'./assets/cards/'
        if ( (screenPosition=="left") || (screenPosition=="right") ) {
            // side views never show the face of the card ... only the back ...
            // and then always the same image 
            this.imageFile = 'back-side.png'; 
        } else if ( (true==this.played) || (!this.showCard) )  {
            this.imageFile = 'back.png';
        } else {
            this.imageFile = this.card + '.png';
        }
    }

    cardPlayed() {
        this.played = true;
        this.imageFile = 'back.png';
    }

    cardUnPlayed(screenPosition: string) {
        this.played = false;
        this.updateCardImage(screenPosition)
    }
}

export class DiscardedCard {
    id: number;
    card: string;
    imageFile: string;
    isVisible: boolean;
    offset: string;

    constructor ( id: number, card: string, visible: boolean=true){
        this.id = id;
        this.card = card;
        this.imageFile = './assets/cards/' + this.card + '.png';
        this.isVisible = visible;
    }
    setOverlappedImage() {
        this.imageFile = './assets/cards/' + this.card + '-half.png';
    }
}

export class DeckofCards {
    id: number;
    card: string;
    imageFile: string;
    offset: string;

    constructor ( id: number, card: string, showCard: string="false"){
        this.id = id;
        this.card = card;
        if (showCard=="false") {
            this.imageFile = './assets/cards/back-quarter.png';
        } else {
            this.imageFile = './assets/cards/' + this.card + '-half.png';  
        }
        this.offset = "";
        
    }
    setLastCard(showCard: string="false") {
        if (showCard=="true") {
            this.imageFile = './assets/cards/' + this.card + '.png';  
        } else {
            this.imageFile = './assets/cards/back.png';
        }
    }
}