// room-page.component.ts
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PeerService } from '../../services/peer.service';

@Component({
  selector: 'app-room-page',
  standalone: true,
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss']
})
export class RoomPageComponent implements OnInit {
  @Input() roomId!: string;

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  constructor(private peerService: PeerService) { }

  async ngOnInit() {
    if (!this.roomId) {
      console.error('No roomId provided!');
      return;
    }

    const stream = await this.peerService.getMediaStream();
    this.localVideo.nativeElement.srcObject = stream;
    this.localVideo.nativeElement.muted = true;
    this.localVideo.nativeElement.volume = 0;

    this.peerService.initPeer(this.roomId).then((id) => {
      if (id === this.roomId) {
        this.peerService.answerCall((remoteStream) => {
          this.remoteVideo.nativeElement.srcObject = remoteStream;
        });
      }
    }).catch(async () => {
      await this.peerService.initPeer();
      const call = this.peerService.callPeer(this.roomId, stream);
      call.on('stream', (remoteStream) => {
        this.remoteVideo.nativeElement.srcObject = remoteStream;
      });
    });
  }
}
