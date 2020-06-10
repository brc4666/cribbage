import { Component, OnInit, OnDestroy } from '@angular/core';
import { map, filter } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { Subscription } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import { environment } from '../environments/environment';
import { GameControllerService } from './_services/gamecontroller.service';

import { MessageType, MessageHeader, GamePhase } from './_classes/common';
import { ScoreHand } from './_classes/scorer';
import { CardinHand } from './_classes/cardinhand';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'text', /* ''application/json', */
    observe: 'response',
    Authorization: 'my-auth-token'
  })
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy  {

  title = 'Crib Night Cribbage';
  private serverUrl = environment.HTTPSERVER_URL;
  

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = [MessageType.controller, MessageType.game, MessageType.cards];

  showCut = false;
  localmessages: string[] = [];

  showAlert = false;

  constructor( private http: HttpClient, public gc: GameControllerService ) {
    this.subscription = this.gc.getMessage()
                        .pipe( filter( (msg: any[]) => (this.msgstoProcess.indexOf(msg[0])>=0) ) ) 
                        .subscribe( (message) => { this.onInternalMessage(message) } );
  }

      
  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.gc.disconnectMe( this.gc.game.whoAmI );
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.gc.game.serverAddress = environment.SOCKET_ENDPOINT;
    /*
    this.getPort().subscribe( (data:string) => {
      console.log('Processing response from getPort...' + data);
      this.gc.game.serverPort = data;
      this.gc.game.serverAddress = environment.SOCKET_ENDPOINT;
    });
    */

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

 
    hand.push ( new CardinHand("8h", true) );
    hand.push ( new CardinHand("8d", true) );
    hand.push ( new CardinHand("7s", true) );
    hand.push ( new CardinHand("7c", true) );
       turnup = new CardinHand("9h", true);
    scorer.calcScore( hand, turnup); // should be 4
    console.log('Debug score was: ' + scorer.score);
    for (let d = 0; d < scorer.scoreDetailsLength; d++) {
      console.log ('   ' + scorer.scoreDetails(d) );
    }
  */
 alert("Width:" + window.innerWidth + '/Height:' + window.innerHeight);
  
    if (environment.DEBUG_NO_SERVER == true) {
      this.gc.game.debugSetup();


      this.showAlert = true;


      this.gc.game.config.isSetup = true;
      this.gc.game.state.currentPhase = GamePhase.pegging;
      this.gc.debug_roundStatusChanged(this.gc.game.state.currentPhase);



      // while ( window.innerWidth < window.innerHeight) {
       //alert("Please rotate your device !");
      // }

      alert("Width:" + window.innerWidth + '/Height:' + window.innerHeight);
      //alert(window.screen.availHeight);

      // this.gc.setupSocketConnection(this.gc.game.whoAmI);
      // this.gc.connectMe(this.gc.game.whoAmI); 
    }

  }

  onInternalMessage(msg: any[]) {
    if (msg==undefined) 
       return;

    /*
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
    */

  }

  doCutDeck() : boolean {
    return ( (this.gc.game.state.currentPhase==GamePhase.cuttingForTurnup) && (this.gc.game.state.currentActivePlayer == this.gc.game.whoAmI ) );
  }

  getPort(): Observable<string> {
     return this.http.get<string>(this.serverUrl+'/port')
        .pipe(
          retry(5),
          tap(_ => console.log('returning port ...')),
          catchError(this.handleError)
        );
  }

  getPortText() : Observable<string> {
    return this.http.get<string>(this.serverUrl + '/port', httpOptions );
  }
  


  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.log(`'An error occurred:' ${error.error.message}`);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.log(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError( 'Something bad happened; please try again later.');
  }

}
