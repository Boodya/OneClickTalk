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

    // копируем ссылку на комнату (только создатель)
    const roomLink = `${location.origin}/rooms/${this.roomId}`;
    navigator.clipboard.writeText(roomLink);
    console.log('Ссылка на комнату скопирована:', roomLink);

    const stream = await this.peerService.getMediaStream();
    this.localVideo.nativeElement.srcObject = stream;

    // Попробуем подключиться как хост
    this.peerService.initPeer(this.roomId).then((id) => {
      if (id === this.roomId) {
        // Мы создатель комнаты
        console.log('Комната создана:', id);
        this.peerService.answerCall((remoteStream) => {
          this.remoteVideo.nativeElement.srcObject = remoteStream;
        });
      }
    }).catch(async () => {
      // Если ID занят, значит это гость - создаем случайный peerId
      await this.peerService.initPeer();  // без параметра = случайный ID
      const call = this.peerService.callPeer(this.roomId, stream);
      call.on('stream', (remoteStream) => {
        this.remoteVideo.nativeElement.srcObject = remoteStream;
      });
    });
  }
}
