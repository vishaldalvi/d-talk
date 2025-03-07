
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '@/app/services/api';
import { centrifugoService } from '@/app/services/centrifugo';
import { useAuth } from './useAuth';
import { toast } from "sonner";

type CallType = 'audio' | 'video';

export const useCall = () => {
  const { user } = useAuth();
  const [inCall, setInCall] = useState<CallType | false>(false);
  const [callPartner, setCallPartner] = useState<string | null>(null);
  const [isIncoming, setIsIncoming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const callId = useRef<string | null>(null);
  
  // Setup WebRTC
  const setupPeerConnection = useCallback(() => {
    // Create new peer connection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });
    
    // Add local stream to peer connection
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        if (localStream.current) {
          pc.addTrack(track, localStream.current);
        }
      });
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && callPartner && user) {
        // Send ICE candidate to peer
        apiService.sendCallSignal({
          call_id: callId.current || '',
          caller_id: isIncoming ? callPartner : user.id,
          callee_id: isIncoming ? user.id : callPartner,
          call_type: inCall as CallType,
          signal_type: 'ice-candidate',
          payload: {
            candidate: event.candidate
          }
        }).catch(console.error);
      }
    };
    
    // Handle remote track
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    
    peerConnection.current = pc;
    return pc;
  }, [callPartner, inCall, isIncoming, user]);
  
  // Start a call
  const startCall = useCallback(async (contactId: string, type: CallType) => {
    if (!user) return;
    
    try {
      setIsConnecting(true);
      setCallPartner(contactId);
      setInCall(type);
      setIsIncoming(false);
      
      // Generate call ID
      callId.current = `call-${Date.now()}`;
      
      // Get local media
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      
      localStream.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }
      
      // Setup peer connection
      const pc = setupPeerConnection();
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Send offer to peer
      await apiService.sendCallSignal({
        call_id: callId.current,
        caller_id: user.id,
        callee_id: contactId,
        call_type: type,
        signal_type: 'offer',
        payload: {
          sdp: pc.localDescription
        }
      });
      
      toast.success(`Calling...`);
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to start call');
      endCall();
    } finally {
      setIsConnecting(false);
    }
  }, [user, setupPeerConnection]);
  
  // Answer a call
  const answerCall = useCallback(async () => {
    if (!user || !callPartner || !callId.current) return;
    
    try {
      setIsConnecting(true);
      
      // Get local media
      const constraints = {
        audio: true,
        video: inCall === 'video'
      };
      
      localStream.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }
      
      // Setup peer connection
      const pc = setupPeerConnection();
      
      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Send answer to peer
      await apiService.sendCallSignal({
        call_id: callId.current,
        caller_id: callPartner,
        callee_id: user.id,
        call_type: inCall as CallType,
        signal_type: 'answer',
        payload: {
          sdp: pc.localDescription
        }
      });
      
      toast.success(`Call connected`);
    } catch (error) {
      console.error('Failed to answer call:', error);
      toast.error('Failed to answer call');
      endCall();
    } finally {
      setIsConnecting(false);
    }
  }, [user, callPartner, inCall, setupPeerConnection]);
  
  // End call
  const endCall = useCallback(() => {
    // Send hangup signal if in call
    if (user && callPartner && callId.current) {
      apiService.sendCallSignal({
        call_id: callId.current,
        caller_id: isIncoming ? callPartner : user.id,
        callee_id: isIncoming ? user.id : callPartner,
        call_type: inCall as CallType,
        signal_type: 'hangup',
        payload: {}
      }).catch(console.error);
    }
    
    // Stop all media tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Reset local video
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    // Reset remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Reset call state
    setInCall(false);
    setCallPartner(null);
    setIsIncoming(false);
    setIsConnecting(false);
    callId.current = null;
  }, [user, callPartner, inCall, isIncoming]);
  
  // Handle call signals
  const handleCallSignal = useCallback((signal: any) => {
    if (!user) return;
    
    console.log('Received call signal:', signal);
    
    const { call_id, caller_id, callee_id, call_type, signal_type, payload } = signal;
    
    switch (signal_type) {
      case 'offer':
        // Incoming call
        if (callee_id === user.id) {
          callId.current = call_id;
          setCallPartner(caller_id);
          setInCall(call_type);
          setIsIncoming(true);
          
          // Setup peer connection
          const pc = setupPeerConnection();
          
          // Set remote description
          pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            .catch(error => {
              console.error('Failed to set remote description:', error);
              endCall();
            });
          
          toast.info(`Incoming ${call_type} call`, {
            action: {
              label: 'Answer',
              onClick: () => answerCall()
            },
            onDismiss: () => endCall()
          });
        }
        break;
        
      case 'answer':
        // Call accepted
        if (caller_id === user.id && peerConnection.current) {
          peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            .catch(error => {
              console.error('Failed to set remote description:', error);
              endCall();
            });
        }
        break;
        
      case 'ice-candidate':
        // Add ICE candidate
        if (peerConnection.current) {
          peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
            .catch(error => {
              console.error('Failed to add ICE candidate:', error);
            });
        }
        break;
        
      case 'hangup':
        // Call ended
        if ((caller_id === user.id || callee_id === user.id) && call_id === callId.current) {
          endCall();
          toast.info('Call ended');
        }
        break;
        
      default:
        console.log('Unknown signal type:', signal_type);
    }
  }, [user, setupPeerConnection, answerCall, endCall]);
  
  // Initialize Centrifugo
  useEffect(() => {
    if (!user) return;
    
    // Add call signal handler
    const currentHandleCallSignal = handleCallSignal;
    
    if (centrifugoService.isConnected()) {
      // TODO: Add call signal handler to existing connection
    }
    
    return () => {
      // Cleanup
    };
  }, [user, handleCallSignal]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);
  
  return {
    inCall,
    callPartner,
    isIncoming,
    isConnecting,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    endCall
  };
};
