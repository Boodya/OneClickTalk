import { Component, ElementRef, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PeerService } from '../../services/peer.service';
import { FormsModule } from '@angular/forms';
import { DeviceSettingsComponent } from '../../device-settings/device-settings.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room-page',
  standalone: true,
  imports: [FormsModule, CommonModule, DeviceSettingsComponent],
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss']
})
export class RoomPageComponent implements OnInit, OnDestroy {
  @Input() roomId!: string;

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  localStream!: MediaStream;
  isMicEnabled = true;
  isCamEnabled = true;

  controlsVisible = true;
  activityTimeout!: ReturnType<typeof setTimeout>;

  showWaitingModal = false;
  waitingModalTitle = '';
  modalMessage = '';
  roomLink = '';

  showDeviceSettings = false;
  
  constructor(private peerService: PeerService, private router: Router) { }

  async ngOnInit() {
    if (!this.roomId) {
      console.error('No roomId provided!');
      return;
    }
    this.roomLink = `${location.origin}${location.pathname}?roomId=${this.roomId}`;

    this.localStream = await this.peerService.getMediaStream();
    this.localVideo.nativeElement.srcObject = this.localStream;
    this.localVideo.nativeElement.muted = true;
    this.localVideo.nativeElement.volume = 0;

    this.peerService.initPeer(this.roomId).then((id) => {
      if (id === this.roomId) {
        this.showInitialUI();
        this.peerService.answerCall(
          (remoteStream, call) => {
            this.remoteVideo.nativeElement.srcObject = remoteStream;
            this.showWaitingModal = false;
            call.on('close', () => {
              console.log('call ended');
              this.showCallEndedUI();
            });
          },
          (iceConnectionState) => {
            if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected') {
              this.showBadInternetUI();
            }
          }
        );
      }
    }).catch(async () => {
      await this.peerService.initPeer();
      const call = this.peerService.callPeer(
        this.roomId,
        this.localStream,
        (iceConnectionState) => {
          if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected') {
            this.showBadInternetUI();
          }
        }
      );

      call.on('stream', (remoteStream) => {
        this.remoteVideo.nativeElement.srcObject = remoteStream;
      });
    });

    this.startInactivityTimer();
  }

  ngOnDestroy() {
    clearTimeout(this.activityTimeout);
  }

  onUserActivity() {
    this.controlsVisible = true;
    clearTimeout(this.activityTimeout);
    this.startInactivityTimer();
  }

  startInactivityTimer() {
    this.activityTimeout = setTimeout(() => {
      this.controlsVisible = false;
    }, 5000);
  }

  toggleMic() {
    this.isMicEnabled = !this.isMicEnabled;
    this.localStream.getAudioTracks().forEach(
      track => track.enabled = this.isMicEnabled);
  }

  toggleCam() {
    this.isCamEnabled = !this.isCamEnabled;
    this.localStream.getVideoTracks().forEach(
      track => track.enabled = this.isCamEnabled);
  }

  exitCall() {
    this.localStream.getTracks().forEach(track => track.stop());
    this.peerService.destroyPeer();
    this.router.navigate(['/']);
  }

  copyRoomLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.roomLink).then(() => {
        console.log('Room link copied:', this.roomLink);
      }).catch(err => console.error('Clipboard error:', err));
    }
  }

  showInitialUI() {
    this.waitingModalTitle = 'Видеочат создан';
    this.modalMessage = 'Чтобы начать разговор, скопируйте ссылку на видеозвонок и отправьте её собеседнику удобным вам способом';
    this.showWaitingModal = true;
  }

  showCallEndedUI() {
    this.waitingModalTitle = 'Собеседник покинул видеочат';
    this.modalMessage = 'Скопируйте ссылку и пригласите собеседника заново.';
    this.showWaitingModal = true;
  }

  showBadInternetUI() {
    this.waitingModalTitle = 'Проблемы со связью :(';
    this.modalMessage = 'Попробуйте подключиться к другой сети или пересоздать видеочат';
    this.showWaitingModal = true;
  }

  openDeviceSettings() {
    if (this.showDeviceSettings) {
      this.closeDeviceSettings();
      return;
    }
    this.showDeviceSettings = true;
  }

  closeDeviceSettings() {
    this.showDeviceSettings = false;
  }

  applyDeviceSettings(settings: {
    videoDeviceId: string;
    audioInputDeviceId: string;
    audioOutputDeviceId: string;
  }) {
    this.showDeviceSettings = false;
    const constraints = {
      video: { deviceId: { exact: settings.videoDeviceId } },
      audio: { deviceId: { exact: settings.audioInputDeviceId } }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = stream;
        this.localVideo.nativeElement.srcObject = stream;
      })
      .catch(err => console.error('Error applying device settings:', err));
  }
}
