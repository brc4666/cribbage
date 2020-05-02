import { Input, Component, OnInit } from '@angular/core';
import { GameData } from '../_classes/gamedata';

@Component({
  selector: 'app-cardtable',
  templateUrl: './cardtable.component.html',
  styleUrls: ['./cardtable.component.css']
})
export class CardtableComponent implements OnInit {

  @Input() gameData: GameData;
  
  constructor() { }

  ngOnInit(): void {
  }

}
