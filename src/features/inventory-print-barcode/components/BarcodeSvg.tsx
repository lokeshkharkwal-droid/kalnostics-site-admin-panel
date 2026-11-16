'use client'

/**
 * Canonical Code 128 symbol patterns, indexed by symbol value 0-106. Each entry
 * is the module-width sequence of its 6 elements (bar, space, bar, space, bar,
 * space), summing to 11 modules; value 106 (stop) has 7 elements / 13 modules.
 */
const CODE128_PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213',
  '122312', '132212', '221213', '221312', '231212', '112232', '122132',
  '122231', '113222', '123122', '123221', '223211', '221132', '221231',
  '213212', '223112', '312131', '311222', '321122', '321221', '312212',
  '322112', '322211', '212123', '212321', '232121', '111323', '131123',
  '131321', '112313', '132113', '132311', '211313', '231113', '231311',
  '112133', '112331', '132131', '113123', '113321', '133121', '313121',
  '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111',
  '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114',
  '413111', '241112', '134111', '111242', '121142', '121241', '114212',
  '124112', '124211', '411212', '421112', '421211', '212141', '214121',
  '412121', '111143', '111341', '131141', '114113', '114311', '411113',
  '411311', '113141', '114131', '311141', '411131', '211412', '211214',
  '211232', '2331112',
]
const START_B = 104
const STOP = 106

/** Encode `value` to Code 128 (code set B) bars: [x, width] rects + total module width. */
function code128(value: string): { rects: { x: number; w: number }[]; width: number } {
  const clean = (value || '').replace(/[^\x20-\x7e]/g, '')
  const codes: number[] = [START_B]
  for (const ch of clean) codes.push(ch.charCodeAt(0) - 32)
  let sum = START_B
  for (let i = 1; i < codes.length; i++) sum += (codes[i] ?? 0) * i
  codes.push(sum % 103)
  codes.push(STOP)

  const rects: { x: number; w: number }[] = []
  let x = 0
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code]
    if (!pattern) continue
    for (let i = 0; i < pattern.length; i++) {
      const w = Number(pattern[i])
      if (i % 2 === 0) rects.push({ x, w }) // even elements are bars
      x += w
    }
  }
  return { rects, width: x }
}

/**
 * A real, scannable Code 128 (code set B) barcode rendered as inline SVG — no
 * external dependency. Code set B covers printable ASCII 32-126 (alphanumeric
 * product codes). The human-readable code is printed underneath.
 */
export function BarcodeSvg({
  value,
  height = 44,
  showText = true,
}: {
  value: string
  height?: number
  showText?: boolean
}) {
  const code = value || '—'
  const { rects, width } = code128(code)

  return (
    <div className="flex w-full flex-col items-center">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        height={height}
        role="img"
        aria-label={`Barcode ${code}`}
      >
        <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={0} width={r.w} height={height} fill="#111111" />
        ))}
      </svg>
      {showText && (
        <span className="mt-0.5 font-mono text-[10px] tracking-widest text-black">{code}</span>
      )}
    </div>
  )
}
