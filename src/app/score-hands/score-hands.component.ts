import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { GameControllerService } from '../_services/gamecontroller.service';
import { MessageType, MessageHeader, GamePhase } from '../_classes/common';

import { CardinHand } from '../_classes/cardinhand';
import { ScoreHand } from '../_classes/scorer';

@Component({
  selector: 'app-score-hands',
  templateUrl: './score-hands.component.html',
  styleUrls: ['./score-hands.component.css', '../commonstyles.css']
})
export class ScoreHandsComponent implements OnInit, OnDestroy {

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = [MessageType.game];

  private element: any;
  assetsPath: string = environment.ASSETPATH;

  playersName: string;              // the player's name for this view 
  playersIndex: number = -1;        // index of this player in gameData.activePlayers[]
  title: string = "";               // for display on view    
  buttonText = "";
  showButton: boolean = false;      // whether to show/hide the action button fo this view 
  waitmessage = "";                 // message to display if not active player
  cards: CardinHand[] = [];
  turnup: CardinHand;
  scorer: ScoreHand = new ScoreHand;

  constructor(private el: ElementRef,  public gc: GameControllerService) { 
    this.element = el.nativeElement;
    // subscribe to get messages
    this.subscription = this.gc.getMessage()
                  .pipe( filter( (msg: any[]) => (this.msgstoProcess.indexOf(msg[0])>=0) ) ) 
                  .subscribe( (message: any[]) => { this.onInternalMessage(message) } );
  }
    
  ngOnDestroy() {
      // unsubscribe to ensure no memory leaks
      this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.turnup = new CardinHand( this.gc.game.state.turnUpCard, true );
    this.UpdateLocals();
  }

  onInternalMessage(msg: any[]) {
    if (msg==undefined) 
       return;

    let msgheader = msg[1];
    switch ( msgheader ) {
      case MessageHeader.refreshgame: 
        if (this.gc.game.state.currentPhase == GamePhase.showingHands) {
          this.UpdateLocals();
        }
        break;
    }
  }

  onButtonClick() {
    // The player has finished viewing his hand, so 
    // send messgae to server to update score and cycle to next player (if there is one)
    // this.gc.game.state.shownHandsCount
    this.gc.sendPlayerShowHandComplete(this.scorer.score);
  }

  onRescoreClick() {
    // Score the (correct) hand
    if (this.gc.game.scoreBox == true) {
      // Get the box
      this.scorer.calcScore( this.gc.game.theBox.cards, this.turnup, true ) ;
    } else {
      this.scorer.calcScore( this.gc.game.state.activePlayers[this.playersIndex].hand, this.turnup ) ;
    }
  }

  private UpdateLocals() {
    // get some handy local variables
    this.playersName = this.gc.game.state.currentActivePlayer;
    this.playersIndex = this.gc.game.getActivePlayerIndex( this.playersName);

    // Score the (correct) hand
    if (this.gc.game.scoreBox == true) {
      // Get the box
      this.scorer.calcScore( this.gc.game.theBox.cards, this.turnup, true ) ;
    } else {
      this.scorer.calcScore( this.gc.game.state.activePlayers[this.playersIndex].hand, this.turnup ) ;
    }

    // Sort out the title
    if (this.playersName == this.gc.game.whoAmI) {
      this.title = "Your ";
    } else {
      this.title = this.playersName + "'s ";
    }
    if (this.gc.game.scoreBox == true) {
        this.title = this.title + "box scores ";
    } else {
        this.title = this.title + "hand scores " ;
    }
    this.title = this.title + this.scorer.score;

    // Update the cards to be shown
    this.cards.splice(0, this.cards.length);
    // now add all the cards in the global controller to local array
    if (this.gc.game.scoreBox == true) {
      var boxcards: CardinHand[] = this.gc.game.theBox.cards;
      for (let i=0; i < boxcards.length; i++ ) {
        this.cards.push( boxcards[i] );
      }
    } else {
      for (let i=0; i < this.gc.game.state.activePlayers[this.playersIndex].hand.length; i++) {
        this.cards.push( new CardinHand(this.gc.game.state.activePlayers[this.playersIndex].hand[i].card, true) );
      }
    }
    // Now add an invisible card (just for spacing in the view)
    this.cards.push( new CardinHand("ad", false, true) );
    // anf finally add the turn up card
    this.cards.push( this.turnup );

    // Update view elements: title, message and button text
    if (this.playersName == this.gc.game.whoAmI) {
      this.buttonText = "Take Score";
      this.showButton = true;
    } else {
      this.showButton = false;
      this.waitmessage = "Waiting for " + this.gc.game.state.currentActivePlayer + " to take ...";
    }
  }


}
