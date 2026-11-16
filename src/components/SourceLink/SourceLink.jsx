import { useLocation } from 'react-router-dom'
import { trackEvent } from '../../utils/analytics.js'
import { pageTypeFromPath } from '../../utils/feedbackRules.js'
import { getSourceLink } from '../../utils/sourceLinks.js'
import { Anchor } from './SourceLink.styled.js'

// Turns the "source" text of a price into a link to the official source (STIPS
// or JKP Beogradske pijace) and reports the click as click_source_link. A source
// with no known site is returned as plain text. The event goes out with
// transport "beacon", so it still arrives if the browser leaves the page.
function SourceLink({ label, productName, children }) {
  const { pathname } = useLocation()
  const link = getSourceLink(label)
  if (!link) return children

  const handleClick = () => {
    trackEvent(
      'click_source_link',
      { source: link.key, page_type: pageTypeFromPath(pathname), product_name: productName },
      { transport: 'beacon' },
    )
  }

  return (
    <Anchor href={link.url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      {children}
    </Anchor>
  )
}

export default SourceLink
