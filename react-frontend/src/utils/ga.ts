export const trackPageView = (path: string) => {
  if (window.gtag) {
    window.gtag('config', 'G-4QP3CNW1JE', {
      page_path: path,
    });
  }
};