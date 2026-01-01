import type { DragEventHandler, MouseEventHandler } from 'react'
import { SITE_LOGO } from '../utils/constants'
import '../styles/LogoWithHat.css'

interface LogoWithHatProps {
  src?: string
  alt: string
  size: number
  className?: string
  draggable?: boolean
  onContextMenu?: MouseEventHandler
  onDragStart?: DragEventHandler
  useSvgLogo?: boolean
}

export default function LogoWithHat({
  src = '/icon.png',
  alt,
  size,
  className,
  draggable = false,
  onContextMenu,
  onDragStart,
  useSvgLogo = true
}: LogoWithHatProps) {
  const logoClassName = ['logoWithHat__logo', className].filter(Boolean).join(' ')

  if (useSvgLogo) {
    return (
      <span className="logoWithHat">
        <div
          className={logoClassName}
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          dangerouslySetInnerHTML={{ __html: SITE_LOGO }}
          draggable={draggable}
          onContextMenu={onContextMenu}
          onDragStart={onDragStart}
        />
      </span>
    )
  }

  return (
    <span className="logoWithHat">
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={logoClassName}
        draggable={draggable}
        onContextMenu={onContextMenu}
        onDragStart={onDragStart}
      />
    </span>
  )
}
