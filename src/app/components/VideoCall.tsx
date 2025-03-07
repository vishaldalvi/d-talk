
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Phone, Maximize, Minimize } from "lucide-react";

type VideoCallProps = {
  isAudioOnly?: boolean;
  onEndCall: () => void;
  remoteUserName: string;
  remoteUserImage?: string;
};

const VideoCall = ({ 
  isAudioOnly = false, 
  onEndCall,
  remoteUserName,
  remoteUserImage
}: VideoCallProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(isAudioOnly);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulating connection states for the demo
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    // Simulating connection process
    const timer = setTimeout(() => {
      setConnectionState("connected");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // This would be replaced with actual WebRTC setup
  useEffect(() => {
    if (connectionState === "connected" && !isAudioOnly) {
      // Mock video streams with getUserMedia
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          // For demo purposes, we're using the same stream for remote
          // In a real app, this would come from WebRTC
          if (remoteVideoRef.current && !isAudioOnly) {
            remoteVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing media devices:", err);
        });
    }

    return () => {
      // Cleanup streams when component unmounts
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [connectionState, isAudioOnly]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center transition-all duration-500 animate-fade-in"
    >
      {/* Connection status indicator */}
      {connectionState === "connecting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-xl">Connecting...</p>
          </div>
        </div>
      )}
      
      {/* Main video area */}
      <div className="relative w-full h-full flex items-center justify-center">
        {isAudioOnly ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-white">
              {remoteUserImage ? (
                <img src={remoteUserImage} alt={remoteUserName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    {remoteUserName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <h2 className="text-white text-2xl mb-2">{remoteUserName}</h2>
            <p className="text-gray-300 mb-8">Audio Call</p>
          </div>
        ) : (
          <>
            <video 
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-20 right-6 w-1/4 max-w-[180px] aspect-video rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video 
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </>
        )}
      </div>
      
      {/* Call controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-4 pb-4">
        <Button 
          onClick={() => setIsMuted(!isMuted)} 
          className="call-controls text-white"
          variant="ghost"
          size="icon"
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </Button>
        
        <Button 
          onClick={onEndCall}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 flex items-center justify-center shadow-lg"
        >
          <Phone size={24} className="rotate-135" />
        </Button>
        
        {!isAudioOnly && (
          <Button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className="call-controls text-white"
            variant="ghost"
            size="icon"
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </Button>
        )}
        
        <Button
          onClick={toggleFullScreen}
          className="call-controls text-white"
          variant="ghost"
          size="icon"
        >
          {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;
