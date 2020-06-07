import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { GameControllerService } from '../_services/gamecontroller.service';
import { MessageType, MessageHeader, GamePhase } from '../_classes/common';

import { CardinHand, DiscardedCard } from '../_classes/cardinhand';

@Component({
  selector: 'app-verticalhand',
  inputs: ['screenPosition', 'cssClassname', 'showCards'],
  templateUrl: './verticalhand.component.html',
  styleUrls: ['./verticalhand.component.css']
  // templateUrl: '../horizontalhand/horizontalhand.component.html',
  // styleUrls: ['../horizontalhand/horizontalhand.component.css']
})

export class VerticalhandComponent implements OnInit, OnDestroy {

   // intra-component messaging variables
   private subscription: Subscription;
   private msgstoProcess: any[] = [MessageType.game, MessageType.cards];
   
   // Component parameters
   screenPosition: string = "";
   cssClassname: string = "";
   showCards: string = "false"; 

  // member variables
  playersName: string;              // the player's name for this view 
  playersIndex: number = -1;        // index of this player in gameData.activePlayers[]
  compassPoint: string = "";        // the compass point of this player
  title: string = "";               // for display on view      
  selectedCard: string;             // the card clicked in the view
   
  // Handy values to control view
  assetsPath: string = environment.ASSETPATH;
   
   cardsinHand: CardinHand[] = [];
   cardsinDiscardPile: DiscardedCard[] = [];
   isMyTurn: boolean; 
  
  constructor(public gc: GameControllerService ) {
    this.subscription = this.gc.getMessage()
                        .pipe( filter( (msg: any[]) => (this.msgstoProcess.indexOf(msg[0])>=0) ) ) 
                        .subscribe( (message) => { this.onInternalMessage(message) } );
  }

  
  ngOnDestroy() {
      // unsubscribe to ensure no memory leaks
      this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    let showCards = (this.showCards.toLowerCase() == "true");
    this.UpdateLocals();
  }

  onInternalMessage(msg: any[]) {
    if (msg==undefined) 
       return;

    let msgheader = msg[1];
    switch ( msgheader ) {
      case MessageHeader.refreshgame: 
      case MessageHeader.statusupdate:
        this.UpdateLocals();
        break;
      default:
        break;
    }
  }
  
  isCardPlayable(card: CardinHand): boolean {
    return ( (card.showCard==true) && (this.playersName===this.gc.game.state.currentActivePlayer) );
  }

  onSelectCard(card: CardinHand) {
    if ( (card.showCard!==true) || (card.played===true) ) {
      // we've got a click message from a card that has already been played,
      // or should be invisible ... neither of which should allow a clock, but ...
      alert("Not sure why you were allowed to, but you cannot play that card. Sorry!")
      return;
    }

    switch (this.gc.game.state.currentPhase) {
      case (GamePhase.pegging):
        break;
      case (GamePhase.discardingToBox):
        // check correct number of cards are ready to be discarded
        if (this.gc.game.getNumDiscards(this.playersName) >= this.gc.game.state.requiredDiscardsforBox)
        {
          alert("You cannot discard anymore cards!");
        } else {
          // We are good to go with the discard operation
          this.selectedCard = card.card; 
          // Update the current player's list of discarded cards
          // NB. 
          this.gc.game.addCardtoDiscardPile(this.playersName, card.card);

        }
        break;
    }
 
  }
  
 private UpdateLocals() {
    if (this.gc.game.config.isSetup!=true) {
      // happens in debug mode. It's ok
      return;
    }
    this.playersName = this.gc.game.whoIsSeatedAt(this.screenPosition);
    this.playersIndex = this.gc.game.getActivePlayerIndex( this.playersName);
    this.compassPoint = this.gc.game.playersCompassPoint(this.playersName);
    if( (this.playersName!="") && (this.compassPoint!="") ) {
      this.title = "["+ this.compassPoint +"] : " + this.playersName;
      if (this.gc.game.state.currentDealer==this.playersName)
      {
        this.title = this.title + " (Dealer)";
      }
    }

  }
  
}
