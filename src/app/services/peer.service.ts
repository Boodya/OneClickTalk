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
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            //As example you can use a TURN for mobile network
            // {
            //   urls: 'turn:eu-central.relay.metered.ca:80',
            //   username: '',
            //   credential: ''
            // },
            // {
            //   urls: 'turn:eu-central.relay.metered.ca:443',
            //   username: '',
            //   credential: ''
            // },
            // {
            //   urls: 'turns:eu-central.relay.metered.ca:443',
            //   username: '',
            //   credential: ''
            // }
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

  answerCall(
    onRemoteStream: (remoteStream: MediaStream, call: MediaConnection) => void,
    onConnectionStateChange?: (state: RTCIceConnectionState) => void
  ) {
    this.peer.on('call', (call) => {
      call.answer(this.localStream);
  
      call.on('stream', (remoteStream) => {
        onRemoteStream(remoteStream, call);
      });
  
      call.peerConnection.oniceconnectionstatechange = () => {
        if (onConnectionStateChange) {
          onConnectionStateChange(call.peerConnection.iceConnectionState);
        }
      };
    });
  }
  
  callPeer(
    remotePeerId: string,
    stream: MediaStream,
    onConnectionStateChange?: (state: RTCIceConnectionState) => void
  ): MediaConnection {
    this.currentCall = this.peer.call(remotePeerId, stream);
  
    this.currentCall.peerConnection.oniceconnectionstatechange = () => {
      if (onConnectionStateChange) {
        onConnectionStateChange(this.currentCall!.peerConnection.iceConnectionState);
      }
    };
  
    return this.currentCall;
  }  

  destroyPeer() {
    if (this.peer) {
      this.peer.destroy();
      //this.peer = undefined;
    }
  }
}