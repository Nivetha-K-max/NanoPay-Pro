export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error("Application Error:", error, context);
  }
  
  // Add your production error tracking service here (e.g., Sentry, Rollbar, etc.)
  // Example:
  // if (import.meta.env.PROD) {
  //   yourErrorTracker.captureException(error, {
  //     extra: context,
  //     tags: { route: window.location.pathname }
  //   });
  // }
}
