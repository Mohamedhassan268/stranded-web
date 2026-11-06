import type { SVGProps } from "react";
type Props = SVGProps<SVGSVGElement> & {
  name?:
    | "arrow"
    | "play"
    | "pause"
    | "prev"
    | "next"
    | "reset"
    | "external"
    | "code"
    | "check";
};
export function Icon({ name = "arrow", ...props }: Props) {
  const paths = {
    arrow: "M4 12h15m-6-6 6 6-6 6",
    play: "m9 5 11 7-11 7V5Z",
    pause: "M8 5v14M16 5v14",
    prev: "M6 5v14m12-14L8 12l10 7V5Z",
    next: "M18 5v14M6 5l10 7-10 7V5Z",
    reset: "M4 9a8 8 0 1 1 0 6M4 3v6h6",
    external: "M14 4h6v6m0-6L10 14M10 4H4v16h16v-6",
    code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18",
    check: "m5 12 4 4 10-10",
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function BrandMark() {
  return (
    <svg
      viewBox="0 0 36 36"
      width="32"
      height="32"
      fill="none"
      aria-hidden="true"
    >
      <path d="m18 2 15 8v16l-15 8L3 26V10Z" stroke="currentColor" />
      <path
        d="m18 10 8 4v8l-8 4-8-4v-8Zm0-8v8m15 0-7 4m7 12-7-4m-8 12v-8M3 26l7-4M3 10l7 4"
        stroke="currentColor"
      />
      <circle cx="18" cy="18" r="3" fill="currentColor" />
    </svg>
  );
}
