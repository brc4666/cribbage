import { Component, OnInit, OnDestroy } from '@angular/core';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

import { GameControllerService } from '../_services/gamecontroller.service';
import { MessageType, MessageHeader } from '../_classes/common';

import { DiscardedCard } from '../_classes/cardinhand';
import { GameData } from '../_classes/gamedata';

@Component({
  selector: 'app-discardpile',
  inputs: ['screenPosition'],
  templateUrl: './discardpile.component.html',
  styleUrls: ['./discardpile.component.css']
})
export class DiscardpileComponent implements OnInit, OnDestroy {

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = [MessageType.game, MessageType.cards];

  // Inputs ... @Input() gameData: GameData;

  // parameters supplied to component
  screenPosition: string = "";

  // 
  playersName: string = "";         // the player's name for this view 
  compassPoint: string = "";        // the compass point of this player
  cardsinDiscardPile: DiscardedCard[] = [];
  selectedCard: string;
  isViewEnabled: boolean = true;   // whether the component is enabled for use (for just there as a placeholder)

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
    this.isViewEnabled = (this.gc.game.state.numActivePlayers <= 2)  
                          || ((this.screenPosition=="top") ||(this.screenPosition=="bottom") );
    this.isViewEnabled =true; // TEMP ???

    // Create one invisible element in the discard pile to size the container
    // TO DO
    this.cardsinDiscardPile.push( new DiscardedCard(1, 'ad', false)); 
    this.refreshDiscardPile();
  } 

  onInternalMessage(msg: any[]) {
    if (!this.isViewEnabled) return;
    if (msg==undefined) 
       return;

    let msgheader = msg[1];
    switch ( msgheader ) {
      
      case MessageHeader.refreshgame:  
        this.refreshDiscardPile();     
        // TODO ... Uncommenting tha above causes problems ... and not sure why
        //          This message is invoked only by the appComponent.
        //          The failure: having received this message, the component does not seem
        //                       to receive any more messages !!!!
        //          The message that causes the failure appears to be the one (in appComponent)
        //          after this.gc.game.initialiseGame ... 
        //          ??? Is there some malformed data after initialiseGame ?????? 
        //            Tried changing the 'refreshgame' message to 'refreshcards' ... smae problem.
        //            So malformed data could still be the problem ... OR ...
        //            ??? the message is being received by hidden components - 
        //                they are hidden because they are non active players ...
        //                hence the calls into their activePlayer[] functions are likely to return garbage! ???  
        break;
      case MessageHeader.refreshdiscards:
        this.refreshDiscardPile();
        break;      
      default:
        break;
    }
  }

  refreshDiscardPile() {
    if (!this.gc.game.config.isSetup) 
      return;

    this.playersName = this.gc.game.whoIsSeatedAt(this.screenPosition);
    if (""==this.playersName)
      return;

    this.compassPoint = this.gc.game.playersCompassPoint(this.playersName);

    // get a copy of discarded cards from the global controller
    let discards:string[] = this.gc.game.getDiscardedCards(this.playersName);
    if (discards.length <=0 ) {
      // The player has not discarded a card yet,
      // so we'll add a dummy invisible card to the local discard pile to size the container
      if (this.cardsinDiscardPile.length>1) {
        this.cardsinDiscardPile.splice( 1, this.cardsinDiscardPile.length);
      }
      this.cardsinDiscardPile.splice( 0, 1, new DiscardedCard(1, 'ad', false));
      //this.removeMutlipleInvisibeCards(1);

      /*
      this.cardsinDiscardPile.splice(0, this.cardsinDiscardPile.length);
      if (this.cardsinDiscardPile.length==0) {
        this.cardsinDiscardPile.push( new DiscardedCard(1, 'ad', false));
      }
      */
    } else {
        // TODO - Stop empyting the discard pile to prevent flicker

            // Clear the local discard array to remove any dummy cards etc.
           // this.cardsinDiscardPile.splice(0, this.cardsinDiscardPile.length);

        // add all the cards in the global controller to local array
        for (let i=0; i < discards.length; i++) {
          this.cardsinDiscardPile.splice(i, 1 , new DiscardedCard(i+1, discards[i], true) );
          //this.cardsinDiscardPile.push( new DiscardedCard(i+1, discards[i], true) );
        }

        if (1) {
          // Now there are some card(s) in the discard pile,
          // we will to change the offset image to increase the overlap as the 
          // number of cards in the pile increaseses
          let factor = 10 + (this.cardsinDiscardPile.length * 5);
          for (let i=0; i< this.cardsinDiscardPile.length; i++) {
            this.cardsinDiscardPile[i].offset = `-${i * factor}%;`;
          }
        } else {
          let factor = 10 + (this.cardsinDiscardPile.length * 2);
          for (let i=0; i< this.cardsinDiscardPile.length; i++) {
            if (i<this.cardsinDiscardPile.length-1) {
              // this.cardsinDiscardPile[i].setOverlappedImage();
            }
            this.cardsinDiscardPile[i].offset = `0;`;
          }
        }
      }
  }

  /*
  removeMutlipleInvisibeCards(startIndex: number) {
    for (let i = startIndex; i < this.cardsinDiscardPile.length; i++) {
      if (this.cardsinDiscardPile[i].isVisible==false) {
        this.cardsinDiscardPile.splice(i, 1);
      }
    }
  }
  */
}
