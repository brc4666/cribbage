import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { GameControllerService } from '../_services/gamecontroller.service';
import { MessageType, MessageHeader, GamePhase } from '../_classes/common';
import { CardinHand } from '../_classes/cardinhand';

@Component({
  selector: 'app-turnuppile',
  templateUrl: './turnuppile.component.html',
  styleUrls: ['./turnuppile.component.css']
})
export class TurnuppileComponent implements OnInit, OnDestroy {

  // intra-component messaging variables
  private subscription: Subscription;
  private msgstoProcess: any[] = [MessageType.cards];
  
  turnUp: CardinHand;
  assetsPath: string = environment.ASSETPATH;

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
    this.turnUp = new CardinHand('ad', false);
  }

  onInternalMessage(msg: any[]) {
    if (msg==undefined) 
       return;

    let msgheader = msg[1];
    switch ( msgheader ) {
      case MessageHeader.refreshturnup:
        this.turnUp = new CardinHand(this.gc.game.state.turnUpCard, true);
        break;
    }
  }

}
