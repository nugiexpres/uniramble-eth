/**
 * Utility functions for mobile device detection
 */

/**
 * Check if the current device is a mobile device based on user agent
 */
export const isMobileUserAgent = (): boolean => {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

  return mobileKeywords.test(userAgent);
};

/**
 * Check if the current viewport is mobile-sized
 */
export const isMobileViewport = (): boolean => {
  if (typeof window === "undefined") return false;

  return window.innerWidth < 768; // Tailwind's md breakpoint
};

/**
 * Check if the current device is mobile (combines user agent and viewport check)
 */
export const isMobileDevice = (): boolean => {
  return isMobileUserAgent() || isMobileViewport();
};

/**
 * Get device type
 */
export const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
  if (typeof window === "undefined") return "desktop";

  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  // Check for tablet
  if (/ipad|android(?!.*mobile)|tablet/i.test(userAgent) || (width >= 768 && width <= 1024)) {
    return "tablet";
  }

  // Check for mobile
  if (isMobileDevice()) {
    return "mobile";
  }

  return "desktop";
};

/**
 * Check if touch is supported
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - old browsers
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Get orientation
 */
export const getOrientation = (): "portrait" | "landscape" => {
  if (typeof window === "undefined") return "portrait";

  return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
};
