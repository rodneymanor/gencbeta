;/>
\
Add a short-circuit
return at
the
very
top
of
the `MagicTweet\` component:

``\`tsx
export const MagicTweet = ({
tweet,
components,
className,
...props
}: {
tweet?: Tweet;          // <-- mark tweet optional
components?: TwitterComponents;
className?: string;
}) => {
/* 1️⃣ If the tweet failed to load, fall back immediately */
if (!tweet) {
  const NotFound = components?.TweetNotFound || TweetNotFound;
  return <NotFound {...props} />;
}

/* 2️⃣ Otherwise continue as before */
const enrichedTweet = enrichTweet(tweet);
return (
  <div
    className={cn(
      "relative flex size-full max-w-lg flex-col gap-2 overflow-hidden rounded-lg border p-4 backdrop-blur-md",
      className,
    )}
    {...props}
  >
    <TweetHeader tweet={enrichedTweet} />
    <TweetBody tweet={enrichedTweet} />
    <TweetMedia tweet={enrichedTweet} />
  </div>
);
};
