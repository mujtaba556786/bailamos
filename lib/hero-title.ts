// Font size for the big title on the homepage carousel. Short titles ("Tacos al Pastor") stay large;
// long event titles get smaller, so they fit in about two to three lines and do not cover the whole image.
export function heroTitleClass(title: string) {
  const length = title.trim().length;
  if (length <= 22) return "text-[clamp(2.8rem,6.4vw,6.4rem)] leading-[.86]";
  if (length <= 40) return "text-[clamp(2.4rem,4.6vw,4.6rem)] leading-[.92]";
  return "text-[clamp(2.1rem,3.6vw,3.6rem)] leading-[1]";
}
