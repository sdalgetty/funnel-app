import posthog from 'posthog-js'
import { logger } from '../utils/logger'

// PostHog configuration
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

/**
 * Initialize PostHog analytics
 * Should be called once when the app starts
 */
export const initPostHog = () => {
  // Only initialize if PostHog key is provided
  if (!POSTHOG_KEY) {
    logger.warn('PostHog key not found. Analytics will be disabled.')
    return
  }

  // Check if we're in development
  const isDev = import.meta.env.DEV

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Disable autocapture in development to reduce noise
    autocapture: !isDev,
    // Capture pageviews automatically
    loaded: (posthog) => {
      if (isDev) {
        logger.log('PostHog initialized successfully')
      }
    },
    // Privacy settings
    capture_pageview: true,
    capture_pageleave: true,
    // Disable session recording by default (can be enabled per user if needed)
    disable_session_recording: true,
    // Respect Do Not Track
    respect_dnt: true,
  })

  return posthog
}

/**
 * Get the PostHog instance
 * Returns null if PostHog is not initialized
 */
export const getPostHog = () => {
  if (!POSTHOG_KEY) {
    return null
  }
  return posthog
}

/**
 * Identify a user in PostHog
 * Call this after user logs in
 */
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  const instance = getPostHog()
  if (instance) {
    instance.identify(userId, properties)
    logger.log('PostHog: User identified', userId)
  }
}

/**
 * Reset PostHog (call on logout)
 */
export const resetPostHog = () => {
  const instance = getPostHog()
  if (instance) {
    instance.reset()
    logger.log('PostHog: Reset')
  }
}

/**
 * Track a custom event
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  const instance = getPostHog()
  if (instance) {
    instance.capture(eventName, properties)
    if (import.meta.env.DEV) {
      logger.log('PostHog: Event tracked', eventName, properties)
    }
  }
}

