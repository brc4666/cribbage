import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { GameData } from '../_classes/gamedata';

import { GameControllerService } from '../_services/gamecontroller.service';
import { MessageType, MessageHeader, GamePhase } from '../_classes/common';

@Component({
  selector: 'app-gameover',
  templateUrl: './gameover.component.html',
  styleUrls: ['./gameover.component.css', '../commonstyles.css']
})
export class GameoverComponent implements OnInit, OnDestroy {

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = [MessageType.game];
  private element: any;

  title: string = "";
  whoWon: string  = "";
  wonBy: number = 0;
  comment : string = "";

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
    let winnersIndex = 0;
    this.wonBy = 121 - this.gc.game.scoring.playerScores[1].score;
    if (this.gc.game.scoring.playerScores[1].score > this.gc.game.scoring.playerScores[0].score) {
      winnersIndex = 1;
      this.wonBy = 121 - this.gc.game.scoring.playerScores[0].score;
    }

    this.title = "Congratulations to ";
    if (this.gc.game.state.numActivePlayers>2 ) {
      this.title += "the " + this.gc.game.scoring.playerScores[1].displayname;
    } else {
      this.title += this.gc.game.scoring.playerScores[1].displayname;
    }
    this.title += " who won by " + this.wonBy + " points.";

    if ( (this.gc.game.state.numActivePlayers>2 ) && ( "M&Ms" == this.gc.game.scoring.playerScores[1].displayname) ) {
      this.comment = "Oh ! Come on Matthew - you have to do better than that !";
    } else if (this.wonBy <= 5) {
      this.comment = "Wow ! That was a close one !";    
    } else if (this.wonBy <= 10) {
      this.comment = "Close ... but not close enough !"; 
    } else if (this.wonBy <= 20) {
      this.comment = "A comfortable victory !"; 
    } else if (this.wonBy > 20) {
      this.comment = "Ouch ! That was a bit of a drubbing, eh?"; 
    }      
  
  }

  onButtonClick() {
    // The player has finished viewing the game over dialog, so 
    // send messgae to server to start new game
    this.gc.sendGameComplete();
  }

  onInternalMessage(msg: any[]) {

  }

}
