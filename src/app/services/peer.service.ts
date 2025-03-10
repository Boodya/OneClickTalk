import { Injectable } from '@angular/core';
import Peer, { MediaConnection, PeerOptions } from 'peerjs';

@Injectable({
  providedIn: 'root',
})
export class PeerService {
  peer!: Peer;
  localStream!: MediaStream;
  currentCall?: MediaConnection;

  initPeer(peerId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const config = {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            {
              urls: 'turn:eu-central.relay.metered.ca:80',
              username: '',
              credential: ''
            },
            {
              urls: 'turn:eu-central.relay.metered.ca:443',
              username: '',
              credential: ''
            },
            {
              urls: 'turns:eu-central.relay.metered.ca:443',
              username: '',
              credential: ''
            }
          ]
        }
      };
  
      this.peer = peerId ? new Peer(peerId, config) : new Peer(config);
  
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

  answerCall(
    onRemoteStream: (remoteStream: MediaStream, call: MediaConnection) => void
  ) {
    this.peer.on('call', (call) => {
      call.answer(this.localStream);
      call.on('stream', (remoteStream) => {
        onRemoteStream(remoteStream, call);
      });
    });
  }  

  destroyPeer() {
    if (this.peer) {
      this.peer.destroy();
      //this.peer = undefined;
    }
  }
}