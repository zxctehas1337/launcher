import { useEffect, useRef, useMemo } from 'react'
import '../styles/components/PixelBackground.css'

interface Pixel {
    x: number
    y: number
    opacity: number
    fadeIn: boolean
    static?: boolean
}

// Generate random organic shape path
function generateOrganicShape(): string {
    const points: { x: number; y: number }[] = []
    const numPoints = 12 + Math.floor(Math.random() * 8) // 12-20 points

    // Generate random points around a circle with variation
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2
        const radiusVariation = 0.6 + Math.random() * 0.4 // 60-100% of base radius
        const angleVariation = (Math.random() - 0.5) * 0.3 // Add some angle randomness

        const x = 50 + Math.cos(angle + angleVariation) * 45 * radiusVariation
        const y = 50 + Math.sin(angle + angleVariation) * 45 * radiusVariation

        points.push({ x, y })
    }

    // Create smooth path using quadratic curves
    let path = `M ${points[0].x} ${points[0].y}`

    for (let i = 0; i < points.length; i++) {
        const current = points[i]
        const next = points[(i + 1) % points.length]
        const controlX = (current.x + next.x) / 2 + (Math.random() - 0.5) * 10
        const controlY = (current.y + next.y) / 2 + (Math.random() - 0.5) * 10

        path += ` Q ${controlX} ${controlY}, ${next.x} ${next.y}`
    }

    path += ' Z'
    return path
}

export default function PixelBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const maskId = useMemo(() => `mask-${Math.random().toString(36).substr(2, 9)}`, [])
    const shapePath = useMemo(() => generateOrganicShape(), [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const updateSize = () => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
        }
        updateSize()
        window.addEventListener('resize', updateSize)

        const pixelSize = 3
        const gap = 7
        const pixels: Pixel[] = []

        // Create static pixels (7-8 pixels)
        const staticPixelCount = Math.floor(Math.random() * 2) + 7 // 7 or 8
        const staticPixels: Pixel[] = []

        for (let i = 0; i < staticPixelCount; i++) {
            staticPixels.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                opacity: 0.6 + Math.random() * 0.4,
                fadeIn: true,
                static: true
            })
        }

        // Create dynamic pixels grid
        const cols = Math.floor(canvas.width / (pixelSize + gap))
        const rows = Math.floor(canvas.height / (pixelSize + gap))

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                pixels.push({
                    x: col * (pixelSize + gap) + gap,
                    y: row * (pixelSize + gap) + gap,
                    opacity: Math.random(),
                    fadeIn: Math.random() > 0.5
                })
            }
        }

        // Animation loop with throttling for better performance
        let animationId: number
        let lastFrameTime = 0
        const targetFPS = 30 // Throttle to 30 FPS instead of 60

        const animate = (currentTime: number = 0) => {
            // Skip frame if not enough time has passed
            if (currentTime - lastFrameTime < 1000 / targetFPS) {
                animationId = requestAnimationFrame(animate)
                return
            }
            lastFrameTime = currentTime
            const isLight = document.documentElement.getAttribute('data-theme') === 'light'
            const opacityMultiplier = isLight ? 2.0 : 0.4 // Much higher opacity for light mode

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw dynamic pixels
            pixels.forEach(pixel => {
                if (pixel.fadeIn) {
                    pixel.opacity += 0.01 + Math.random() * 0.02
                    if (pixel.opacity >= 1) {
                        pixel.opacity = 1
                        pixel.fadeIn = false
                    }
                } else {
                    pixel.opacity -= 0.01 + Math.random() * 0.02
                    if (pixel.opacity <= 0) {
                        pixel.opacity = 0
                        pixel.fadeIn = true
                    }
                }

                // Use black color for light theme for better contrast
                const pixelColor = isLight ? 'rgba(0, 0, 0' : 'rgba(255, 107, 0'
                ctx.fillStyle = `${pixelColor}, ${pixel.opacity * opacityMultiplier})`
                ctx.fillRect(pixel.x, pixel.y, pixelSize, pixelSize)
            })

            // Draw static pixels
            staticPixels.forEach(pixel => {
                // Use black color for light theme for better contrast
                const pixelColor = isLight ? 'rgba(0, 0, 0' : 'rgba(255, 107, 0'
                ctx.fillStyle = `${pixelColor}, ${pixel.opacity * (isLight ? 3.0 : 1)})`
                ctx.fillRect(pixel.x, pixel.y, pixelSize, pixelSize)
            })

            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', updateSize)
            cancelAnimationFrame(animationId)
        }
    }, [])

    return (
        <div className="pixel-background-container">
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <clipPath id={maskId} clipPathUnits="objectBoundingBox">
                        <path
                            d={shapePath}
                            transform="scale(0.01, 0.01)"
                        />
                    </clipPath>
                </defs>
            </svg>
            <canvas
                ref={canvasRef}
                className="pixel-background-canvas"
                style={{ clipPath: `url(#${maskId})` }}
            />
        </div>
    )
}
