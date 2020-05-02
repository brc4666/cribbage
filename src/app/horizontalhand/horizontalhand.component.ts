import { Input, Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Injectable } from '@angular/core';

import { MessagingService } from '../_services/messagingservice.service';
import { MessageType, MessageHeader } from '../_classes/common';

import { CardinHand, DiscardedCard } from '../_classes/cardinhand';
import { GameData } from '../_classes/gamedata';


@Component({
  selector: 'app-horizontalhand',
  inputs: ['screenPosition', 'cssClassname', 'showCards'],
  templateUrl: './horizontalhand.component.html',
  styleUrls: ['./horizontalhand.component.css']
})
export class HorizontalhandComponent implements OnInit, OnDestroy {

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = [MessageType.game, MessageType.cards];

  // Cmponent Inputs
  @Input() gameData: GameData;
  
  // Component parameters
  screenPosition: string = "";
  cssClassname: string = "";
  showCards: string = "false"; 
  
  // member variables
  playersName: string;              // the player's name for this view 
  title: string = "";               // for display on view         
  selectedCard: string;             // the card clicked in the view
  
  
  cardsinHand: CardinHand[] = [];
  cardsinDiscardPile: DiscardedCard[] = [];
  isMyTurn: boolean; 
  
  
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

    this.cardsinHand.push( new CardinHand(1, '9s', showCards, false));
    this.cardsinHand.push( new CardinHand(2, '7c', showCards, false));
    this.cardsinHand.push( new CardinHand(3, 'tc', showCards, false));
    this.cardsinHand.push( new CardinHand(4, 'kc', showCards, false));
    this.cardsinHand.push( new CardinHand(5, '3c', showCards, false));

    // Create one invisible element in the discard pile to size the container
    this.cardsinDiscardPile.push( new DiscardedCard(1, '8d', false));

    this.UpdateLocals();   
  }

  onMessage(msg: any[]) {
    if (msg==undefined) 
       return;

    let msgheader = msg[1];
    switch ( msgheader ) {
      
      case MessageHeader.refreshgame:        
        this.UpdateLocals();
        break;
    
      case MessageHeader.refreshcards:
        break;
      
      default:
        break;
    }
  }

  onClickSpacer() {
    this.refreshDiscardPile();
  }

  onSelectCard(card: CardinHand) {
    if(card.isVisible===true && card.played===false) {
      this.selectedCard = card.card; 
      // Update the discard pile with the selected card
      this.addCardtoMyDiscardPile( card.card );
      // update the 'hand' with the fact this card has been played (and cannot be played again)
      this.cardsinHand[card.id-1].cardPlayed(); 
      this.gameData.sharedCard = card.card;
      let msg = this.playersName + " discarded " + card.card;
      // this.sendMessage( msg );
    }
  }

  onButtonClick() {
    // this.sendMessage( this.playersName + " clicked his button" );

  }

  private addCardtoMyDiscardPile (cardId: string) {
    this.gameData.cardDiscarded(this.playersName, cardId);
    this.refreshDiscardPile();
   
  }


  refreshDiscardPile() {
      return;
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
        // Now there are some card(s) in the discard pile,
        // we will to change the offset image to increase the overlap as the 
        // number of cards in the pile increaseses
        let factor = 50 + (this.cardsinDiscardPile.length * 5);
        for (let i=0; i< this.cardsinDiscardPile.length; i++) {
          this.cardsinDiscardPile[i].offset = `-${i * factor}%;`;
        }
      }
  }

  private UpdateLocals() {
    this.playersName = this.gameData.whoIsSeatedAt(this.screenPosition);
    let playersCompassPoint = this.gameData.playersCompassPoint(this.playersName);
    if( (this.playersName!="") && (playersCompassPoint!="") ) {
      this.title = "["+ playersCompassPoint +"] : " + this.playersName;
    }
  }

}
