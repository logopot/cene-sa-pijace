import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { LuArrowLeft, LuChevronRight } from 'react-icons/lu'
import { Nav, List, Item, Crumb, CurrentCrumb, Separator, MobileBack, MobileBackLabel } from './Breadcrumbs.styled.js'

// True once the user has actually navigated somewhere *within this SPA* in
// the current tab - react-router gives every history entry it creates its
// own random location.key, reserving the literal string 'default' for the
// entry that was already there when the app first mounted (a fresh load, a
// direct link, a bookmark). document.referrer is a second, independent
// signal for the one case location.key alone misses: a link that opened this
// page in a brand-new tab (its very first entry is still 'default' even
// though it came from our own site) - window.history.length > 1 guards
// against a same-origin referrer that's stale from a much earlier session in
// a long-lived, reused tab.
function hasNavigableHistory(locationKey) {
  if (locationKey !== 'default') return true
  if (typeof document === 'undefined') return false
  const sameOriginReferrer = document.referrer && document.referrer.startsWith(window.location.origin)
  return Boolean(sameOriginReferrer) && window.history.length > 1
}

// items: [{ label, to, mobileLabel? }, ...] - every item but the last one is
// a real link; the last item is the current page (no `to`, marked
// aria-current="page"). Desktop renders the full trail (see Nav's
// breakpoint); mobile collapses to a single button that mimics the native
// back gesture: real history back when there's somewhere in *this app* to
// return to, otherwise a graceful fallback to the immediate parent
// (items[items.length - 2]) instead of leaving the user stranded on a
// direct-entry/bookmarked page. The parent's own `mobileLabel` is shown when
// given (e.g. MarketDetails wants "{city}, sve pijace" instead of the bare
// city name the desktop crumb uses), falling back to its regular `label`
// otherwise - this is a label only, not a routing distinction; the fallback
// destination is always parent.to regardless of which label is shown.
function Breadcrumbs({ items }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  if (items.length < 2) return null

  const current = items[items.length - 1]
  const parent = items[items.length - 2]
  const trail = items.slice(0, -1)

  const handleBack = () => {
    if (hasNavigableHistory(location.key)) {
      navigate(-1)
    } else {
      navigate(parent.to)
    }
  }

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

      <MobileBack type="button" onClick={handleBack} aria-label={t('breadcrumbs.back')}>
        <LuArrowLeft size={16} />
        <MobileBackLabel>{parent.mobileLabel ?? parent.label}</MobileBackLabel>
      </MobileBack>
    </>
  )
}

export default Breadcrumbs
