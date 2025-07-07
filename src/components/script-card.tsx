import { Heart, MessageCircle, Share, Bookmark } from "lucide-react";

import { cn } from "@/lib/utils";

interface ScriptCardProps {
  profile: {
    name: string;
    username: string;
    avatar: string;
  };
  script: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
  className?: string;
}

const ScriptCard = ({
  profile,
  script,
  engagement = { likes: 1247, comments: 89, shares: 156 },
  className,
  ...props
}: ScriptCardProps) => {
  return (
    <div
      className={cn(
        "relative flex w-full max-w-lg flex-col gap-3 overflow-hidden rounded-lg border bg-white p-4 shadow-sm",
        className,
      )}
      {...props}
    >
      {/* Header with profile and bookmark */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={profile.avatar || "/placeholder.svg"}
            alt={`${profile.name}'s profile`}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">{profile.name}</span>
            <span className="text-sm text-gray-500">said</span>
          </div>
        </div>
        <button className="text-gray-400 transition-colors hover:text-gray-600">
          <Bookmark className="h-5 w-5" />
        </button>
      </div>

      {/* Script content */}
      <div className="line-clamp-10 text-sm leading-tight whitespace-pre-wrap text-gray-800">{script}</div>

      {/* Engagement metrics */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
        <div className="flex items-center space-x-6">
          <button className="flex items-center space-x-2 text-gray-500 transition-colors hover:text-red-500">
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">{engagement.likes.toLocaleString()}</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-500 transition-colors hover:text-blue-500">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{engagement.comments}</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-500 transition-colors hover:text-green-500">
            <Share className="h-5 w-5" />
            <span className="text-sm font-medium">{engagement.shares}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptCard;
