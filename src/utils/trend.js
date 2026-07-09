import { LuChevronDown, LuChevronUp, LuMinus } from 'react-icons/lu'

export function getTrendIcon(trend) {
  if (trend === 'rast') return LuChevronUp
  if (trend === 'pad') return LuChevronDown
  if (trend === 'bez promene') return LuMinus
  return null
}
