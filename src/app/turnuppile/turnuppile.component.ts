import { Input, Component, OnInit } from '@angular/core';

import { CardinHand } from '../_classes/cardinhand';
import { GameData } from '../_classes/gamedata';

@Component({
  selector: 'app-turnuppile',
  templateUrl: './turnuppile.component.html',
  styleUrls: ['./turnuppile.component.css']
})
export class TurnuppileComponent implements OnInit {

  @Input() gameData: GameData;

  turnUp: CardinHand;
  
  constructor() { }

  ngOnInit(): void {
    this.turnUp = new CardinHand(1, 'ad', false, false);
  }

}
