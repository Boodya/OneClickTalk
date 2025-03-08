// home-page.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RoomPageComponent } from '../room-page/room-page.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RoomPageComponent],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  roomId!: string | null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.roomId = params['roomId'] || null;
    });
  }
  
  createRoom() {
    const newRoomId = crypto.randomUUID();
    window.location.href = `${location.origin}${location.pathname}?roomId=${newRoomId}`;
  }

}
