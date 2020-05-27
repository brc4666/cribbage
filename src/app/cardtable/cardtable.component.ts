import { Component, OnInit } from '@angular/core';

import { environment } from '../../environments/environment';

import { GameControllerService } from '../_services/gamecontroller.service';

@Component({
  selector: 'app-cardtable',
  templateUrl: './cardtable.component.html',
  styleUrls: ['./cardtable.component.css']
})
export class CardtableComponent implements OnInit {

  assetsPath: string = environment.ASSETPATH;

  constructor(public gc: GameControllerService) { }

  ngOnInit(): void {
  }

}
