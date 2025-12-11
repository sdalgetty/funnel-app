import { useEffect } from 'react'
import { getPostHog, identifyUser, trackEvent, resetPostHog } from '../lib/posthog'

/**
 * Hook for PostHog analytics
 * Provides easy access to tracking functions
 */
export const usePostHog = () => {
  return {
    identify: identifyUser,
    track: trackEvent,
    reset: resetPostHog,
    isEnabled: () => getPostHog() !== null,
  }
}

/**
 * Hook to track page views
 * Call this in components that represent different pages
 */
export const usePageView = (pageName: string, properties?: Record<string, any>) => {
  useEffect(() => {
    trackEvent('page_viewed', {
      page: pageName,
      ...properties,
    })
  }, [pageName, properties])
}

