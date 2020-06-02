import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { GameControllerService } from '../_services/gamecontroller.service';
import { MessageType, MessageHeader } from '../_classes/common';

@Component({
  selector: 'app-playerregistration',
  templateUrl: './playerregistration.component.html',
  styleUrls: ['./playerregistration.component.css']
})

export class PlayerRegistrationComponent implements OnInit, OnDestroy {

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = [MessageType.game, MessageType.players];

  private element: any;
  closeButtonText: string;
  closeButtonActive: boolean = false;
  private selectedPlayerIndex: number = -1;
  private numConnections: number = 0;
  localmessages: string[] = [];


  constructor(private el: ElementRef,
              public gc: GameControllerService) 
  { 
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
    this.countConnections();
  }

  onInternalMessage(msg: any[]) {
    if (undefined==msg)
      return;

    let msgheader = msg[1];
    switch (msgheader) {
      case MessageHeader.playerjoined: 
        let newplayerName = msg[2];   
        for (let i=0; i<this.gc.game.config.potentialPlayers.length; i++) {
          if ( (i != this.selectedPlayerIndex) && (this.gc.game.config.potentialPlayers[i].name === newplayerName) ) { 
            this.gc.game.config.potentialPlayers[i].isConnected = true;
          }
        }
        this.countConnections();
        break;

      case MessageHeader.playerleft:   
        let leftplayerName = msg[2];
        for (let i=0; i<this.gc.game.config.potentialPlayers.length; i++) {
          if ( (i != this.selectedPlayerIndex) && (this.gc.game.config.potentialPlayers[i].name === leftplayerName) ) { 
            this.gc.game.config.potentialPlayers[i].isConnected = false;
          }
        }
        this.countConnections();
        break;

      case MessageHeader.gameinitialising:
        // someone else has clicked 'start game' ... and this messgae is to stop others clicking the same button!
        this.closeButtonText = "Game initialising ...";
        break;
      
      case MessageHeader.gamestarted:       
        // The game is off and running !!!
        this.gc.game.setwhoIAm( this.gc.game.config.potentialPlayers[this.selectedPlayerIndex].name );
        this.element.style.display = 'none';
        break;
    }
  }

  isStartButtonSelectable() : boolean {
    return ( (2 == this.numConnections) || (4 == this.numConnections) );
  }

  onStartGameButton() {
    if (this.isStartButtonSelectable()) {
      this.gc.game.setwhoIAm( this.gc.game.config.potentialPlayers[this.selectedPlayerIndex].name );
      this.element.style.display = 'none';
      this.gc.startGame();
    }
  }

  onClickConnect(playerIndex: number) {
    if (this.isButtonSelectable(playerIndex) ) {
      this.gc.game.config.potentialPlayers[playerIndex].isConnected = !this.gc.game.config.potentialPlayers[playerIndex].isConnected; 
      if (this.gc.game.config.potentialPlayers[playerIndex].isConnected) {
        // store the index of the player this user has connected as 
        // we'll use this to alter behaviour of other players buttons 
        // so that this user cannot connect as more than one player 
        this.selectedPlayerIndex = playerIndex;
        this.gc.game.setwhoIAm( this.gc.game.config.potentialPlayers[this.selectedPlayerIndex].name );
        // send msg to server that this player has connected
        this.gc.setupSocketConnection(this.gc.game.config.potentialPlayers[playerIndex].name);
        this.gc.connectMe(this.gc.game.config.potentialPlayers[playerIndex].name);
      }
      
      else {
        // reset selectedindex to indicate none chosen
        this.selectedPlayerIndex = -1;
        this.gc.game.setwhoIAm( "" );
        // clear connection status of all players 
        // NB. We can do this because when players join, they get backa list of all other players already in the game
        for( let i=0; i<this.gc.game.config.potentialPlayers.length; i++) {
          this.gc.game.config.potentialPlayers[i].isConnected = false;
        }
        // send msg to server that this player has disconnected
        this.gc.disconnectMe(this.gc.game.config.potentialPlayers[playerIndex].name);
      }
    } 
    this.countConnections();
  }

  getButtonStyle(playerIndex: number): string {
    if (this.gc.game.config.potentialPlayers[playerIndex].isConnected) {
      // someone has connected as this player ... but it might be a remote connection
      return (playerIndex === this.selectedPlayerIndex) ? "red" : "green";
    }
    else {
      // this player hasn't connected (from anywhere), 
      // but change the display if this user has connected (on a different index) 
      // and therefore cannot select this one anyway
      return (this.selectedPlayerIndex >-1) ? "white" : "blue";
    }
  }
  
  getButtonText(playerIndex: number): string {
    if (this.gc.game.config.potentialPlayers[playerIndex].isConnected) {
      // someone has connected as this player ... but it might be a remote connection
      return (playerIndex === this.selectedPlayerIndex) ? "Disconnect" : "Connected";
    }
    else {
      // this player isn't connected, but change the display if this user has connected (on a different index) 
      return (this.selectedPlayerIndex >-1) ? "Waiting ..." : "Connect";
    }
  }

  isButtonSelectable(playerIndex: number) : boolean {
    if (playerIndex == this.selectedPlayerIndex) {
      // this is the player this user has previously selected - so they can select it again
      return true;
    } else if (this.selectedPlayerIndex >-1) {
      // this user has already selected one of the other items, so cannot select an additional one
      return false;
    } else if (this.gc.game.config.potentialPlayers[playerIndex].isConnected) { 
      // this player has connected from a remote machine
      return false;
    } else { 
      return true;  
    }
  }

  countConnections() {
    this.numConnections = 0;
    for (let i=0; i<this.gc.game.config.potentialPlayers.length; i++) {
      if (this.gc.game.config.potentialPlayers[i].isConnected) { 
        this.numConnections++; 
      }
    }
    if (2 == this.numConnections) {
      this.closeButtonText = "Start Two Player Game";
      this.closeButtonActive = true;
    } else if (4 == this.numConnections) {
      this.closeButtonText = "Start Four Player Game";
      this.closeButtonActive = true;
    } else {
      this.closeButtonText = "Waiting for other players";
      this.closeButtonActive = true;
    }

  }



}
