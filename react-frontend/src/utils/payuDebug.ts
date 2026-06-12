/**
 * PayU Debug Utilities
 *
 * Helper functions to debug PayU script loading and integration issues
 */

import { debugPayUStatus, isPayUAvailable } from './payuCheckout';

/**
 * Test PayU script loading
 */
export const testPayUScriptLoading = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('=== Testing PayU Script Loading ===');

    // Check if already loaded
    if (isPayUAvailable()) {
      return {
        success: true,
        message: 'PayU script is already loaded and available',
      };
    }

    // Check network connectivity
    const scriptUrl = 'https://checkout-static.payu.in/checkout.min.js';
    console.log('Testing network connectivity to:', scriptUrl);

    try {
      const response = await fetch(scriptUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      console.log('Network test result: CDN is reachable');
    } catch (networkError) {
      console.error('Network test failed:', networkError);
      return {
        success: false,
        message: 'PayU CDN is not reachable. Check your internet connection.',
        details: { networkError }
      };
    }

    // Check if script is in DOM
    const existingScript = document.querySelector('script[src*="checkout-static.payu.in"]');
    if (existingScript) {
      console.log('Script element found in DOM, waiting for load...');

      // Wait for script to load
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (isPayUAvailable()) {
            clearInterval(checkInterval);
            resolve({
              success: true,
              message: 'PayU script loaded successfully after waiting',
            });
          }
        }, 500);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve({
            success: false,
            message: 'PayU script found in DOM but PayUCheckout object not available after 10 seconds',
          });
        }, 10000);
      });
    }

    // Try to load script manually
    console.log('Attempting to load PayU script manually...');
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        resolve({
          success: false,
          message: 'PayU script loading timed out after 15 seconds',
        });
      }, 15000);

      script.onload = () => {
        clearTimeout(timeout);
        setTimeout(() => {
          if (isPayUAvailable()) {
            resolve({
              success: true,
              message: 'PayU script loaded successfully manually',
            });
          } else {
            resolve({
              success: false,
              message: 'PayU script loaded but PayUCheckout object not available',
            });
          }
        }, 500);
      };

      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Manual script loading failed:', error);
        resolve({
          success: false,
          message: 'Failed to load PayU script manually',
          details: { error }
        });
      };

      document.head.appendChild(script);
    });

  } catch (error) {
    console.error('PayU debug test failed:', error);
    return {
      success: false,
      message: 'Unexpected error during PayU testing',
      details: { error }
    };
  }
};

/**
 * Get comprehensive PayU status report
 */
export const getPayUStatusReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    payuAvailable: isPayUAvailable(),
    scriptInDOM: !!document.querySelector('script[src*="checkout-static.payu.in"]'),
    networkOnline: navigator.onLine,
    userAgent: navigator.userAgent,
    location: window.location.href,
    referrer: document.referrer,
    cookiesEnabled: navigator.cookieEnabled,
    // Check for common blocking issues
    adBlockerDetected: typeof (window as any).adblockEnabled === 'boolean',
    contentSecurityPolicy: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content'),
  };

  console.log('=== PayU Status Report ===');
  console.table(report);
  console.log('=== End Report ===');

  return report;
};

/**
 * Run full PayU diagnostic
 */
export const runPayUDiagnostic = async () => {
  console.log('🔍 Starting PayU Diagnostic...');

  // Get status report
  const status = getPayUStatusReport();

  // Test script loading
  const scriptTest = await testPayUScriptLoading();

  // Debug PayU status
  debugPayUStatus();

  const diagnostic = {
    status,
    scriptTest,
    recommendations: [] as string[],
  };

  // Generate recommendations
  if (!status.payuAvailable) {
    diagnostic.recommendations.push('PayU is not available - check script loading');
  }

  if (!status.networkOnline) {
    diagnostic.recommendations.push('Device is offline - check internet connection');
  }

  if (!scriptTest.success) {
    diagnostic.recommendations.push('Script loading failed - check network and PayU CDN availability');
    diagnostic.recommendations.push('Try disabling ad blockers or VPN');
    diagnostic.recommendations.push('Check browser console for CSP or CORS errors');
  }

  if (status.adBlockerDetected) {
    diagnostic.recommendations.push('Ad blocker detected - may be blocking PayU scripts');
  }

  console.log('📋 Diagnostic Results:', diagnostic);

  return diagnostic;
};

// Export for use in browser console
(window as any).payuDebug = {
  testPayUScriptLoading,
  getPayUStatusReport,
  runPayUDiagnostic,
  debugPayUStatus,
  isPayUAvailable,
};

console.log('💡 PayU Debug utilities loaded. Use payuDebug.runPayUDiagnostic() in console for full diagnostic.');
