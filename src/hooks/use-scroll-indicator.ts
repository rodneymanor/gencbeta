import { useEffect, useRef } from "react";

export function useScrollIndicator() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;

      // Add 'scrolled' class when scrolled past 50px or when can scroll more
      const canScrollMore = scrollHeight > clientHeight;
      const hasScrolled = scrollTop > 50;

      if (hasScrolled && canScrollMore) {
        scrollElement.classList.add("scrolled");
      } else {
        scrollElement.classList.remove("scrolled");
      }
    };

    // Initial check
    handleScroll();

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return scrollRef;
}
