import { Input, Component, OnInit, OnDestroy } from '@angular/core';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MessagingService } from '../_services/messagingservice.service';

import { DiscardedCard } from '../_classes/cardinhand';
import { GameData } from '../_classes/gamedata';

@Component({
  selector: 'app-discardpile',
  inputs: ['seat', 'showCards'],
  templateUrl: './discardpile.component.html',
  styleUrls: ['./discardpile.component.css']
})
export class DiscardpileComponent implements OnInit, OnDestroy {

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = ["*"];

  // Inputs
  @Input() gameData: GameData;

  // parameters supplied to component
  seat: string = "";
  showCards: string = "false";

  // 
  playersName: string;
  cardsinDiscardPile: DiscardedCard[] = [];
  selectedCard: string;

  constructor(public messageService: MessagingService ) {
    this.subscription = this.messageService.getMessage()
                        .pipe( filter( (msg: any[]) => (this.msgstoProcess.indexOf(msg[0])>=0) ) ) 
                        .subscribe( (message) => { this.onMessage(message) } );
  }

  ngOnDestroy() {
      // unsubscribe to ensure no memory leaks
      this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    let showCards = (this.showCards.toLowerCase() == "true");
    // Create one invisible element in the discard pile to size the container
    if ("S"==this.seat)     {
      this.cardsinDiscardPile.push( new DiscardedCard(1, '8s', true /* TEMP */));
    } else {
      this.addCardtoMyDiscardPile('ad');
      this.addCardtoMyDiscardPile('2d');
      this.addCardtoMyDiscardPile('3d');
      this.addCardtoMyDiscardPile('4d');
      this.addCardtoMyDiscardPile('5d');
    }

    this.refreshDiscardPile();
    
  }

  private addCardtoMyDiscardPile (cardId: string) {
    this.gameData.cardDiscarded(this.playersName, cardId);
    this.refreshDiscardPile();
   
  }

  onMessage(msg: any[]) {
  }

  refreshDiscardPile() {
      // Clear the local discard array to remove any dummy cards etc.
      this.cardsinDiscardPile.splice(0, this.cardsinDiscardPile.length);
      // get a copy of discarded cards from the global controller
      var discards:string[] = this.gameData.getDiscardedCards(this.playersName);
      if (discards.length <=0 ) {
        // The player has not discarded a card yet,
        // so we'll add a dummy invisible card to the local discard pile to size the container
        this.cardsinDiscardPile.push( new DiscardedCard(1, 'ad', false));
      } else if ( 0 < discards.length ) {
        // now add all the cards in the global controller to local array
        for (let i=0; i < discards.length; i++) {
          this.cardsinDiscardPile.push( new DiscardedCard(i+1, discards[i]) );
        }

        if (0) {
          // Now there are some card(s) in the discard pile,
          // we will to change the offset image to increase the overlap as the 
          // number of cards in the pile increaseses
          let factor = 50 + (this.cardsinDiscardPile.length * 5);
          for (let i=0; i< this.cardsinDiscardPile.length; i++) {
            this.cardsinDiscardPile[i].offset = `-${i * factor}%;`;
          }
        } else {
          let factor = 10 + (this.cardsinDiscardPile.length * 2);
          for (let i=0; i< this.cardsinDiscardPile.length; i++) {
            if (i<this.cardsinDiscardPile.length-1) {
              this.cardsinDiscardPile[i].setOverlappedImage();
            }
            this.cardsinDiscardPile[i].offset = `0;`;
          }
        }
      }
  }

}
