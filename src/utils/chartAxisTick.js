import { createElement } from 'react'
import { theme } from '../styles/theme.js'

// Recharts' XAxis height/margin props take raw unitless pixel numbers (not
// CSS strings), so these are parsed out of the theme's px-string spacing
// tokens rather than duplicating the values as bare numbers.
export const ROTATED_AXIS_HEIGHT = Number.parseInt(theme.spacing.xxl, 10)
export const ROTATED_AXIS_MARGIN_BOTTOM = Number.parseInt(theme.spacing.lg, 10)

// Recharts clones this element and injects x/y/payload itself, so it can't be
// a styled-component (no props.theme context) - it reads theme directly, same
// as the chart files that render it.
export function RotatedAxisTick({ x, y, payload, fontSize = 12 }) {
  return createElement(
    'text',
    {
      x,
      y,
      dy: 12,
      textAnchor: 'end',
      fill: theme.colors.textMuted,
      fontSize,
      transform: `rotate(-45 ${x} ${y})`,
    },
    payload.value,
  )
}
