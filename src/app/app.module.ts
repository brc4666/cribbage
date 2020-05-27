import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from "@angular/flex-layout";
//import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
//import { HttpClientModule }    from '@angular/common/http';

import { AppComponent } from './app.component';
import { CardtableComponent } from './cardtable/cardtable.component';
import { PlayerRegistrationComponent } from './playerregistration/playerregistration.component';
import { TotalscoreComponent } from './totalscore/totalscore.component';
import { TurnuppileComponent } from './turnuppile/turnuppile.component';
import { DiscardpileComponent } from './discardpile/discardpile.component';
import { CutdeckComponent } from './cutdeck/cutdeck.component';
import { VerticalhandComponent } from './verticalhand/verticalhand.component';
import { HorizontalhandComponent } from './horizontalhand/horizontalhand.component';

import { GameControllerService } from './_services/gamecontroller.service';
import { ScoreHandsComponent } from './score-hands/score-hands.component';
import { GameoverComponent } from './gameover/gameover.component';

@NgModule({
  declarations: [
    AppComponent,
    CardtableComponent,
    PlayerRegistrationComponent,
    TotalscoreComponent,
    TurnuppileComponent,
    DiscardpileComponent,
    CutdeckComponent,
    VerticalhandComponent,
    HorizontalhandComponent,
    ScoreHandsComponent,
    GameoverComponent
  ],
  imports: [
    // HttpClientModule,
    // FormsModule,
    BrowserModule,
    FlexLayoutModule
  ],
  providers: [GameControllerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
