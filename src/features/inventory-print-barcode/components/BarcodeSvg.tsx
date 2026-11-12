'use client'

/**
 * A lightweight, dependency-free barcode renderer. It does NOT encode a real
 * symbology (no JsBarcode dependency is available) — instead it deterministically
 * maps the source string to a sequence of alternating black/white bars of varying
 * widths, giving a convincing barcode-style box plus the human-readable code text
 * underneath. Purely a visual placeholder for the Print Barcode / Label preview.
 */
export function BarcodeSvg({
  value,
  height = 44,
}: {
  value: string
  height?: number
}) {
  const code = value || '—'
  // Derive a repeatable set of bar widths (1–4 modules) from the char codes.
  const bars: number[] = []
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i)
    bars.push((c % 3) + 1) // bar width
    bars.push(((c >> 2) % 3) + 1) // gap width
  }
  // Pad so even short codes produce a reasonable barcode.
  while (bars.length < 24) bars.push((bars.length % 3) + 1)

  const unit = 2
  const totalWidth = bars.reduce((sum, w) => sum + w * unit, 0)

  let x = 0
  const rects: { x: number; w: number }[] = []
  bars.forEach((w, i) => {
    const px = w * unit
    if (i % 2 === 0) rects.push({ x, w: px }) // black bar on even indices
    x += px
  })

  return (
    <div className="flex flex-col items-center">
      <svg
        width="100%"
        viewBox={`0 0 ${totalWidth} ${height}`}
        preserveAspectRatio="none"
        height={height}
        role="img"
        aria-label={`Barcode ${code}`}
      >
        <rect x={0} y={0} width={totalWidth} height={height} fill="#ffffff" />
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={0} width={r.w} height={height} fill="#111111" />
        ))}
      </svg>
      <span className="mt-0.5 font-mono text-[10px] tracking-widest text-black">{code}</span>
    </div>
  )
}
