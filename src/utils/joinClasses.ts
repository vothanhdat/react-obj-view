
export const joinClasses = (...e: (string | false | undefined)[]) => e.filter(Boolean).join(" ");
