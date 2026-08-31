export interface ChatProject {
  readonly slug: string;
  readonly title: string;
  readonly kicker: string;
  readonly year: number;
  readonly cover: string;
  /** The 1:1 build; the chip is a square and the 3:2 one would crop again. */
  readonly coverSquare: string;
  readonly href: string;
}
