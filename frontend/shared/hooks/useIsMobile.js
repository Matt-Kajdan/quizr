import { useState, useEffect } from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_MEDIA_QUERY);
    const updateIsMobile = () => {
      const isPortraitViewport = window.innerHeight > window.innerWidth;
      setIsMobile(query.matches || isPortraitViewport);
    };

    updateIsMobile();
    query.addEventListener("change", updateIsMobile);
    window.addEventListener("resize", updateIsMobile);

    return () => {
      query.removeEventListener("change", updateIsMobile);
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  return isMobile;
}
