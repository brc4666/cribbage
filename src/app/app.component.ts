import { Component, OnInit, OnDestroy } from '@angular/core';
import { map, filter } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';

import { MessagingService } from './_services/messagingservice.service';
import { MessageType, MessageHeader } from './_classes/common';

import { GameData } from './_classes/gamedata';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  title = 'Crib Scores Cribbage';

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = [MessageType.game];

  showCut = false;
  gameData = new GameData;
  localmessages: string[] = [];

  constructor( public messageService: MessagingService ) {
    this.subscription = this.messageService.getMessage()
                        .pipe( filter( (msg: any[]) => (this.msgstoProcess.indexOf(msg[0])>=0) ) ) 
                        .subscribe( (message) => { this.onMessage(message) } );
  }
  ngOnInit() {
    this.gameData.addPotentialPlayer("Brian", "N");
    this.gameData.addPotentialPlayer("Kate", "S");
    this.gameData.addPotentialPlayer("Matthew", "W");
    this.gameData.addPotentialPlayer("Mel", "E");
    
    //this.gameData.initScores();
    
    //this.gameData.initDealer("Brian");
  }

  onMessage(msg: any[]) {
    if (msg==undefined) 
       return;

    switch (msg[1]) {
      case MessageHeader.initgame:
        this.gameData.initialiseGame( msg[2] );
        this.messageService.refreshGame();
        break;
    }

  }

}
