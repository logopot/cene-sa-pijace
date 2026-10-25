// Small seeded PRNG (mulberry32) over a string seed hashed with FNV-1a, so a
// "random" pick can be repeated exactly: the build-time prerender of the
// homepage and the live app must choose the same cards, or the swap from one
// to the other would visibly reshuffle them.
function hashSeed(text) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRandom(seed) {
  let state = hashSeed(String(seed))
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// With a seed the order is deterministic (same items + same seed = same
// result); without one it is a plain Math.random shuffle, as before.
export function shuffleArray(items, seed) {
  const random = seed === undefined ? Math.random : createRandom(seed)
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
