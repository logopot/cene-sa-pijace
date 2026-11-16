// POST /api/feedback - receives the suggestions/comments form and appends it to
// the "Feedback" tab of the Google spreadsheet. All logic lives in
// functions/lib/feedback.js (so it can be tested with mocks); this file only
// wires it to Cloudflare Pages Functions. Any method other than POST gets 405.
import { handleFeedback } from '../lib/feedback.js'

export function onRequest(context) {
  return handleFeedback(context.request, context.env)
}
