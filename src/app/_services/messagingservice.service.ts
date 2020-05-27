import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from '../../environments/environment';

import { GameData } from '../_classes/gamedata';
import { ServerGameData, ServerPlayerInfo, ServerGameStatus } from '../_classes/serverdata';
import { MessagesToServer, MessagesFromServer, MessageType, MessageHeader, GamePhase } from '../_classes/common';

/* MESSAGING GLOSSARY
----------------------

SOCKET MESSAGES
  Inbound
      connect         [name]                this player connected to server
      disconnect      []                    unknown
      playerjoined    [name]                a player joined on another connection
      playerleft      [name]                a player on another connection left
      gameready     []                   
      gameinitialsing []                    someone has invoked the 'start game' process ... and the server is preparing data
  Sent
      startgame       [ServerConfigData]    this player clicked start game button
*/


@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private socket: any;
  private subject = new Subject<any[]>();
  private connectionId: string;

  

  constructor() { }

  // https://socket.io/docs/emit-cheatsheet/
  setupSocketConnection(connectionId: string): boolean {
    this.connectionId = connectionId;
    this.socket = io(environment.SOCKET_ENDPOINT, {
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

    // onDisconnect: received when this connection is disconnected
    this.socket.on('disconnect', (data: string) => {
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
      // Server is initialising the game ... forward this message on 
      this.sendMessage( MessageType.game, MessageHeader.gameinitialising, name);
    });
    
    this.socket.on(MessagesFromServer.gameready, (serverGameData: ServerGameData) => {
      // Server has sent back initialised gameData object,
      // which something (the App) needs to copy into the local gamedata object,
      // after which the 'Startgame' event can be fired
      this.sendMessage( MessageType.game, MessageHeader.initgame, serverGameData);
    }); 

    this.socket.on(MessagesFromServer.refreshstate, (serverState: ServerGameStatus) => {
      // Server has updated the gameStatus object (i.e. a round is complete)
      // We have to forward this messgae on as we do not have access to the gameData object in this class
      this.sendMessage( MessageType.game, MessageHeader.refreshstate, serverState);
    });

    /**
     * Message from server to refresh the specified player's hand following a discard (of some sort) 
     */
    this.socket.on(MessagesFromServer.refreshplayerscards, (playerInfo: ServerPlayerInfo) => {
      // We have to forward this messgae on as we do not have access to the gameData object in this class
      this.sendMessage( MessageType.cards, MessageHeader.refreshplayerscards, playerInfo);
    });

    this.socket.on(MessagesFromServer.cycleplayer, (playerName: string) => {
      // We have to forward this message on as we do not have access to the gameData object in this class
      this.sendMessage( MessageType.controller, MessageHeader.cyclePlayer, playerName);
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

  startGame(gameData: GameData) {
    // TEll the server to start the game with the config data collected 
    this.socket.emit(MessagesToServer.startgame, gameData.config.dataforServer);
  }

  /*
  sendGameData( gameData: GameData) {
    this.socket.emit('gamedata', JSON.stringify(gameData) );
  }
  sendGameScores( scores: GameScore[]) {
    this.socket.emit('gamescores', JSON.stringify(scores) );
  }
  */
  
  refreshGame() {
    // for listening components to refresh any local variable dependant on game data
    this.sendMessage(MessageType.game, MessageHeader.refreshgame, "*");
  } 

  roundStatusChanged( newStatus: GamePhase) {
    // ??? why do we need to do this ???
    // TODO
    this.sendMessage(MessageType.game, MessageHeader.statusupdate, newStatus);
  }

  refreshCards( playersName: string ) {
    this.sendMessage(MessageType.cards, MessageHeader.refreshcards, playersName);
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
