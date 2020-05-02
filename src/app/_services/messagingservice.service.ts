import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from '../../environments/environment';

import { GameStateData } from '../_classes/gamedata';
import { MessageType, MessageHeader } from '../_classes/common';


/* MESSAGING GLOSSARY
----------------------

SOCKET MESSAGES
  Inbound
      connect       [name]                this player connected to server
      disconnect                    unknown
      playerjoined  [name]                a player joined on another connection
      playerleft    [name]                a player on another connection left
      gamestarted   []                    start game message
  Sent
      startgame     [numPlayers]          this player clicked start game button



INTERNAL MESSAGES
  gamedata - master game messages            
      initgame        [ServerGameState]   initialise gameData object with data from server
      refresh         []                  refresh components with data dependant on gameData
  players - players joining and leaving        
      joined_as       [name]              unknown
      playerjoined    [name]              another player joined 
      playerleft      [name]              a player on another connection left
  connections     
      disconnection
  cards
      refreshhands    []                  cards in hands need refreshing


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
      this.sendMessage( MessageType.connection, MessageHeader.disconnection , data );
    });

    // onPlayerJoined: received when a player, other than this player, joins the game
    this.socket.on('playerjoined', (name: string) => {
      this.sendMessage( MessageType.players, MessageHeader.playerjoined, name );
    });

    // onPlayerLeft: received when a player, other than this player, leaves the game
    this.socket.on('playerleft', (name: string) => {
      this.sendMessage( MessageType.players, MessageHeader.playerleft , name );
    });

    this.socket.on('gamestarted', (state: GameStateData) => {
      this.sendMessage( MessageType.game, MessageHeader.initgame, state);
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

  startGame(numPlayers: number) {
    this.socket.emit('startgame', numPlayers);
  }

  refreshGame() {
    // for listening components to refresh any local variable dependant on game data
    this.sendMessage(MessageType.game, MessageHeader.refreshgame, "*")
  }

  refreshHands() {
    this.sendMessage(MessageType.cards, MessageHeader.refreshcards, "*");
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
