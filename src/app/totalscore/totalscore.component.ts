import { Component, OnInit, Input } from '@angular/core';

import { GameControllerService } from '../_services/gamecontroller.service';

@Component({
  selector: 'app-totalscore',
  inputs: ['seats', 'scoreIndex'],
  templateUrl: './totalscore.component.html',
  styleUrls: ['./totalscore.component.css']
})
export class TotalscoreComponent implements OnInit {

  // Component Inputs
  seats: string = "";
  scoreIndex: number = 0;

  constructor(public gc: GameControllerService ) { }

  ngOnInit(): void {
    /*
    if (("NS"==this.seats) || ("N"==this.seats)) {
      this.scoreIndex = 0;
    } else if ( ("EW"==this.seats) || ("S"==this.seats)) {
      this.scoreIndex = 1;
    }
    */
  }

}

