import React, { useState, useRef, useEffect } from 'react'

interface InfoTooltipProps {
  content: React.ReactNode
  /** Optional min width for the tooltip (default 280px) */
  minWidth?: number
  /** Optional max width for the tooltip (default 560px) */
  maxWidth?: number
  /** 'icon' = ? icon trigger (default); 'inline' = children as trigger, no icon */
  variant?: 'icon' | 'inline'
  children?: React.ReactNode
}

const TooltipPopup = ({ content, minWidth, maxWidth, isVisible, onEnter, onLeave }: {
  content: React.ReactNode
  minWidth: number
  maxWidth: number
  isVisible: boolean
  onEnter: () => void
  onLeave: () => void
}) => (
  isVisible ? (
    <div
      role="tooltip"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-8px)',
        zIndex: 9999,
        minWidth: minWidth,
        maxWidth: maxWidth,
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
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #374151',
        }}
      />
    </div>
  ) : null
)

/**
 * Small info icon that shows a tooltip on hover.
 * Use next to labels to provide definitions and clarity.
 * variant="inline" uses children as the trigger (e.g. column headers) with no icon.
 */
export function InfoTooltip({ content, minWidth = 280, maxWidth = 560, variant = 'icon', children }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLSpanElement>(null)

  const handleEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setIsVisible(true)
  }

  const handleLeave = () => {
    hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 100)
  }

  const handleClick = () => {
    setIsVisible(prev => !prev)
  }

  // Close on click outside when using inline variant
  useEffect(() => {
    if (variant !== 'inline' || !isVisible) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVisible(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [variant, isVisible])

  if (variant === 'inline') {
    return (
      <span
        ref={containerRef}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={handleClick}
      >
        {children}
        <TooltipPopup content={content} minWidth={minWidth} maxWidth={maxWidth} isVisible={isVisible} onEnter={handleEnter} onLeave={handleLeave} />
      </span>
    )
  }

  return (
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
      <TooltipPopup content={content} minWidth={minWidth} maxWidth={maxWidth} isVisible={isVisible} onEnter={handleEnter} onLeave={handleLeave} />
    </span>
  )
}
