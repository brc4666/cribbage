import { CardinHand } from './cardinhand';
import { ɵclearResolutionOfComponentResourcesQueue } from '@angular/core';

const t = "a23456789tjqk";

export class ScoreHand {
    originalHand: CardinHand[];
    sortedHand: CardinHand[];
    score: number;
    details: string[];
    threeDenom : string;        // the card denomination if three of a kind is found (to be excluded from pairs calculation)

    constructor() {
        this.originalHand  = [];
        this.sortedHand = [];
        this.score = 0;
        this.details = [];
        this.threeDenom = "";
    }

    get scoreDetailsLength() : number { return this.details.length; } 
    scoreDetails(index: number) : string { return this.details[index]; }

    private sortHand() {
        var inserted: boolean;
        this.sortedHand.splice(0, this.sortedHand.length);
        this.details.splice(0, this.details.length);
        // Add the cards from the originalHand[] into sprtedHand[] in the correct place
        for (let i=0; i < this.originalHand.length; i++) {
            inserted = false;
            for ( let j=0; j < this.sortedHand.length ; j++) {
                if ( t.indexOf(this.originalHand[i].card.substr(0, 1)) <=
                     t.indexOf(this.sortedHand[j].card.substr(0, 1)) ) {
                    // Insert card from original hand before the current sortedHand index
                    this.sortedHand.splice(j,0, this.originalHand[i]);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                this.sortedHand.push( this.originalHand[i] );
            }
        }
    }

    calcScore( hand: CardinHand[], turnup: CardinHand, istheBox: boolean=false ) : number { 
        this.score = 0;
        this.originalHand.splice(0, this.originalHand.length);
        // now add all the cards in the hand to the local array 
        for (let i=0; i < hand.length; i++ ) {
            this.originalHand.push( new CardinHand( hand[i].card, true ) );
        }
        // 
        this.originalHand.push( new CardinHand( turnup.card, true) );
        this.sortHand();

        this.score += 2 * this.Fifteens();
        if (this.FourofaKind() ) {
            this.score += 12;
        } else {
            var foundCard : string = "";
            this.threeDenom = "";
            this.score += this.ThreeofaKind();
            this.score += 2 * this.Pairs();
        }
        this.score += this.Runs();
        this.score += this.Flushes( turnup, istheBox );
        this.score += this.HisNob( turnup );

        return this.score;
    }

    private demonIndex( cih : CardinHand ) : number {
       return( t.indexOf( cih.card.substr(0, 1) ) );
    }

    private Fifteens() : number {
        var i: number;
        var j: number;
        var k: number;
        var m: number;
        var count: number = 0;
        
        // Take each card and see if ONE of the other cards add together to get 15
        for (i=0; i< this.sortedHand.length-1; i++) {
            for (j = i+1; j < this.sortedHand.length; j++) {
                if (this.sortedHand[i].cardValue + this.sortedHand[j].cardValue == 15) {
                    count++;
                }
            }
        }

        // Now for each card, see if TWO additional cards = 15
        for (i = 0; i < this.sortedHand.length-2; i++) {
            for (j = i+1; j < this.sortedHand.length -1; j++) {
                for (k = j+1; k < this.sortedHand.length; k++) {
                    if (this.sortedHand[i].cardValue + this.sortedHand[j].cardValue + this.sortedHand[k].cardValue == 15) {
                        count++;
                    }
                }
            }
        } 

        // Now for each card, see if THREE additional cards = 15
        for (i = 0; i < this.sortedHand.length-3; i++) {
            for (j = i+1; j < this.sortedHand.length-2; j++) {
                for (k = j+1; k < this.sortedHand.length-1; k++) {
                    for (m = k+1; m < this.sortedHand.length; m++) {
                        if (this.sortedHand[i].cardValue + this.sortedHand[j].cardValue + this.sortedHand[k].cardValue + this.sortedHand[m].cardValue == 15) {
                            count++;
                        }
                    }
                }
            }
        } 

        // Finally see if all 5 cards add up to fifteen.
        // They cannot if we have found a fifteen already !
        if (count==0) {
            j = 0;
            for (i = 0; i < this.sortedHand.length; i++) {
                j += this.sortedHand[i].cardValue;
            }
            if (j==15) {
                count++;
            }
        }

        if (count>0) {
            this.details.push('+' + (count*2) + ' for ' + count + ' fifteen(s)');
        }


        return count;
    }

    private Pairs() : number {
        var i: number;
        var j: number;
        var count: number = 0;

        for (i=0; i< this.sortedHand.length-1; i++) {
            if ( this.sortedHand[i].card.substr(0, 1) != this.threeDenom) {
                for (j = i+1; j < this.sortedHand.length; j++) {
                    if ( this.sortedHand[i].cardDenomination == this.sortedHand[j].cardDenomination ) {
                        // It's two matching cards that are not 2 parts of three of a kind
                        count++;
                    }
                }
            }
        }

        if (count>0) {
            this.details.push('+' + (count*2) + ' for ' + count + ' pair(s)');
        }

        return count;
    }

    private ThreeofaKind() : number {
        var i: number;
        var j: number;
        var count: number;

        for (i=0; i < 3; i++) {
            count = 1;      // because the 'i' card we are comparing against counts as one of the matches
            for (j = i+1; j < i + 3; j++) {
                if ( this.sortedHand[i].card.substr(0, 1) == this.sortedHand[j].card.substr(0, 1) ) {
                    count++;
                } else {
                    break;
                }
            }
            if (count == 3) {
                this.threeDenom = this.sortedHand[i].card.substr(0, 1);
                break;
            } else {
                count = 0;
            }
        }

        if (count==3) {
            this.details.push('+6 for three of a kind');
        }

        return count * 2;
    }    

    private FourofaKind() : boolean {
        var i: number;
        var j: number;
        var count: number;

        for (i=0; i< 2; i++) {
            count = 1;      // because the 'i' card we are comparing against counts as one of the matches
            for (j = i+1; j < i + 4; j++) {
                if ( this.sortedHand[i].cardDenomination == this.sortedHand[j].cardDenomination ) {
                    count++;
                } else {
                    break;
                }
            }
            if (count == 4) {
                break;
            }
        }

        if (count==4) {
            this.details.push('+12 for four of a kind');
        }

        return (count==4);
    }

    private Flushes( turnup: CardinHand, istheBox: boolean) : number {
        var i: number;
        var count: number = 1;

        // check all he cards in the original hand ... excluding the turnup
        for (let i= 1 ; i < this.originalHand.length ; i++) {
            if ( this.originalHand[i].card !== turnup.card ) {
                if ( this.originalHand[i].card.substr(1, 1) == this.originalHand[0].card.substr(1, 1) ) {
                    count++;
                }
            }
        }
        if ( count == this.originalHand.length -1 ) {
            if (!istheBox) {
                // as main hand, need all card plus the turnup to flush to score
                if ( turnup.card.substr(1,1) == this.originalHand[0].card.substr(1, 1) ) {
                    count++; 
                } else {
                    count = 0;  // Get nothing unless all five cards in the main hand flush
                }
            }
        }
        else {
            count = 0; // Get nothing unless all relevant cards flush
        }

        if (count>0) {
            this.details.push('+' + count + ' for a flush');
        }

        return count;
    }

    private HisNob( turnup: CardinHand) : number {
        var i: number;
        var count: number = 0;

        for (let i= 0 ; i < this.originalHand.length-1 ; i++) {
            if ( (this.originalHand[i].card.substr(0, 1) == 'j' ) &&
                 (this.originalHand[i].card.substr(1, 1) == turnup.card.substr(1, 1) ) ) {
                count++;
            }
        }

        if (count>0) {
            this.details.push('+1 for his Nob');
        }

        return count;
    }

    private Runs() : number {
        var dummy: CardinHand[] = [];
        var runsscore: number = 0;
        var demonIndex: number;
        var i: number;
        var j: number;

        // first job is to create a dummay hand to work on 
        // with no duplicate cards 
        // (i.e. if the hand is 3 4 4 4 5,we want to collapse it to just 3 4 5)
        var duplicates: number[] = [13];
        for (i=0; i<13; i++) {
            duplicates[i] = 1;
        }

        // Now add the cards from the sorted hand to the working dummy hand,
        // excluding any duplicate
        dummy.push( this.sortedHand[0] );
        demonIndex = this.demonIndex(this.sortedHand[0]);
        for (i = 1; i < this.sortedHand.length; i++) {
            if ( demonIndex == this.demonIndex(this.sortedHand[i]) ) {
                // this card is the same as the previous card, so do not add it 
                // to the dummay, but do increment the duplicates count
                duplicates[demonIndex]++;
            }
            else
            {
                dummy.push( this.sortedHand[i] );
                demonIndex = this.demonIndex(this.sortedHand[i])
            }
        }

        if (dummy.length<3) {
            // If we only have 2 cards now we have removed all duplicates ...
            // we cannot have any runs !
            return runsscore;
        }

        // Now we can more easily see how many runs we have in the dummy hand (excluding the duplicates)
        // First check if all the cards in the dummy hand are contiguous
        runsscore = this.runsHelper(dummy, dummy.length, duplicates);
        if ( (runsscore == 0) && (dummy.length-1 >= 3) ) {
            // Not all the cards are in sequence, and there are enough non-duplicate cards to have shorter runs 
            // so now we need to check is a shorter sequence is found
            runsscore = this.runsHelper(dummy, dummy.length - 1, duplicates);
            if ( (runsscore == 0) && (dummy.length-2 >= 3) ) {
                // Still no run, so try even shorter run if there are enough cards to support it
                runsscore = this.runsHelper(dummy, dummy.length - 2, duplicates);
            }
        }
        return runsscore;
    }

    private runsHelper( dummy : CardinHand[], runlength :number, duplicates: number[] ) : number {
        var runscore: number = 0;
        var runscount = 0;

        for (let i =0; i< (dummy.length - runlength) + 1 ; i++ ) {
            if ( this.demonIndex(dummy[runlength-1+i]) - this.demonIndex(dummy[i]) == runlength-1 )
            {
                // Yes - all the (non duplicate) cards are in sequence.
                runscore = runlength;
                runscount++;
                // if any of those are duplicated, we multiply the score by 2
                for (let ii = i; ii<i+runlength; ii++) {
                    if ( duplicates[ this.demonIndex(dummy[ii]) ] > 1 ) {
                        runscount *= duplicates[ this.demonIndex(dummy[ii]) ];
                        runscore = (runscore * duplicates[ this.demonIndex(dummy[ii]) ] );
                    }
                    
                } 
            }
        }

        if (runscore>0) {
            this.details.push('+' + runscore + ' for ' + runscount + ' run(s) of ' + runlength);
        }

        return runscore;
    }






    pegRuns( pegcards : CardinHand[] ) : number {
        if (pegcards.length < 3) {
            // Not enough cards for a run !
            return 0;
        }
        var partialSeq: CardinHand[] = [];
        var runsscore: number = 0;
        var i: number;

        // For all possible run lengths (i.e. from all cards to just the last 3 ...)
        for (i=0; i <= pegcards.length - 3; i++) {
            // sort that partial sequence of cards
            partialSeq = this.pegSortHand(pegcards, i);
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

    private pegRunHealper( partial : CardinHand[] ) : number {
        var runscore: number = 0;
        var runlength :number = partial.length;
        // Check to any duplicates in the part of the card sequence we are interested in 
        var foundDuplicate = false;
        for (let i=0; i < partial.length - 1; i++) {
            if ( this.demonIndex(partial[i]) == this.demonIndex(partial[i+1]) ) {
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
        if ( this.demonIndex(partial[ partial.length -1 ]) - this.demonIndex(partial[0]) == runlength-1 ) {
            runscore = runlength;
        }

        return runscore;
    }

    private pegSortHand(pegcards : CardinHand[], startIndex : number ) : CardinHand[] {
        var inserted: boolean;
        var sortedHand: CardinHand[] = [];
        // Add the cards from the pegCards[] into sortedHand[] in the correct place
        for (let i=startIndex; i < pegcards.length; i++) {
            inserted = false;
            for ( let j=0; j < sortedHand.length ; j++) {
                if ( t.indexOf(pegcards[i].card.substr(0, 1)) <=
                     t.indexOf(sortedHand[j].card.substr(0, 1)) ) {
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

}