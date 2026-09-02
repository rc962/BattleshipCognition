import { describe, expect, it } from 'vitest'
import { quipFor } from './quips'
import { FLEET } from './types'

const ship = { ...FLEET[4], cells: [], hits: 0 }

describe('quipFor', () => {
  it('picks a line from the pool matching the outcome', () => {
    expect(quipFor({ kind: 'miss' }, () => 0)).toBe('Nothing.')
    expect(quipFor({ kind: 'miss' }, () => 0.99)).toBe('Close enough for government work.')
    expect(quipFor({ kind: 'hit', ship }, () => 0.5)).toBe('Not ideal for them.')
    expect(quipFor({ kind: 'sunk', ship }, () => 0.99)).toBe("That one's done.")
  })

  it('says nothing for an ignored repeat shot', () => {
    expect(quipFor({ kind: 'already-attacked' })).toBe('')
  })
})
