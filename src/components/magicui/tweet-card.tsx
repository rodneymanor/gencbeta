"use client";

import { cn } from "@/lib/utils";

interface Tweet {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    profileImageUrl: string;
  };
  createdAt: string;
  media?: {
    type: string;
    url: string;
  }[];
}

interface TwitterComponents {
  TweetNotFound?: React.ComponentType<any>;
}

interface MagicTweetProps {
  tweet?: Tweet;
  components?: TwitterComponents;
  className?: string;
}

const TweetNotFound = () => (
  <div className="text-muted-foreground flex items-center justify-center p-4">Tweet not found</div>
);

const TweetHeader = ({ tweet }: { tweet: Tweet }) => (
  <div className="flex items-center gap-2">
    <img src={tweet.author.profileImageUrl} alt={tweet.author.name} className="h-8 w-8 rounded-full" />
    <div>
      <div className="font-semibold">{tweet.author.name}</div>
      <div className="text-muted-foreground text-sm">@{tweet.author.username}</div>
    </div>
  </div>
);

const TweetBody = ({ tweet }: { tweet: Tweet }) => <div className="text-sm leading-relaxed">{tweet.text}</div>;

const TweetMedia = ({ tweet }: { tweet: Tweet }) => {
  if (!tweet.media || tweet.media.length === 0) return null;

  return (
    <div className="mt-2">
      {tweet.media.map((media, index) => (
        <img key={index} src={media.url} alt="Tweet media" className="h-auto max-w-full rounded-lg" />
      ))}
    </div>
  );
};

export const MagicTweet = ({ tweet, components, className, ...props }: MagicTweetProps) => {
  /* 1️⃣ If the tweet failed to load, fall back immediately */
  if (!tweet) {
    const NotFound = components?.TweetNotFound || TweetNotFound;
    return <NotFound {...props} />;
  }

  /* 2️⃣ Otherwise continue as before */
  return (
    <div
      className={cn(
        "relative flex size-full max-w-lg flex-col gap-2 overflow-hidden rounded-lg border p-4 backdrop-blur-md",
        className,
      )}
      {...props}
    >
      <TweetHeader tweet={tweet} />
      <TweetBody tweet={tweet} />
      <TweetMedia tweet={tweet} />
    </div>
  );
};
