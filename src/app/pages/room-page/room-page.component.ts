import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PeerService } from '../../services/peer.service';
import { Router } from '@angular/router';

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

  localStream!: MediaStream;
  isMicEnabled = true;
  isCamEnabled = true;

  constructor(private peerService: PeerService, private router: Router) { }

  async ngOnInit() {
    if (!this.roomId) {
      console.error('No roomId provided!');
      return;
    }

    this.localStream = await this.peerService.getMediaStream();
    this.localVideo.nativeElement.srcObject = this.localStream;
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
      const call = this.peerService.callPeer(this.roomId, this.localStream);
      call.on('stream', (remoteStream) => {
        this.remoteVideo.nativeElement.srcObject = remoteStream;
      });
    });
  }

  toggleMic() {
    this.isMicEnabled = !this.isMicEnabled;
    this.localStream.getAudioTracks().forEach(track => track.enabled = this.isMicEnabled);
  }

  toggleCam() {
    this.isCamEnabled = !this.isCamEnabled;
    this.localStream.getVideoTracks().forEach(track => track.enabled = this.isCamEnabled);
  }

  exitCall() {
    this.localStream.getTracks().forEach(track => track.stop());
    this.peerService.destroyPeer();
    this.router.navigate(['/']);
  }
}
