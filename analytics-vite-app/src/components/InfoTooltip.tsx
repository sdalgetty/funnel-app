import React, { useState, useRef } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  content: React.ReactNode
  /** Optional max width for the tooltip (default 280px) */
  maxWidth?: number
}

/**
 * Small info icon that shows a tooltip on hover.
 * Use next to labels to provide definitions and clarity.
 */
export function InfoTooltip({ content, maxWidth = 280 }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4, cursor: 'help' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: '#9ca3af',
          color: 'white',
        }}
      >
        <Info size={10} strokeWidth={2.5} />
      </span>
      {isVisible && (
        <div
          role="tooltip"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-8px)',
            zIndex: 9999,
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
          <div>
            {content}
          </div>
          {/* Arrow */}
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
      )}
    </span>
  )
}
