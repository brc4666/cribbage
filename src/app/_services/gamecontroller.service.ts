import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import * as io from 'socket.io-client';

import { GameData } from '../_classes/gamedata';
import { ServerGameData, ServerPlayerInfo, ServerGameStatus, ServerPeggingData, ServerBoxData, ServerGameScores } from '../_classes/serverdata';
import { MessagesToServer, MessagesFromServer, MessageType, MessageHeader, GamePhase } from '../_classes/common';

@Injectable({
  providedIn: 'root'
})
export class GameControllerService {
  private socket: any;
  private subject = new Subject<any[]>();
  private connectionId: string;

  game = new GameData();
  
  
  constructor() {
   }

  // https://socket.io/docs/emit-cheatsheet/
  setupSocketConnection(connectionId: string): boolean {
    this.connectionId = connectionId;
    this.socket = io(this.game.serverAddress , {  // + ":"+ this.game.serverPort
                  'forceNew':true, 
                  query: { token: connectionId }
                  });
    
    /* 
    ***** Now to define function to process messages received from the server
    */

    // onConnect: received when the socket connection established
    this.socket.on('connect', (data: string) => {
      this.sendMessage( MessageType.players, MessageHeader.joinedas, this.connectionId );
    });

    // onDisconnect: received when the server disconnects from this client 
    this.socket.on('disconnect', (data: string) => {
      alert('The server disconnected !');
      // TO DO - what ?????
      console.log(data);
      this.sendMessage( MessageType.controller, MessageHeader.disconnection , data );
    });

    // onPlayerJoined: received when a player, other than this player, joins the game
    this.socket.on('playerjoined', (name: string) => {
      this.sendMessage( MessageType.players, MessageHeader.playerjoined, name );
    });

    // onPlayerLeft: received when a player, other than this player, leaves the game
    this.socket.on('playerleft', (name: string) => {
      this.sendMessage( MessageType.players, MessageHeader.playerleft , name );
    });

    this.socket.on(MessagesFromServer.gameinitialising, (name: string) => {
      // Server is initialising the game ... forward this status message on 
      this.sendMessage( MessageType.game, MessageHeader.gameinitialising, name);
    });
    
    /**
     * Server has sent back initialised gameData object,
     * which needs to be copied into the controller 'game' object,
     */
    this.socket.on(MessagesFromServer.gameready, (jsondata: string) => {
      // Initialise local game data object with info gotten from server
      // includes core game info (players name, number, compass position, etc)

      datafromServer: ServerGameData;
      let datafromServer = JSON.parse( jsondata ) ;

      this.game.initialiseGame( datafromServer );

      if ( this.game.state.currentPhase == GamePhase.cuttingForTurnup) {
        alert('Forced to cutting for turnup phase ...!')
      } else if ( this.game.state.currentPhase == GamePhase.pegging) { 
        alert('Forced to pegging phase ...!')
      } else if ( this.game.state.currentPhase == GamePhase.showingHands) {
        alert('Forced to scoring hands phase ...!')
      }

      // Now tell all components to refresh themselves
      this.sendMessage( MessageType.game, MessageHeader.gamestarted, "unused");

      // Could use this for a nifty modal to allow player to control when deal happens 
      // and include a re-shuffle option
      /* TODO - dont need this as being done by the server !
          // Cycle onto first round status - players need to discard card(s) to the box
          this.game.state.currentPhase = GamePhase.discardingToBox;
          this.roundStatusChanged(this.gc.game.state.currentPhase);
      */
    } ); 

    /**
     * We've received what the turn up card is
     */
    this.socket.on(MessagesFromServer.turnupcard, (turnupcard: string, serverBox: ServerBoxData) => {
      // Store the box in the local object
      this.game.applyServerBox( serverBox );
      // Store the turn up in local object
      this.game.state.turnUpCard = turnupcard;
      if ('j'==turnupcard.substr(0,1) ) {
        this.game.state.publicMessage = this.game.state.currentDealer + ' scores 2 for his Heels';
        this.game.scoring.incrementPlayersScore( this.game.state.activePlayers[ this.game.getActivePlayerIndex(this.game.state.currentDealer) ].compassSeat, 2);
      }
      // send message for turnup component to refresh
      this.sendMessage(MessageType.cards, MessageHeader.refreshturnup, "*");
      // now advance to next phase of the game
      this.game.state.currentPhase = GamePhase.pegging;
      this.refreshGame();
    });

    this.socket.on(MessagesFromServer.playerpeggingcomplete, ( serverState: ServerGameStatus,
                                                               serverPeggingInfo :ServerPeggingData,
                                                               serverScores: ServerGameScores  ) => {
      // the server has processed a player has completed their turn in the pegging phase
      this.game.state.applyServerState( serverState );
      this.game.applyServerPeggingData( serverPeggingInfo );
      this.game.scoring.applyServerScores( serverScores );
      this.refreshGame();
    } ); 

    
    this.socket.on(MessagesFromServer.startshowhandsequence, ( serverState: ServerGameStatus,
                                                               serverPeggingInfo :ServerPeggingData,
                                                               serverScores: ServerGameScores ) => {
      // the pegging phase is over ...  
      // so update the results of the last peg card
      this.game.state.applyServerState( serverState );
      this.game.applyServerPeggingData( serverPeggingInfo );
      this.game.scoring.applyServerScores( serverScores );
      if (this.game.state.currentPhase == GamePhase.showingHands) {
        // so the pegging phase is over ... make sure we clear all the discard pils to tidy up the view
        this.game.state.clearAllDiscards();
      }
      this.game.scoreBox = false;
      this.refreshGame();
    } ); 
  
    /**
     * MEssage from server to cycle the show hands phase
     */
    this.socket.on(MessagesFromServer.nextshowhand, ( serverScores: ServerGameScores, nextPlayer : string, scoreBox : boolean) => {
      // increment score from previous player's hand 
      this.game.scoring.applyServerScores( serverScores );
      // set the viewBox flag
      this.game.scoreBox = scoreBox;    
      // cycle to the next player
      this.game.state.currentActivePlayer = nextPlayer; 
      // TODO - just need to refresh show hands
      this.refreshGame();
    } ); 

    this.socket.on(MessagesFromServer.nexthand, ( serverState: ServerGameStatus, serverScores: ServerGameScores) => {
      // increment score from previous player's hand 
      this.game.scoring.applyServerScores( serverScores );
      this.game.state.applyServerState( serverState );
      this.refreshGame();
    } ); 

    this.socket.on(MessagesFromServer.gameover, ( serverState: ServerGameStatus, serverScores: ServerGameScores ) => {
      // increment score from previous player's hand 
      this.game.scoring.applyServerScores( serverScores );
      this.game.state.applyServerState( serverState );
      this.refreshGame();
    } ); 

    this.socket.on(MessagesFromServer.refreshstate, (serverState: ServerGameStatus) => {
      // Server has updated the gameStatus object (i.e. a round is complete)
      this.game.state.applyServerState( serverState );
      this.refreshGame();
    });

    /**
     * Message from server to refresh the specified player's hand following a discard (of some sort) 
     */
    this.socket.on(MessagesFromServer.refreshplayerscards, (playerInfo: ServerPlayerInfo) => {
      this.game.state.applyServerHand( playerInfo  );
      this.refreshGame();
    });

    this.socket.on(MessagesFromServer.cycleplayer, (nextPlayer: string) => {
      this.game.state.currentActivePlayer = nextPlayer;
      this.refreshGame();
    });

    return true;
  }


  // called when this player attempts to connect to the game
  connectMe(name: string) {
    // send to the server player joining message to server with the player's name
    this.socket.emit('playerjoining', name);
  }

  // called when this player elects to leave the game (and thereby disconnect)
  disconnectMe(name: string) {
    // tell the server the player has left ...
    this.socket.emit('playerleft', name);
    // disconnect the currentsocket
    this.socket.disconnect();
  }

  startGame() {
    // Tell the server to start the game with the config data collected 
    this.socket.emit(MessagesToServer.startgame, this.game.config.dataforServer);
  }

  sendTurnUp( turnUpCardIndex: number ) {
    // Tell the server the index of the turnup card is  
    this.socket.emit(MessagesToServer.turnupcard, turnUpCardIndex);
  }

  sendDiscard( playersName :string, cardname :string) {
    // Tell the server who discarded what  
    this.socket.emit(MessagesToServer.playerdiscarded, playersName, cardname);
  }

  sendPlayerShowHandComplete(score : number) {
    this.socket.emit(MessagesToServer.viewhandcomplete, this.game.state.currentActivePlayer, score  );
  }

  sendGameComplete() {
    this.socket.emit(MessagesToServer.gamecomplete);
  }


  CannotGo( playersName :string ) {
    // Tell the server the player cannot go
    this.socket.emit(MessagesToServer.playercannotgo, playersName);
  }

  refreshGame() {
    // for listening components to refresh any local variable dependant on game data
    this.sendMessage(MessageType.game, MessageHeader.refreshgame, "*");
  } 

  refreshDiscards( playersName: string ) {
    this.sendMessage(MessageType.cards, MessageHeader.refreshdiscards, playersName);
  }

  /**
   * Handler for signalling the player has completed the required discards for the box.
   * 
   * This sends a messgage to the server with the players updated hand[] and the box[].
   * The server will update the master server object and then issue a message back to 
   * all other components to refresh that inidividual player's hand[] information.
   *
   * @param {ServerPlayerInfo} playerInfo playerInfo from the activePlayer[] that has already been updated 
   *                             after all appropriate discard operations have been complete
   */
  playersBoxDiscardsComplete( playerInfo: ServerPlayerInfo ) {
    this.socket.emit(MessagesToServer.discardedtobox, playerInfo);
  }

  /**
   * Message for signalling the player has completed all actions for his turn.
   * 
   * This notifies the server the player has finished, which in turn sends a message to
   * all connections to cycle the actve player.
   * 
   * @param {string} playersName: the name of the player whose turn is complete
   */
  playersTurnComplete( playersName: string ) {
    // this is sent from a component, but all the logic will be handled in the server !
    //TODO - Do we need this ? this.socket.emit(MessagesToServer.turncomplete, playersName);
  }

  debug_roundStatusChanged( newStatus: GamePhase) {
    this.sendMessage(MessageType.game, MessageHeader.statusupdate, newStatus);
  }

  sendMessage(type: MessageType, eHeader: MessageHeader, data: any) {
    this.subject.next( [type, eHeader, data] );
  }

  clearMessage() {
      this.subject.next();
  }

  getMessage(): Observable<any> {
      return this.subject.asObservable();
  }
}
