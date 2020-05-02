
export class CardinHand {
    id: number;
    card: string;
    isVisible: boolean;
    sideView: boolean;
    played: boolean;
    imageFile: string;

    constructor ( id: number, card: string, isVisible: boolean, isSideView: boolean){
        this.id = id;
        this.card = card;
        this.isVisible = isVisible;
        this.sideView = isSideView;
        this.played = false;
        this.lookupCardImage();
    }

    lookupCardImage() {
        if ( (true==this.played) || (!this.isVisible) )  {
            if (this.sideView) {
                this.imageFile = './assets/cards/back-side.png';
            } else {
                this.imageFile = './assets/cards/back.png';
            }
            
        } else {
            this.imageFile = './assets/cards/' + this.card + '.png';
        }
    }

    cardPlayed() {
        this.imageFile = './assets/cards/back.png';
        this.played = true;
        this.isVisible = false;
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