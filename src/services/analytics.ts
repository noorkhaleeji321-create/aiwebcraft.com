// AIWebCrafter Google Analytics 4 & Performance Monitoring Service

const GA_STORAGE_KEY = 'aiwebcrafter_ga_id';
export const DEFAULT_GA_MEASUREMENT_ID = 'G-TFLPNTH5H0';

export function getGaMeasurementId(): string {
  if (typeof window === 'undefined') return DEFAULT_GA_MEASUREMENT_ID;
  const stored = localStorage.getItem(GA_STORAGE_KEY);
  if (stored && stored.startsWith('G-')) {
    return stored.trim();
  }
  const envId = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
  if (envId && envId.startsWith('G-')) {
    return envId;
  }
  return DEFAULT_GA_MEASUREMENT_ID;
}

export function saveGaMeasurementId(id: string): void {
  if (typeof window !== 'undefined') {
    const cleanId = id.trim();
    if (cleanId && cleanId.startsWith('G-')) {
      localStorage.setItem(GA_STORAGE_KEY, cleanId);
    } else if (!cleanId) {
      localStorage.removeItem(GA_STORAGE_KEY);
    }
  }
}

export function initGA(): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId || typeof window === 'undefined') return;

  // Initialize dataLayer and gtag if not yet defined
  window.dataLayer = window.dataLayer || [];
  if (!(window as any).gtag) {
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
  }

  // Check if script already injected
  const existingScript = document.getElementById('ga-gtag') || document.querySelector(`script[src*="${measurementId}"]`);
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'ga-gtag';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  (window as any).gtag('js', new Date());
  (window as any).gtag('config', measurementId, {
    send_page_view: true,
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });
}

export function trackPageView(path: string, title: string): void {
  if (typeof window !== 'undefined') {
    const id = getGaMeasurementId();
    if ((window as any).gtag) {
      (window as any).gtag('config', id, {
        page_path: path,
        page_title: title,
        page_location: window.location.origin + path,
      });
      (window as any).gtag('event', 'page_view', {
        page_title: title,
        page_location: window.location.origin + path,
        page_path: path,
        send_to: id
      });
    }
  }
}

export function trackEvent(action: string, category: string, label?: string, value?: number): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

declare global {
  interface Window {
    dataLayer: any[];
  }
}
