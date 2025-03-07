
import React, { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Mic, Send, Paperclip, Smile } from "lucide-react";

type MessageInputProps = {
  onSendMessage: (message: string) => void;
  onStartVoice?: () => void;
};

const MessageInput = ({ onSendMessage, onStartVoice }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex items-center p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-all gap-2"
    >
      <Button
        type="button" 
        variant="ghost" 
        size="icon" 
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <Paperclip size={20} />
        <span className="sr-only">Attach file</span>
      </Button>
      
      <div className="relative flex-1">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-10"
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <Smile size={20} />
          <span className="sr-only">Add emoji</span>
        </Button>
      </div>
      
      {message.trim() ? (
        <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90 text-white">
          <Send size={18} />
          <span className="sr-only">Send message</span>
        </Button>
      ) : (
        <Button 
          type="button" 
          onClick={onStartVoice}
          size="icon" 
          className="rounded-full bg-primary hover:bg-primary/90 text-white"
        >
          <Mic size={18} />
          <span className="sr-only">Voice message</span>
        </Button>
      )}
    </form>
  );
};

export default MessageInput;
