import { ThemeColor } from '../react-obj-view-themes'
import { colorThemeKeys as k } from '../react-obj-view-themes/type'

/**
 * A viewer theme tuned to the landing page's own dark palette so the hero
 * preview reads as part of the page rather than a bolted-on widget.
 *
 * Colors are drawn from the landing gradient — indigo (#818cf8),
 * emerald (#34d399), cyan (#22d3ee), pink (#f472b6) — on the same
 * #0b1020 surface the viewer card sits on.
 */
export const themeLandingDark: ThemeColor = {
  [k.color]: '#c7d2fe',
  [k.bg]: '#0b1020',
  [k.change]: '#f472b6',
  [k.fontsize]: '12px',
  [k.bool]: '#22d3ee',
  [k.number]: '#fbbf24',
  [k.bigint]: '#fbbf24',
  [k.string]: '#34d399',
  [k.array]: '#818cf8',
  [k.object]: '#a78bfa',
  [k.promise]: '#f472b6',
  [k.map]: '#22d3ee',
  [k.set]: '#c084fc',
  [k.fn]: '#818cf8',
  [k.regex]: '#f472b6',
  [k.date]: '#34d399',
  [k.error]: '#fb7185',
  [k.acBtn]: '#1b2540',
  [k.acSuccess]: '#34d399',
  [k.acErr]: '#fb7185',
}
