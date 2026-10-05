import identity from "../../brand/identity.json"

/** One shared geometry for the parent brand and its product family. */
export function BrandMark({
  grid = false,
  size = 32,
  className = "",
}: {
  grid?: boolean
  size?: number
  className?: string
}) {
  return (
    <svg
      className={`dynostack-mark ${className}`}
      width={size}
      height={size}
      viewBox={identity.viewBox}
      fill="currentColor"
      aria-hidden="true"
    >
      {identity.outerPaths.map((path) => (
        <path key={path} d={path} />
      ))}
      {grid ? (
        identity.gridPaths.map((path) => <path key={path} d={path} />)
      ) : (
        <path d={identity.corePath} />
      )}
    </svg>
  )
}
