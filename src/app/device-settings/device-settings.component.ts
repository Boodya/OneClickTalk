import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-device-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './device-settings.component.html',
  styleUrls: ['./device-settings.component.scss']
})
export class DeviceSettingsComponent implements OnInit {
  // Input the current MediaStream
  @Input() currentStream!: MediaStream;

  // Output event for saving new device selections
  @Output() settingsSaved = new EventEmitter<{
    videoDeviceId: string;
    audioInputDeviceId: string;
    audioOutputDeviceId: string;
  }>();
  @Output() settingsCanceled = new EventEmitter<void>();

  videoDevices: MediaDeviceInfo[] = [];
  audioInputDevices: MediaDeviceInfo[] = [];
  audioOutputDevices: MediaDeviceInfo[] = [];

  selectedVideoDeviceId: string = '';
  selectedAudioInputDeviceId: string = '';
  selectedAudioOutputDeviceId: string = '';

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices() {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        this.videoDevices = devices.filter(d => d.kind === 'videoinput');
        this.audioInputDevices = devices.filter(d => d.kind === 'audioinput');
        this.audioOutputDevices = devices.filter(d => d.kind === 'audiooutput');

        // Get current device IDs from currentStream's tracks
        const videoTrack = this.currentStream.getVideoTracks()[0];
        const audioTrack = this.currentStream.getAudioTracks()[0];

        const currentVideoId = videoTrack ? videoTrack.getSettings().deviceId : '';
        const currentAudioId = audioTrack ? audioTrack.getSettings().deviceId : '';

        // Set defaults: if current stream has a device id, use it; otherwise fallback to the first device in the list.
        this.selectedVideoDeviceId = currentVideoId || (this.videoDevices[0]?.deviceId || '');
        this.selectedAudioInputDeviceId = currentAudioId || (this.audioInputDevices[0]?.deviceId || '');
        this.selectedAudioOutputDeviceId = this.audioOutputDevices.length > 0 ? this.audioOutputDevices[0].deviceId : '';
      })
      .catch(err => console.error('Error enumerating devices:', err));
  }

  save() {
    this.settingsSaved.emit({
      videoDeviceId: this.selectedVideoDeviceId,
      audioInputDeviceId: this.selectedAudioInputDeviceId,
      audioOutputDeviceId: this.selectedAudioOutputDeviceId
    });
  }

  cancel() {
    this.settingsCanceled.emit();
  }
}
