import { useState, useEffect } from "react";

export function useScrollEffect() {
  const [headerState, setHeaderState] = useState<
    "transparent" | "hidden" | "visible"
  >("transparent");
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setHeaderState("transparent");
      } else if (currentScrollY < 200) {
        setHeaderState("hidden");
      } else {
        setHeaderState("visible");
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { headerState };
}
