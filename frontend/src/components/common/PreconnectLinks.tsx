import { useEffect } from "react";
import { API_BASE_URL } from "../../services/api";

/**
 * PreconnectLinks - Automatically injects preconnect and dns-prefetch links
 * based on API URL. Works for both development and production automatically.
 * 
 * This component extracts the base URL from API_BASE_URL and adds preconnect
 * links to improve API request performance.
 */
export function PreconnectLinks() {
  useEffect(() => {
    // Extract base URL from API_BASE_URL (remove /api if present)
    // Example: http://127.0.0.1:8000/api -> http://127.0.0.1:8000
    // Example: https://its.fkkumj.ac.id/api -> https://its.fkkumj.ac.id
    const apiUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    
    // Check if preconnect already exists to avoid duplicates
    const existingPreconnect = document.querySelector(`link[rel="preconnect"][href="${apiUrl}"]`);
    const existingDnsPrefetch = document.querySelector(`link[rel="dns-prefetch"][href="${apiUrl}"]`);
    
    if (!existingPreconnect) {
      const preconnectLink = document.createElement("link");
      preconnectLink.rel = "preconnect";
      preconnectLink.href = apiUrl;
      preconnectLink.crossOrigin = "anonymous";
      document.head.appendChild(preconnectLink);
    }
    
    if (!existingDnsPrefetch) {
      const dnsPrefetchLink = document.createElement("link");
      dnsPrefetchLink.rel = "dns-prefetch";
      dnsPrefetchLink.href = apiUrl;
      document.head.appendChild(dnsPrefetchLink);
    }
    
    // Cleanup on unmount (though usually not needed)
    return () => {
      // Optional: cleanup if component unmounts
    };
  }, []); // Only run once on mount
  
  return null; // This component doesn't render anything
}

