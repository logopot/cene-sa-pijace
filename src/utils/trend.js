import { LuArrowUpRight, LuArrowDownRight, LuMinus } from 'react-icons/lu'

export function getTrendIcon(trend) {
  if (trend === 'rast') return LuArrowUpRight
  if (trend === 'pad') return LuArrowDownRight
  if (trend === 'bez promene') return LuMinus
  return null
}
