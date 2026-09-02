import type { Rng } from './board'
import type { AttackResult } from './types'

const QUIPS: Record<Exclude<AttackResult['kind'], 'already-attacked'>, string[]> = {
  hit: ['Confirmed.', 'That was expensive.', 'Not ideal for them.', 'They felt that.'],
  sunk: ['Problem solved.', 'Removed from service.', "That one's done."],
  miss: ['Nothing.', 'Water.', 'Try again.', 'Close enough for government work.'],
}

export function quipFor(result: AttackResult, rng: Rng = Math.random): string {
  if (result.kind === 'already-attacked') return ''
  const pool = QUIPS[result.kind]
  return pool[Math.floor(rng() * pool.length)]
}
