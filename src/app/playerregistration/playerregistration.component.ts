import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { GameData } from '../_classes/gamedata';

import { MessagingService } from '../_services/messagingservice.service';
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

  // inputs
  @Input() gameData: GameData;

  private element: any;
  closeButtonText: string;
  private selectedPlayerIndex: number = -1;
  private numConnections: number = 0;
  localmessages: string[] = [];


  constructor(private el: ElementRef,
              public messageService: MessagingService) 
  { 
    this.element = el.nativeElement;
    // subscribe to get messages
    this.subscription = this.messageService.getMessage()
                        .pipe( filter( (msg: any[]) => (this.msgstoProcess.indexOf(msg[0])>=0) ) ) 
                        .subscribe( (message: any[]) => { this.onMessage(message) } );
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
  }

  onMessage(msg: any[]) {
    if (undefined==msg)
      return;

    let msgheader = msg[1];
    let msgdata = msg[2];

    switch (msgheader) {
      case MessageHeader.playerjoined:
        for (let i=0; i<this.gameData.potentialPlayers.length; i++) {
          if ( (i != this.selectedPlayerIndex) && (this.gameData.potentialPlayers[i].name === msgdata) ) { 
            this.gameData.potentialPlayers[i].isConnected = true;
          }
        }
        this.countConnections();
        break;

      case MessageHeader.playerleft:
        for (let i=0; i<this.gameData.potentialPlayers.length; i++) {
          if ( (i != this.selectedPlayerIndex) && (this.gameData.potentialPlayers[i].name === msgdata) ) { 
            this.gameData.potentialPlayers[i].isConnected = false;
          }
        }
        this.countConnections();
        break;

      case MessageHeader.initgame:
        // shouldn't need to do this- should already have been done !
        // this.gameData.setwhoIAm( this.gameData.potentialPlayers[this.selectedPlayerIndex].name );
        this.element.style.display = 'none';
        break
      
      case MessageHeader.refreshgame:
        // shouldn't need to do this- should already have been done !
        // this.gameData.setwhoIAm( this.gameData.potentialPlayers[this.selectedPlayerIndex].name );
        break;
    }
  }

  onStartGame() {
    this.gameData.setwhoIAm( this.gameData.potentialPlayers[this.selectedPlayerIndex].name );
    this.element.style.display = 'none';
    this.messageService.startGame(this.numConnections);
  }

  onCancel() {

  }

  onClickConnect(playerIndex: number) {
    if (this.isButtonSelectable(playerIndex) ) {
      this.gameData.potentialPlayers[playerIndex].isConnected = !this.gameData.potentialPlayers[playerIndex].isConnected; 
      if (this.gameData.potentialPlayers[playerIndex].isConnected) {
        // store the index of the player this user has connected as 
        // we'll use this to alter behaviour of other players buttons 
        // so that this user cannot connect as more than one player 
        this.selectedPlayerIndex = playerIndex;
        this.gameData.setwhoIAm( this.gameData.potentialPlayers[this.selectedPlayerIndex].name );
        // send msg to server that this player has connected
        this.messageService.setupSocketConnection(this.gameData.potentialPlayers[playerIndex].name);
        this.messageService.connectMe(this.gameData.potentialPlayers[playerIndex].name);
      }
      
      else {
        // reset selectedindex to indicate none chosen
        this.selectedPlayerIndex = -1;
        this.gameData.setwhoIAm( "" );
        // clear connection status of all players 
        // NB. We can do this because when players join, they get backa list of all other players already in the game
        for( let i=0; i<this.gameData.potentialPlayers.length; i++) {
          this.gameData.potentialPlayers[i].isConnected = false;
        }
        // send msg to server that this player has disconnected
        this.messageService.disconnectMe(this.gameData.potentialPlayers[playerIndex].name);
      }
    } 
    this.countConnections();
  }

  getButtonStyle(playerIndex: number): string {
    if (this.gameData.potentialPlayers[playerIndex].isConnected) {
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
    if (this.gameData.potentialPlayers[playerIndex].isConnected) {
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
    } else if (this.gameData.potentialPlayers[playerIndex].isConnected) { 
      // this player has connected from a remote machine
      return false;
    } else { 
      return true;  
    }
  }

  countConnections() {
    this.numConnections = 0;
    for (let i=0; i<this.gameData.potentialPlayers.length; i++) {
      if (this.gameData.potentialPlayers[i].isConnected) { 
        this.numConnections++; 
      }
    }
    if (2 == this.numConnections) {
      this.closeButtonText = "Start Two Player Game";
    } else if (4 == this.numConnections) {
      this.closeButtonText = "Start Four Player Game";
    } else {
      this.closeButtonText = undefined;
    }

  }



}
