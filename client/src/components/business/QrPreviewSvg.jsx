import { useMemo } from 'react'

/**
 * Deterministic crisp SVG QR code matrix for preview & download.
 * Generates a realistic 21x21 QR pattern seeded from the input value.
 */
function buildMatrix(seedText) {
  const size = 21
  const grid = Array.from({ length: size }, () => Array(size).fill(false))

  const placeFinder = (startR, startC) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
        grid[startR + r][startC + c] = isBorder || isInner
      }
    }
  }

  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)

  // Deterministic hash fill for data modules
  let hash = 2166136261
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  const inReserved = (r, c) =>
    (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (inReserved(r, c)) continue
      hash ^= (r * 31 + c * 17) & 0xff
      hash = Math.imul(hash, 16777619)
      grid[r][c] = (hash >>> 0) % 2 === 0
    }
  }

  return { size, grid }
}

export default function QrPreviewSvg({ value = 'reviewbuddy', size = 112, id }) {
  const { size: modules, grid } = useMemo(() => buildMatrix(value), [value])

  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${modules + 2} ${modules + 2}`}
      width={size}
      height={size}
      className="bg-white rounded-md border border-border p-1.5 shrink-0"
      role="img"
      aria-label="QR Code preview"
    >
      <rect width={modules + 2} height={modules + 2} fill="#FFFFFF" />
      {grid.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c + 1}
              y={r + 1}
              width={1}
              height={1}
              fill="#1A1A1A"
            />
          ) : null,
        ),
      )}
    </svg>
  )
}
