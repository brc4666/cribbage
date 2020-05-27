import { Component, OnInit, OnDestroy } from '@angular/core';
import { map, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { environment } from '../environments/environment';
import { GameControllerService } from './_services/gamecontroller.service';

import { MessageType, MessageHeader, GamePhase } from './_classes/common';
import { ServerGameData, ServerGameStatus } from './_classes/serverdata';
import { ScoreHand } from './_classes/scorer';
import { CardinHand } from './_classes/cardinhand';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy  {

  title = 'Crib Night Cribbage';

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = [MessageType.controller, MessageType.game, MessageType.cards];

  showCut = false;
  localmessages: string[] = [];

  showAlert = false;

  constructor( public gc: GameControllerService ) {
    this.subscription = this.gc.getMessage()
                        .pipe( filter( (msg: any[]) => (this.msgstoProcess.indexOf(msg[0])>=0) ) ) 
                        .subscribe( (message) => { this.onInternalMessage(message) } );
  }

      
  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    alert ('In App OnDestroy() ...');
    this.gc.disconnectMe( this.gc.game.whoAmI );
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    // Initialse potential players
    this.gc.game.addPotentialPlayer("Brian", "N");
    this.gc.game.addPotentialPlayer("Kate", "S");
    this.gc.game.addPotentialPlayer("Matthew", "W");
    this.gc.game.addPotentialPlayer("Mel", "E");

    // and for the purposes of creating a nice celan but empty display ...
    // add 4 x dummy active players and an invisible card in each hand.
    this.gc.game.state.addActivePlayer("","N");
    this.gc.game.state.addActivePlayer("","S");
    this.gc.game.state.addActivePlayer("","E");
    this.gc.game.state.addActivePlayer("","W");
    this.gc.game.state.activePlayers[0].hand.push(new CardinHand('ad', false, true));
    this.gc.game.state.activePlayers[1].hand.push(new CardinHand('ad', false, true));
    this.gc.game.state.activePlayers[2].hand.push(new CardinHand('ad', false, true));
    this.gc.game.state.activePlayers[3].hand.push(new CardinHand('ad', false, true));

    var scorer: ScoreHand = new ScoreHand;
    var hand: CardinHand[] = [];
    var turnup: CardinHand;

    /*
    hand.push ( new CardinHand("tc", true) );
    hand.push ( new CardinHand("ts", true) );
    hand.push ( new CardinHand("js", true) );
    hand.push ( new CardinHand("9s", true) );
    let d = scorer.pegRuns( hand );
    d = d;
*/
 
    hand.push ( new CardinHand("8s", true) );
    hand.push ( new CardinHand("7c", true) );
    hand.push ( new CardinHand("9d", true) );
    hand.push ( new CardinHand("9h", true) );
       turnup = new CardinHand("3c", true);
    scorer.calcScore( hand, turnup); // should be 4
    console.log('Debug score was: ' + scorer.score);
    for (let d = 0; d < scorer.scoreDetailsLength; d++) {
      console.log ('   ' + scorer.scoreDetails(d) );
    }
   /*
    hand.push ( new CardinHand("qs", true) );
    hand.push ( new CardinHand("js", true) );
    hand.push ( new CardinHand("ks", true) );
    hand.push ( new CardinHand("ts", true) );
    turnup = new CardinHand("5s", true);
    scorer.calcScore( hand, turnup); // should be 13 +flush = 18
    
    
    hand.push ( new CardinHand("3s", true) );
    hand.push ( new CardinHand("2s", true) );
    hand.push ( new CardinHand("4s", true) );
    hand.push ( new CardinHand("2d", true) );
    turnup = new CardinHand("5s", true);
    scorer.calcScore( hand, turnup); // should be 10
    */
  
    if (environment.DEBUG_NO_SERVER) {
      this.gc.game.debugSetup();
      this.gc.game.state.currentPhase = GamePhase.discardingToBox;
      this.gc.debug_roundStatusChanged(this.gc.game.state.currentPhase);

      this.showAlert = true;
      
      this.gc.setupSocketConnection(this.gc.game.whoAmI);
      this.gc.connectMe(this.gc.game.whoAmI); 
    }

  }

  onInternalMessage(msg: any[]) {
    if (msg==undefined) 
       return;

    // Process controller message
    if ( msg[0] == MessageType.controller)
    {
      if ( msg[1] == MessageHeader.cyclePlayer) {
        // Change active player
        this.gc.game.ChangePlayer();
        // the current player has finished their turn
        if ( this.gc.game.hasGameFinished()) {       
          // The game has finished !! TO DO 
        
        } else if (this.gc.game.isRoundComplete()) { 
          // the current 'round' is complete
          // so initialise next phase
          this.gc.game.ChangePhase();
          this.gc.refreshGame();
        } else {
          // Or if we are just in the middle of a round
          this.gc.refreshGame();
        }
      }
    } else if ( msg[0] == MessageType.game) {
      switch (msg[1]) {
        case MessageHeader.initgame:
          break;
        case MessageHeader.refreshstate:
          break;
      }
    } else if ( msg[0] == MessageType.cards) {
      switch (msg[1]) {
        case MessageHeader.refreshplayerscards:
          break;
      }
    } 

  }

  doCutDeck() : boolean {
    return ( (this.gc.game.state.currentPhase==GamePhase.cuttingForTurnup) && (this.gc.game.state.currentActivePlayer == this.gc.game.whoAmI ) );
  }

}
