import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app's stylesheet (bootstrap + global CSS) is a render-blocking <link> by
// default, which holds back first paint even though the pre-rendered snapshot
// (see index.html's #snapshot) carries its own inline styles. Loading it as
// print-media-then-all keeps it off the critical path; React only renders
// after the JS bundle arrives, by which point the (far smaller) CSS is in.
function nonBlockingCss() {
  return {
    name: 'non-blocking-css',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(/<link rel="stylesheet"([^>]*?)href="([^"]+\.css)"([^>]*)>/g, (_, before, href, after) => {
        const tag = `<link rel="stylesheet"${before}href="${href}"${after}`
        return `${tag} media="print" onload="this.media='all'">\n    <noscript>${tag}></noscript>`
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nonBlockingCss()],
})
