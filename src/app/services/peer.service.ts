import { Injectable } from '@angular/core';
import Peer, { MediaConnection } from 'peerjs';

@Injectable({
  providedIn: 'root',
})
export class PeerService {
  peer!: Peer;
  localStream!: MediaStream;
  currentCall?: MediaConnection;

  initPeer(peerId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = peerId ? new Peer(peerId) : new Peer();

      this.peer.on('open', (id: string) => {
        console.log('Peer connected with id:', id);
        resolve(id);
      });

      this.peer.on('error', (err) => reject(err));
    });
  }

  async getMediaStream(): Promise<MediaStream> {
    if (!this.localStream) {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    }
    return this.localStream;
  }

  callPeer(remotePeerId: string, stream: MediaStream): MediaConnection {
    this.currentCall = this.peer.call(remotePeerId, stream);
    return this.currentCall;
  }

  answerCall(onRemoteStream: (stream: MediaStream) => void): void {
    this.peer.on('call', (call) => {
      call.answer(this.localStream);
      call.on('stream', onRemoteStream);
      this.currentCall = call;
    });
  }
}