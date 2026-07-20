import { useTranslation } from 'react-i18next'
import { LuArrowLeft, LuChevronRight } from 'react-icons/lu'
import { Nav, List, Item, Crumb, CurrentCrumb, Separator, MobileBack, MobileBackLabel } from './Breadcrumbs.styled.js'

// items: [{ label, to }, ...] - every item but the last one is a real link;
// the last item is the current page (no `to`, marked aria-current="page").
// Desktop renders the full trail (see Nav's breakpoint); mobile collapses to
// a single pill pointing at the immediate parent (items[items.length - 2]),
// its label swapped in per page instead of a generic "back" string.
function Breadcrumbs({ items }) {
  const { t } = useTranslation()

  if (items.length < 2) return null

  const current = items[items.length - 1]
  const parent = items[items.length - 2]
  const trail = items.slice(0, -1)

  return (
    <>
      <Nav aria-label={t('breadcrumbs.navLabel')}>
        <List>
          {trail.map((item) => (
            <Item key={item.to}>
              <Crumb to={item.to}>{item.label}</Crumb>
              <Separator aria-hidden="true">
                <LuChevronRight size={14} />
              </Separator>
            </Item>
          ))}
          <Item>
            <CurrentCrumb aria-current="page">{current.label}</CurrentCrumb>
          </Item>
        </List>
      </Nav>

      <MobileBack to={parent.to}>
        <LuArrowLeft size={16} />
        <MobileBackLabel>{parent.label}</MobileBackLabel>
      </MobileBack>
    </>
  )
}

export default Breadcrumbs
