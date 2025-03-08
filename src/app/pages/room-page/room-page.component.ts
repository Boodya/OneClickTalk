import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PeerService } from '../../services/peer.service';

@Component({
  selector: 'app-room-page',
  standalone: true,
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss'],
})
export class RoomPageComponent implements OnInit {
  roomId!: string;

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  constructor(
    private route: ActivatedRoute,
    private peerService: PeerService
  ) {}

  async ngOnInit() {
    this.roomId = this.route.snapshot.params['roomId'];
    const roomLink = `${location.origin}/OneClickTalk/?roomId=${this.roomId}`;
    navigator.clipboard.writeText(roomLink);
    console.log('Ссылка на комнату скопирована:', roomLink);

    const stream = await this.peerService.getMediaStream();
    this.localVideo.nativeElement.srcObject = stream;

    this.peerService.initPeer(this.roomId).then((id) => {
      if (id === this.roomId) {
        console.log('Комната создана:', id);
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
