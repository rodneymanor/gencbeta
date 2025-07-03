export const formatTimeUntilRefresh = (expiresAt: string): string => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) return "00:00:00";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const createScriptQueryParams = (idea: any): URLSearchParams => {
  return new URLSearchParams({
    idea: idea.concept ?? idea.title ?? "Content Idea",
    script: idea.script ?? idea.hook,
    length: idea.estimatedDuration,
    category: idea.peqCategory ?? idea.pillar ?? "general",
  });
}; 