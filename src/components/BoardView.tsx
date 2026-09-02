import { isSunk, shipAt } from '../game/board'
import { BOARD_SIZE, type Board, type Coord } from '../game/types'

interface Props {
  title: string
  board: Board
  /** Show ship positions (own board) or hide them (enemy board). */
  revealShips: boolean
  onCellClick?: (c: Coord) => void
  disabled?: boolean
}

export function BoardView({ title, board, revealShips, onCellClick, disabled }: Props) {
  const interactive = Boolean(onCellClick) && !disabled
  const remaining = board.ships.filter((s) => !isSunk(s)).length

  return (
    <section className="board-section">
      <h2>
        {title}
        <span className="badge" title="Ships remaining">
          {remaining} / {board.ships.length}
        </span>
      </h2>
      <div className={`board${interactive ? ' interactive' : ''}`}>
        <div className="corner" />
        {Array.from({ length: BOARD_SIZE }, (_, col) => (
          <div key={`c${col}`} className="label">
            {col + 1}
          </div>
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, row) => (
          <RowView
            key={row}
            row={row}
            board={board}
            revealShips={revealShips}
            interactive={interactive}
            onCellClick={onCellClick}
          />
        ))}
      </div>
    </section>
  )
}

function RowView({
  row,
  board,
  revealShips,
  interactive,
  onCellClick,
}: {
  row: number
  board: Board
  revealShips: boolean
  interactive: boolean
  onCellClick?: (c: Coord) => void
}) {
  return (
    <>
      <div className="label">{String.fromCharCode(65 + row)}</div>
      {Array.from({ length: BOARD_SIZE }, (_, col) => {
        const c = { row, col }
        const shot = board.shots[row][col]
        const ship = shipAt(board, c)
        const sunk = ship ? isSunk(ship) : false

        const classes = ['cell']
        if (shot === 'miss') classes.push('miss')
        if (shot === 'hit') classes.push(sunk ? 'sunk' : 'hit')
        if (revealShips && ship && shot === 'unknown') classes.push('ship')

        const name = `${String.fromCharCode(65 + row)}${col + 1}`
        const outcome =
          shot === 'miss' ? 'miss' : shot === 'hit' ? (sunk ? `hit, ${ship!.name} sunk` : 'hit') : ''
        const canClick = interactive && shot === 'unknown'

        return (
          <button
            key={col}
            type="button"
            className={classes.join(' ')}
            aria-label={outcome ? `${name}: ${outcome}` : name}
            disabled={!canClick}
            onClick={canClick ? () => onCellClick?.(c) : undefined}
          >
            {shot === 'hit' ? '✕' : ''}
          </button>
        )
      })}
    </>
  )
}

export function Legend({ showShip }: { showShip: boolean }) {
  return (
    <p className="legend">
      <span className="swatch miss" /> miss
      <span className="swatch hit">✕</span> hit
      <span className="swatch sunk">✕</span> sunk
      {showShip && (
        <>
          <span className="swatch ship" /> your ship
        </>
      )}
    </p>
  )
}
