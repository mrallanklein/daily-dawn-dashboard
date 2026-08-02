import * as React from "react";

/** Vrai sous 1024px : mobile et tablette (lecture des mails en modale centrée). */
const COMPACT_BREAKPOINT = 1024;

export function useIsCompact() {
  const [compact, setCompact] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_BREAKPOINT - 1}px)`);
    const onChange = () => setCompact(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return compact;
}
