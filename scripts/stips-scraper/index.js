import 'dotenv/config'
import { run } from './src/run.js'

run().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
