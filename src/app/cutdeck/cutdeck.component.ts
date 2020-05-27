import { Component, OnInit, ElementRef } from '@angular/core';
import { environment } from '../../environments/environment';

import { GameControllerService } from '../_services/gamecontroller.service';

import { CardinHand } from '../_classes/cardinhand';

@Component({
  selector: 'app-cutdeck',
  templateUrl: './cutdeck.component.html',
  styleUrls: ['./cutdeck.component.css']
})
export class CutdeckComponent implements OnInit {

  private element: any;
  decktocut: number[] = [];
  selectedCard: string;             // the card clicked in the view
  showButton: boolean = false;      // whether to show/hide the action button fo this view   
  assetsPath: string = environment.ASSETPATH;

  constructor(private el: ElementRef, public gc: GameControllerService) { 
    this.element = el.nativeElement;
  }

  ngOnInit(): void {
    for (let i = 0; i < this.gc.game.state.cardsToCut; i++)
    {
      this.decktocut[i]=i;
    }
  }

  onSelectCard(cardIndex: number) {
    this.element.style.display = 'none';
    this.gc.sendTurnUp(cardIndex);
  }

  onClickOK() {
  }

}
