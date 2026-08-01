import { useEffect, useRef } from "react";

/** Curseur rond en fondu de différence, repris du portfolio Allan Klein. */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = dotRef.current;
    if (!dot) return;

    document.documentElement.classList.add("cursor-none-root");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;

    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const interactive = el?.closest("a, button, input, select, textarea, [role='button']");
      dot.classList.toggle("expanded", Boolean(interactive));
    };
    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move);
    loop();
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("cursor-none-root");
    };
  }, []);

  return <div ref={dotRef} className="cursor-dot hidden lg:block" aria-hidden />;
}
