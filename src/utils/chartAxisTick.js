import { createElement } from 'react'
import { theme } from '../styles/theme.js'

// Recharts' XAxis height/margin props take raw unitless pixel numbers (not
// CSS strings), so these are parsed out of the theme's px-string spacing
// tokens rather than duplicating the values as bare numbers.
//
// The chart's SVG canvas has a fixed pixel height (ResponsiveContainer only
// scales width), so a -45deg label doesn't get clipped by any CSS overflow -
// it's clipped by that fixed canvas height once the label's rotated
// footprint exceeds axisHeight + marginBottom. A long name like "Sremska
// Mitrovica" at fontSize 14 projects to roughly width*sin(45) ≈ 100px+
// vertically, so this budget needs to clear that with room to spare.
export const ROTATED_AXIS_HEIGHT = Number.parseInt(theme.spacing.xxl, 10)
export const ROTATED_AXIS_MARGIN_BOTTOM = Number.parseInt(theme.spacing.xl, 10) * 2

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
