import { Component, useEffect, useState } from 'react'
import PageSkeleton from '../PageSkeleton/PageSkeleton.jsx'
import LoadFailure from '../LoadFailure/LoadFailure.jsx'
import { SLOW_LOAD_MS, attemptAutoReload, isChunkLoadError } from '../../utils/chunkReload.js'

// Around the lazy routes. If a page chunk fails to load, the first time the page
// reloads itself (the new index.html names the new chunks); when that is not allowed
// any more (it already did, within the last minute) or does not help, the visitor
// gets a message with a "Refresh" button instead of a spinner. `resetKey` (the
// current path) clears the failure when the visitor navigates elsewhere.
class ChunkErrorBoundary extends Component {
  state = { failed: false, reloading: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error) && attemptAutoReload()) this.setState({ reloading: true })
  }

  componentDidUpdate(previous) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false, reloading: false })
    }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return this.state.reloading ? <PageSkeleton /> : <LoadFailure />
  }
}

export default ChunkErrorBoundary

// The Suspense fallback: the usual skeleton, but never forever - after SLOW_LOAD_MS
// it gives way to the same message and button.
export function SlowLoadFallback() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_LOAD_MS)
    return () => clearTimeout(timer)
  }, [])
  return slow ? <LoadFailure /> : <PageSkeleton />
}
