import type { SVGProps } from "react";

const paths = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  play: "m8 5 12 7-12 7V5Z",
  pause: "M8 5v14M16 5v14",
  prev: "M6 5v14m12-14L8 12l10 7V5Z",
  next: "M18 5v14M6 5l10 7-10 7V5Z",
  reset: "M4 9a8 8 0 1 1 0 6M4 3v6h6",
  external: "M14 4h6v6m0-6L10 14M10 4H4v16h16v-6",
  code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18",
  check: "m5 12 4 4 10-10",
  download: "M12 4v11m-5-5 5 5 5-5M5 20h14",
  upload: "M12 20V9m-5 5 5-5 5 5M5 4h14",
  people: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3.5 2.5-6 6-6s6 2.5 6 6m1-16a3.5 3.5 0 0 1 0 7m2 2.5c2 .8 3 2.7 3 5.5",
  copy: "M9 9h11v11H9ZM5 15H4V4h11v1",
} as const;

type Name = keyof typeof paths;
type Props = SVGProps<SVGSVGElement> & { name?: Name };

export function Icon({ name = "arrow", ...props }: Props) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Star({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9 2.9-6Z"
        fill={filled ? "#f4bc3a" : "#ead8b2"}
        stroke="#6a401c"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
