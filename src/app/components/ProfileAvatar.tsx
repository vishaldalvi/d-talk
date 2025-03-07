
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

type ProfileAvatarProps = {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline" | "away" | "busy" | null;
};

const ProfileAvatar = ({ src, name, size = "md", status = null }: ProfileAvatarProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  const statusClass = status ? `avatar-status avatar-status-${status}` : "";

  return (
    <div className="relative">
      <Avatar className={`${sizeClasses[size]} ring-2 ring-offset-2 ring-offset-background transition-transform duration-200 hover:scale-105`}>
        <AvatarImage src={src} alt={name} className="object-cover" />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {status && <div className={statusClass} />}
    </div>
  );
};

export default ProfileAvatar;
