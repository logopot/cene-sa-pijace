import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Runs on every route change so a freshly navigated page always starts at
// the top - without this, the browser keeps whatever scroll offset the
// previous page was at (e.g. deep in a product grid) when the new page
// mounts. Renders nothing, so there is no companion .styled.js file.
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
