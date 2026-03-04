import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface InfoTooltipProps {
  content: React.ReactNode
  /** Optional min width for the tooltip (default 280px) */
  minWidth?: number
  /** Optional max width for the tooltip (default 560px) */
  maxWidth?: number
  /** 'icon' = ? icon trigger (default); 'inline' = children as trigger, no icon */
  variant?: 'icon' | 'inline'
  /** 'top' = above trigger (default); 'bottom' = below trigger (avoids clipping under headers) */
  placement?: 'top' | 'bottom'
  children?: React.ReactNode
}

const PADDING = 12
const TOOLTIP_OFFSET = 8

/**
 * Small info icon that shows a tooltip on hover.
 * Use next to labels to provide definitions and clarity.
 * variant="inline" uses children as the trigger (e.g. column headers) with no icon.
 * placement="bottom" shows tooltip below (use when trigger is near top of a clipped container).
 */
export function InfoTooltip({ content, minWidth = 280, maxWidth = 560, variant = 'icon', placement = 'top', children }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [arrowLeft, setArrowLeft] = useState<number | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    // Set initial position immediately to avoid flash
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const left = Math.max(PADDING, Math.min(centerX - minWidth / 2, window.innerWidth - minWidth - PADDING))
      const top = placement === 'bottom' ? rect.bottom + TOOLTIP_OFFSET : rect.top - 80 - TOOLTIP_OFFSET
      setTooltipStyle({
        position: 'fixed',
        left,
        top: Math.max(PADDING, top),
        minWidth,
        maxWidth,
        zIndex: 99999,
      })
      setArrowLeft(centerX - left)
    }
    setIsVisible(true)
  }

  const handleLeave = () => {
    hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 100)
  }

  const handleClick = () => {
    setIsVisible(prev => !prev)
  }

  // Position tooltip in viewport (portal) - fixes clipping and mobile overflow
  useEffect(() => {
    if (!isVisible || !containerRef.current) return

    const updatePosition = () => {
      const triggerEl = containerRef.current
      const tooltipEl = tooltipRef.current
      if (!triggerEl || !tooltipEl) return

      const triggerRect = triggerEl.getBoundingClientRect()
      const tooltipRect = tooltipEl.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      const triggerCenterX = triggerRect.left + triggerRect.width / 2
      const tooltipWidth = Math.min(maxWidth, Math.max(minWidth, tooltipRect.width || minWidth))
      const halfWidth = tooltipWidth / 2

      // Keep tooltip within viewport horizontally (fixes mobile left cutoff)
      let left = triggerCenterX - halfWidth
      left = Math.max(PADDING, Math.min(left, viewportWidth - tooltipWidth - PADDING))

      // Position above or below trigger
      const estimatedHeight = tooltipRect.height || 80
      let top: number
      if (placement === 'bottom') {
        top = triggerRect.bottom + TOOLTIP_OFFSET
      } else {
        top = triggerRect.top - estimatedHeight - TOOLTIP_OFFSET
        // If would go off top, flip to below
        if (top < PADDING) {
          top = triggerRect.bottom + TOOLTIP_OFFSET
        }
      }

      // Ensure doesn't go off bottom
      if (top + estimatedHeight > viewportHeight - PADDING) {
        top = viewportHeight - estimatedHeight - PADDING
      }

      setTooltipStyle({
        position: 'fixed',
        left,
        top,
        minWidth,
        maxWidth,
        zIndex: 99999,
      })
      // Arrow points to trigger center: offset from tooltip's left edge
      setArrowLeft(triggerCenterX - left)
    }

    // Defer to next frame so tooltip is in DOM and has dimensions
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(updatePosition)
    })
    return () => cancelAnimationFrame(rafId)
  }, [isVisible, minWidth, maxWidth, placement])

  // Close on click outside when using inline variant
  useEffect(() => {
    if (variant !== 'inline' || !isVisible) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
          tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setIsVisible(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [variant, isVisible])

  const tooltipContent = isVisible ? (
    <div
      ref={tooltipRef}
      role="tooltip"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        ...tooltipStyle,
        padding: '10px 12px',
        backgroundColor: '#374151',
        color: 'white',
        fontSize: 12,
        lineHeight: 1.5,
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        whiteSpace: 'normal',
      }}
    >
      <div>{content}</div>
      <div
        style={{
          position: 'absolute',
          left: arrowLeft != null ? arrowLeft : '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          ...(placement === 'top'
            ? { bottom: -6, borderTop: '6px solid #374151' }
            : { top: -6, borderBottom: '6px solid #374151' }),
        }}
      />
    </div>
  ) : null

  const triggerContent = variant === 'inline' ? (
    <span
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
    >
      {children}
    </span>
  ) : (
    <span
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 8, cursor: 'help' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: '1.5px solid #6b7280',
          color: '#6b7280',
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        ?
      </span>
    </span>
  )

  return (
    <>
      {triggerContent}
      {createPortal(tooltipContent, document.body)}
    </>
  )
}
