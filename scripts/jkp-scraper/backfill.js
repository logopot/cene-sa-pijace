import 'dotenv/config'
import { run } from './src/run.js'

// One-time historical backfill for Dec 29, 2025 - Jun 29, 2026: bgpijace.rs's
// own barometar dropdown still holds every date in this window (verified
// directly against the live site - see run.js's resolveTargetDates), so this
// pulls straight from the live site rather than a third-party archive. Fixed
// range, not read from .env - this script always targets exactly this
// window regardless of any JKP_DATE/JKP_DATE_FROM/JKP_DATE_TO already set
// there, so re-running it later can't accidentally drift to a different range.
process.env.JKP_DATE = ''
process.env.JKP_DATE_FROM = '2025-12-29'
process.env.JKP_DATE_TO = '2026-06-29'

run().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
