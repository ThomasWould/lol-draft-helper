const paths = {
  spark: ["m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"],
  swords: [
    "m4 3 11 11-2 2L2 5V2h3",
    "m20 3-7 7",
    "m17 14 5 5-3 3-5-5",
    "m7 14-5 5 3 3 5-5",
    "m20 3 2-1v3l-5 5",
    "m13 17 4-4",
    "m7 13 4 4",
  ],
  shield: ["M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z", "m8.5 12 2.5 2.5 4.5-5"],
  arrow: ["M4 12h16", "m14 6 6 6-6 6"],
  copy: ["M9 8h11v13H9z", "M15 8V3H4v13h5"],
  check: ["m5 12 4 4L19 6"],
  chevron: ["m6 9 6 6 6-6"],
  close: ["m6 6 12 12", "M18 6 6 18"],
  upload: ["m8 12 7-7a3 3 0 0 1 4 4l-9 9a5 5 0 0 1-7-7l9-9", "m7 15 8-8"],
  external: ["M14 3h7v7", "m21 3-9 9", "M10 3H3v18h18v-7"],
  compass: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", "m16 8-3 5-5 3 3-5 5-3Z"],
  target: [
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    "M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z",
    "M12 10v4",
    "M10 12h4",
  ],
  book: ["M12 5v16", "M12 5C8 2 3 3 3 3v15s5-1 9 3c4-4 9-3 9-3V3s-5-1-9 2Z"],
} as const;

export function Icon({
  name,
  className = "",
}: {
  name: keyof typeof paths;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name].map((d, i) => (
        <path d={d} key={i} />
      ))}
    </svg>
  );
}
