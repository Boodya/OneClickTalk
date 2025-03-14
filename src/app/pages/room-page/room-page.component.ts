import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MediaConnection } from 'peerjs';
import { DeviceSettingsComponent } from '../../device-settings/device-settings.component';
import { PeerService } from '../../services/peer.service';

type Role = 'initiator' | 'joiner';

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
  remoteStream!: MediaStream;

  isMicEnabled = true;
  isCamEnabled = true;
  controlsVisible = true;
  activityTimeout!: ReturnType<typeof setTimeout>;

  showWaitingModal = false;
  waitingModalTitle = '';
  modalMessage = '';
  roomLink = '';
  showDeviceSettings = false;
  role: Role = 'joiner';

  currentCall?: MediaConnection;
  reconnectionAttempts = 0;
  maxReconnectionAttempts = 3;

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

    try {
      await this.initiateCall();
    } catch (error) {
      await this.joinCall();
    }
    this.startInactivityTimer();
  }

  async initiateCall() {
    const id = await this.peerService.initPeer(this.roomId);
    if (id === this.roomId) {
      this.role = 'initiator';
      this.showInitialUI();
      this.peerService.answerCall(
        (rS, c) => {
          this.hideMessageUi();
          this.answerCall(rS, c);
        },
        (s) => this.handleConnectionStateChange(s)
      );
    }
  }

  async joinCall() {
    this.role = 'joiner';
    await this.peerService.initPeer();
    const call = this.peerService.callPeer(
      this.roomId,
      this.localStream,
      (s) => this.handleConnectionStateChange(s)
    );
    this.currentCall = call;
    call.on('close', () => this.handleConnectionStateChange('disconnected'));
    call.on('stream', (remoteStream) => {
      this.remoteVideo.nativeElement.srcObject = remoteStream;
    });
  }

  answerCall(remoteStream: MediaStream, call: MediaConnection) {
    this.remoteStream = remoteStream;
    this.remoteVideo.nativeElement.srcObject = remoteStream;
    this.currentCall = call;
    call.on('close', () => this.handleConnectionStateChange('disconnected'));
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
    this.localStream.getAudioTracks().forEach(track => track.enabled = this.isMicEnabled);
  }

  toggleCam() {
    this.isCamEnabled = !this.isCamEnabled;
    this.localStream.getVideoTracks().forEach(track => track.enabled = this.isCamEnabled);
  }

  exitCall() {
    this.localStream.getTracks().forEach(track => track.stop());
    this.peerService.destroyPeer();
    if (this.currentCall) {
      this.currentCall.close();
    }
    this.router.navigate(['/']);
  }

  copyRoomLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.roomLink).then(() => {
        console.log('Room link copied:', this.roomLink);
      }).catch(err => console.error('Clipboard error:', err));
    }
  }

  showMessageUI() {
    this.showWaitingModal = true;
    this.remoteVideo.nativeElement.srcObject = null;
  }

  hideMessageUi() {
    this.showWaitingModal = false;
    this.remoteVideo.nativeElement.srcObject = this.remoteStream;
  }

  showInitialUI() {
    this.waitingModalTitle = 'Все готово';
    this.modalMessage = 'Чтобы начать разговор, скопируйте ссылку на видеозвонок и отправьте её собеседнику';
    this.showMessageUI();
  }

  showCallEndedUI() {
    this.waitingModalTitle = 'Собеседник покинул видеочат';
    this.modalMessage = 'Скопируйте ссылку и пригласите нового собеседника';
    this.showMessageUI();
  }

  showBadInternetUI() {
    this.waitingModalTitle = 'Проблемы со связью';
    this.modalMessage = 'Попробуйте подключиться к другой сети или пересоздать видеочат';
    this.showMessageUI();
  }

  handleConnectionStateChange(state: RTCIceConnectionState) {
    console.log('iceConnection: ' + state);

    if (state == 'disconnected' || state == 'closed') {
      if (this.role == 'joiner')
        this.initiateCall().then(() => this.showCallEndedUI());
      else this.showCallEndedUI();
    } else if (state == 'failed') {
      if (this.role == 'joiner')
        this.initiateCall().then(() => this.showBadInternetUI());
      else this.showBadInternetUI();
    }
  }

  openDeviceSettings() {
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
