import * as React from "react";

export function useAvailableHeight() {
  const [height, setHeight] = React.useState<number | null>(null);

  React.useEffect(() => {
    const header = document.querySelector("header");
    const measure = () => {
      const headerHeight = header ? header.getBoundingClientRect().height : 64;
      setHeight(Math.max(0, window.innerHeight - headerHeight));
    };
    const ro = new ResizeObserver(measure);
    if (header) ro.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return height;
}