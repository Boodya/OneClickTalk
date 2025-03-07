import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { RoomPageComponent } from './pages/room-page/room-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'rooms/:roomId', component: RoomPageComponent },
];
