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

  isCardHidden(card: CardinHand): boolean {
    if (card.isInVisible==true) {
      return true;
    } else if ( this.gc.game.state.currentPhase == GamePhase.discardingToBox ) {
      return false;
    } else if ( this.gc.game.state.currentPhase == GamePhase.pegging ) {
      if (card.played==false) {
        return false;
      } else if ( this.screenPosition === 'bottom') {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
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
      this.title = /* "["+ this.compassPoint +"] : " + */ this.playersName;
      if (this.gc.game.state.currentDealer==this.playersName)
      {
        this.title = this.title + " (Dealer)";
      }
    }

  }
  
}
