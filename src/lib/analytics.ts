import ReactGA from 'react-ga4';

/**
 * Initialize Google Analytics 4
 * Safe to call multiple times - will only initialize once
 */
export const initGA = () => {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;
  
  if (!trackingId) {
    console.warn('GA4 tracking ID not found. Analytics will not be initialized.');
    return;
  }

  try {
    ReactGA.initialize(trackingId, {
      gaOptions: {
        anonymizeIp: true,
      },
    });
    console.log('GA4 initialized successfully');
  } catch (error) {
    console.error('Failed to initialize GA4:', error);
  }
};

/**
 * Track a custom event with optional parameters
 * Safe to call even if GA4 failed to initialize
 */
export const trackEvent = (
  action: string,
  params?: Record<string, any>
) => {
  try {
    ReactGA.event(action, params);
  } catch (error) {
    // Silent fail - don't break app if analytics fails (e.g., adblockers)
    console.debug('GA4 event tracking failed:', error);
  }
};

/**
 * Track a page view
 * Safe to call even if GA4 failed to initialize
 */
export const trackPageView = (path: string, title?: string) => {
  try {
    ReactGA.send({ 
      hitType: "pageview", 
      page: path,
      title: title 
    });
  } catch (error) {
    console.debug('GA4 pageview tracking failed:', error);
  }
};
