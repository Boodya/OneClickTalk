import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

@Component({
  standalone: true,
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {
  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const roomId = params['roomId'];
      if (roomId) {
        this.router.navigate(['/rooms', roomId]);
      }
    });
  }

  createRoom() {
    const roomId = uuidv4();
    this.router.navigate([''], { queryParams: { roomId } });
  }
}
