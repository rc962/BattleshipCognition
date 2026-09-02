import { isSunk } from '../game/board'
import type { Board } from '../game/types'

interface Props {
  board: Board
  /** Show per-ship damage. Off for the enemy so only sunk ships are revealed. */
  showDamage: boolean
}

export function FleetStatus({ board, showDamage }: Props) {
  return (
    <ul className="fleet">
      {board.ships.map((ship) => {
        const sunk = isSunk(ship)
        const state = sunk
          ? 'Sunk'
          : showDamage && ship.hits > 0
            ? `${ship.hits}/${ship.length}`
            : 'Afloat'
        return (
          <li key={ship.name} className={sunk ? 'sunk' : 'afloat'}>
            <span>{ship.name}</span>
            <span className="ship-state">{state}</span>
          </li>
        )
      })}
    </ul>
  )
}
