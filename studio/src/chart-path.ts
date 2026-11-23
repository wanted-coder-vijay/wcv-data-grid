/** Shape-preserving cubic interpolation: bounded tangents avoid overshooting data. */
export function chartPath(
  points: { x: number; y: number }[],
  curve: 'monotone' | 'linear' | 'step' = 'monotone'
): string {
  if (!points.length) return ''
  if (
    points.some(
      (p, i) =>
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        (i > 0 && p.x <= points[i - 1].x)
    )
  )
    throw new Error('Chart coordinates must be finite with increasing x.')
  const start = `M${points[0].x},${points[0].y}`
  if (points.length === 1) return start
  if (curve === 'linear')
    return (
      start +
      points
        .slice(1)
        .map((p) => ` L${p.x},${p.y}`)
        .join('')
    )
  if (curve === 'step')
    return (
      start +
      points
        .slice(1)
        .map((p, i) => ` H${(p.x + points[i].x) / 2} V${p.y} H${p.x}`)
        .join('')
    )
  const slopes = points
    .slice(1)
    .map((p, i) => (p.y - points[i].y) / (p.x - points[i].x))
  const tangents = points.map((_, i) =>
    i === 0
      ? slopes[0]
      : i === points.length - 1
        ? slopes[i - 1]
        : slopes[i - 1] * slopes[i] <= 0
          ? 0
          : (slopes[i - 1] + slopes[i]) / 2
  )
  slopes.forEach((m, i) => {
    if (m === 0) {
      tangents[i] = 0
      tangents[i + 1] = 0
    } else {
      const a = tangents[i] / m,
        b = tangents[i + 1] / m,
        n = Math.hypot(a, b)
      if (n > 3) {
        tangents[i] = (3 * a * m) / n
        tangents[i + 1] = (3 * b * m) / n
      }
    }
  })
  return (
    start +
    points
      .slice(1)
      .map((p, i) => {
        const a = points[i],
          d = (p.x - a.x) / 3
        return ` C${a.x + d},${a.y + tangents[i] * d} ${p.x - d},${p.y - tangents[i + 1] * d} ${p.x},${p.y}`
      })
      .join('')
  )
}
