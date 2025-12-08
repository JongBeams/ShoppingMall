/**
 * WebRTC Hook with Error Handling
 * ICE Candidate 오류 처리 포함
 */

import { useRef, useState, useCallback } from 'react';

interface UseWebRTCOptions {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
}

interface UseWebRTCReturn {
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | null;
  iceConnectionState: RTCIceConnectionState | null;
  createOffer: () => Promise<RTCSessionDescriptionInit | null>;
  createAnswer: () => Promise<RTCSessionDescriptionInit | null>;
  setRemoteDescription: (description: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  startScreenShare: () => Promise<MediaStream | null>;
  stopScreenShare: () => void;
  closePeerConnection: () => void;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export function useWebRTC({
  onIceCandidate,
  onTrack,
  onConnectionStateChange,
  onIceConnectionStateChange,
}: UseWebRTCOptions = {}): UseWebRTCReturn {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState | null>(null);

  const initPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    // ICE Candidate 수집
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] New ICE candidate:', event.candidate);
        onIceCandidate?.(event.candidate);
      } else {
        console.log('[WebRTC] ICE candidate gathering complete');
      }
    };

    // ICE Gathering State 변경
    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
    };

    // ICE Connection State 변경
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
      setIceConnectionState(pc.iceConnectionState);
      onIceConnectionStateChange?.(pc.iceConnectionState);

      // ICE 연결 실패 시 재시도
      if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC] ICE connection failed, attempting restart');
        pc.restartIce();
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn('[WebRTC] ICE connection disconnected');
      }
    };

    // Connection State 변경
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      onConnectionStateChange?.(pc.connectionState);

      if (pc.connectionState === 'failed') {
        console.error('[WebRTC] Connection failed');
      }
    };

    // Remote Track 수신
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind);
      setRemoteStream(event.streams[0]);
      onTrack?.(event);
    };

    // Negotiation Needed
    pc.onnegotiationneeded = async () => {
      console.log('[WebRTC] Negotiation needed');
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [onIceCandidate, onTrack, onConnectionStateChange, onIceConnectionStateChange]);

  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    try {
      const pc = initPeerConnection();
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Offer created:', offer);
      return offer;
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
      return null;
    }
  }, [initPeerConnection]);

  const createAnswer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    try {
      const pc = initPeerConnection();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[WebRTC] Answer created:', answer);
      return answer;
    } catch (error) {
      console.error('[WebRTC] Error creating answer:', error);
      return null;
    }
  }, [initPeerConnection]);

  const setRemoteDescription = useCallback(async (description: RTCSessionDescriptionInit) => {
    try {
      const pc = initPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(description));
      console.log('[WebRTC] Remote description set:', description.type);
    } catch (error) {
      console.error('[WebRTC] Error setting remote description:', error);
      throw error;
    }
  }, [initPeerConnection]);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = initPeerConnection();

      // Remote Description이 설정되어 있는지 확인
      if (!pc.remoteDescription) {
        console.warn('[WebRTC] Cannot add ICE candidate: remote description not set');
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[WebRTC] ICE candidate added');
    } catch (error) {
      // ICE candidate 추가 실패는 치명적이지 않으므로 경고만 출력
      console.warn('[WebRTC] Error adding ICE candidate (non-fatal):', error);
    }
  }, [initPeerConnection]);

  const startScreenShare = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'browser',
        } as MediaTrackConstraints,
        audio: false,
      });

      const pc = initPeerConnection();

      // 기존 트랙 제거
      pc.getSenders().forEach((sender) => {
        pc.removeTrack(sender);
      });

      // 새 트랙 추가
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      setLocalStream(stream);
      console.log('[WebRTC] Screen sharing started');
      return stream;
    } catch (error) {
      console.error('[WebRTC] Error starting screen share:', error);
      return null;
    }
  }, [initPeerConnection]);

  const stopScreenShare = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      console.log('[WebRTC] Screen sharing stopped');
    }
  }, [localStream]);

  const closePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    stopScreenShare();
    setRemoteStream(null);
    setConnectionState(null);
    setIceConnectionState(null);
    console.log('[WebRTC] Peer connection closed');
  }, [stopScreenShare]);

  return {
    peerConnection: peerConnectionRef.current,
    localStream,
    remoteStream,
    connectionState,
    iceConnectionState,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    startScreenShare,
    stopScreenShare,
    closePeerConnection,
  };
}
