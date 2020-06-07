import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { GameControllerService } from '../_services/gamecontroller.service';
import { MessageType, MessageHeader, GamePhase } from '../_classes/common';

import { CardinHand } from '../_classes/cardinhand';

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
  
  // Component parameters
  screenPosition: string = "";
  cssClassname: string = "";
  showCards: string = "false"; 
  
  // member variables
  playersName: string;              // the player's name for this view 
  playersIndex: number = -1;        // index of this player in gameData.activePlayers[]
  compassPoint: string = "";        // the compass point of this player
  title: string = "";               // for display on view      
  actionMessage: string = "";       // message / hint to show to player
  selectedCard: string;             // the card clicked in the view
  
  // Handy values to control view
  showButton: boolean = false;      // whether to show/hide the action button fo this view   
  buttonText: string="";
  assetsPath: string = environment.ASSETPATH;
  
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
    if (environment.DEBUG_SHOWALLHANDS==true) {
      showCards = true;
    }
    this.showButton = (this.screenPosition=="bottom");
    this.UpdateLocals();   
  }

  onInternalMessage(msg: any[]) {
    if (msg==undefined) 
       return;

    let msgheader = msg[1];
    switch ( msgheader ) {
      case MessageHeader.refreshgame: 
        this.UpdateLocals();
        break;
      case MessageHeader.gamestarted:
        this.UpdateLocals();
        break;
      case MessageHeader.statusupdate:
        this.UpdateLocals();
        break;
      default:
        break;
    }
  }

  isCardPlayable(card: CardinHand): boolean {
    var b: boolean;
    b = ( ( (this.gc.game.state.currentPhase==GamePhase.discardingToBox) || (this.gc.game.state.currentPhase==GamePhase.pegging) ) &&
              ( (card.isInVisible==false) 
                 && ( card.played==false)
                 && (this.playersName===this.gc.game.state.currentActivePlayer) 
                 && (this.screenPosition === 'bottom') ) );
    return b;
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
    // 

  }

  onSelectCard(card: CardinHand) {
    if ( (this.gc.game.state.currentPhase==GamePhase.cuttingForTurnup) ||
       (this.gc.game.state.currentPhase==GamePhase.showingHands) ||
        ((card.isInVisible==true) || (card.played===true)) ) {
      return;
    }
    if (! this.isCardPlayable(card) ) {
      return;
    }

    switch (this.gc.game.state.currentPhase) {
      case (GamePhase.pegging):
        // check if not over 31 ! // TO DO
        if (this.gc.game.pegging.currentTotal + card.cardValue > 31) {
          alert(" You cannot play that card. Current Total = " + this.gc.game.pegging.currentTotal);
          return;
        }
        // We are good to go with the discard operation
        this.selectedCard = card.card; 
        // Update the current player's list of discarded cards
        this.gc.game.addCardtoDiscardPile(this.playersName, card.card);

        this.gc.sendDiscard(this.playersName, card.card);
        break;
      case (GamePhase.discardingToBox):
        // check correct number of cards are ready to be discarded
        if ( this.gc.game.getNumDiscards(this.playersName) >= this.gc.game.state.requiredDiscardsforBox )
        {
          alert("You cannot discard anymore cards!");
        } else {
          // We are good to go with the discard operation
          this.selectedCard = card.card; 
          // Update the current player's list of discarded cards
          this.gc.game.addCardtoDiscardPile(this.playersName, card.card);
          // Now send a message to the discard pile so that is can display the updated discarded card
          this.gc.refreshDiscards( this.playersName );
        }
        break;
    }
 
  }

  onButtonClick() {
    switch (this.gc.game.state.currentPhase) {
      case (GamePhase.discardingToBox):
        // Have we got the correct number of cards?
        if (this.gc.game.getNumDiscards(this.playersName) < this.gc.game.state.requiredDiscardsforBox)
        {
          alert("You must discard " + this.gc.game.state.requiredDiscardsforBox + " cards to the box!");
        } else {
          // Yes - we are cleared to commit the discard
          // TO DO - NO !!!!! this.gc.game.addDiscardstoBox( this.playersName );
          // send a message that the players discard process is complete
          this.gc.playersBoxDiscardsComplete( this.gc.game.state.activePlayers[this.playersIndex] );
          // Now send the next player message
          this.gc.playersTurnComplete( this.playersName );
        }
        break;

      case (GamePhase.pegging):
        // Player clicked the [can't] go button ...
        this.gc.CannotGo( this.playersName );
        break;
    }
  }

  private UpdateLocals() {
    if (this.gc.game.config.isSetup!=true) {
      this.showButton = false;
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

    // Update view elements: title, message and button text
    if (this.gc.game.state.currentPhase == GamePhase.unknown) {
      this.buttonText = "";
      this.showButton = false;
    } else if (this.gc.game.state.currentPhase==GamePhase.cuttingForTurnup) {
      this.actionMessage = "Waiting for " + this.gc.game.state.currentActivePlayer +" to cut ...";
      this.updateButtonVisibility( false, "" );
    } else {
      // Do different things if this is the active player's view
      if (this.playersName===this.gc.game.state.currentActivePlayer) {
        switch (this.gc.game.state.currentPhase) {
          case (GamePhase.discardingToBox):
            if (this.gc.game.whoAmI == this.gc.game.state.currentDealer ) {
              this.actionMessage = "Select cards for your box ...";
            } else {
              this.actionMessage = "Select cards for " + this.gc.game.state.currentDealer +"'s box ...";
            }
            this.updateButtonVisibility( true, "Discard" );
            break;
          case (GamePhase.pegging):
            if ( this.gc.game.state.canPlayerGo( this.playersIndex, this.gc.game.pegging.currentTotal) ) {
              this.actionMessage = "Select card to play ...";
              this.updateButtonVisibility( false, "" );
            } else {
              // if can't go ...
              this.actionMessage = "";
              this.updateButtonVisibility( true, "Go" );
            }
        }
      } else {  
        let submsg = "";
        switch (this.gc.game.state.currentPhase) {
          case (GamePhase.discardingToBox):
            submsg = " to discard ...";
            break;
          case (GamePhase.pegging):
            submsg = " to play ...";
            break;
        }
        this.actionMessage = "Waiting for " + this.gc.game.state.currentActivePlayer + submsg;
        this.updateButtonVisibility( false, "not your turn" );
      }
    }
  }
  
  updateButtonVisibility( show: boolean, caption: string) {
    if (environment.DEBUG_SHOWALLHANDS==true) {
      this.showButton = true;
    } else if (this.screenPosition==='bottom') {
      this.showButton = show;
    } else {
      this.showButton = false;
    }
    this.buttonText = caption;
  }

}
