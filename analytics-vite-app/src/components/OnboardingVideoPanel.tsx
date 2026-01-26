import React, { useEffect, useMemo, useState } from 'react'

type OnboardingVideoPanelProps = {
  userId?: string | null
}

const STORAGE_PREFIX = 'fnnl:onboardingVideoDismissed:'
const VIDEO_URL = 'https://player.vimeo.com/video/1158563687?title=0&byline=0&portrait=0'

const getStorageKey = (userId?: string | null) =>
  `${STORAGE_PREFIX}${userId || 'anonymous'}`

export default function OnboardingVideoPanel({ userId }: OnboardingVideoPanelProps) {
  const storageKey = useMemo(() => getStorageKey(userId), [userId])
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      setIsDismissed(stored === 'true')
    } catch {
      setIsDismissed(false)
    }
  }, [storageKey])

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // Ignore storage errors; hide for this session
    }
    setIsDismissed(true)
  }

  if (isDismissed) return null

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#111827' }}>
              Welcome to FNNL
            </h2>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#1d4ed8',
              backgroundColor: '#eff6ff',
              padding: '2px 8px',
              borderRadius: '999px'
            }}>
              New
            </span>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: 1.6 }}>
            A short walkthrough to help you get set up and understand how FNNL turns your data into clarity.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            color: '#6b7280',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            height: 'fit-content'
          }}
        >
          Hide for now
        </button>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ maxWidth: '720px', width: '100%' }}>
          <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
            <iframe
              src={VIDEO_URL}
              title="FNNL Onboarding Video"
              allow="fullscreen; picture-in-picture"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
