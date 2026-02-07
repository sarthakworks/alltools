import React, { useEffect, useMemo, useRef, useState } from "react";
import { WifiOff, Loader2, CheckCircle2, AlertTriangle, RefreshCcw, ZapOff } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type OfflineStatus = "loading" | "ready" | "offline" | "unavailable";
type SWPhase = "unsupported" | "unregistered" | "installing" | "waiting" | "activating" | "activated" | "redundant" | "unknown";

interface PWAState {
  isOnline: boolean;
  hasSWSupport: boolean;
  swRegistered: boolean;
  swActivated: boolean;
  cacheExists: boolean;
  cacheName: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_NAME_FRAGMENT = "alltools";
const OFFLINE_MODE_KEY = "offlineModeEnabled";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function toPhase(worker?: ServiceWorker | null): SWPhase {
  if (!worker) return "unknown";
  switch (worker.state) {
    case "installing": return "installing";
    case "installed": return "waiting";
    case "activating": return "activating";
    case "activated": return "activated";
    case "redundant": return "redundant";
    default: return "unknown";
  }
}

async function checkCacheStorage(): Promise<{ exists: boolean; name: string }> {
  try {
    const keys = await caches.keys();
    const name = keys.find((k) => k.toLowerCase().includes(CACHE_NAME_FRAGMENT));
    if (!name) return { exists: false, name: "" };

    const cache = await caches.open(name);
    const requests = await cache.keys();
    return { exists: requests.length > 0, name };
  } catch {
    return { exists: false, name: "" };
  }
}

async function checkFullCache(): Promise<boolean> {
  try {
    // Find the Workbox precache (versioned like "alltools-precache-v2-...")
    // Exclude old "alltools-precache-full" caches from previous implementation
    const cacheKeys = await caches.keys();
    const precacheName = cacheKeys.find(k => 
      k.includes('alltools-precache') && 
      k.includes('-v') &&  // Workbox adds version like -v2-
      !k.includes('-full')  // Exclude old full caches
    );
    
    if (!precacheName) return false;
    
    const cache = await caches.open(precacheName);
    const keys = await cache.keys();
    
    // Minimal precache has ~35 HTML files
    // Full offline has 144 source files (compressed variants excluded)
    // Use 50 as threshold to be safe
    return keys.length > 50;
  } catch {
    return false;
  }
}

async function checkNetworkConnectivity(): Promise<boolean> {
  if (!navigator.onLine) return false;
  
  try {
    await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      cache: "no-cache",
      mode: "no-cors"
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// STATE MACHINE: Determines status based on PWA state
// ============================================================================

/**
 * Decision tree for determining offline indicator status
 */
function determineStatus(state: PWAState): {
  status: OfflineStatus;
  showRefresh: boolean;
} {
  if (!state.hasSWSupport) {
    return { status: "unavailable", showRefresh: false };
  }

  if (!state.swRegistered) {
    return { status: "unavailable", showRefresh: false };
  }

  if (!state.isOnline) {
    return {
      status: state.cacheExists ? "offline" : "unavailable",
      showRefresh: false
    };
  }

  if (state.swActivated) {
    return {
      status: state.cacheExists ? "ready" : "unavailable",
      showRefresh: !state.cacheExists
    };
  }

  return { status: "loading", showRefresh: false };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function OfflineIndicator() {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>("loading");
  const [swPhase, setSwPhase] = useState<SWPhase>("unknown");
  const [percent, setPercent] = useState<number | null>(null);
  const [cacheName, setCacheName] = useState<string>("");
  const [fullyCached, setFullyCached] = useState(false);
  const [showEnableButton, setShowEnableButton] = useState(false);

  const refreshingRef = useRef(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefresh = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
        }
      }
      window.location.reload();
    } catch (e) {
      console.error("Failed to unregister SW:", e);
      window.location.reload();
    }
  };

  const handleEnableFullOffline = async () => {
    try {
      setOfflineStatus("loading");
      setPercent(0);
      
      // Fetch the manifest of all URLs to cache
      const manifestResponse = await fetch("/cache-manifest.json");
      if (!manifestResponse.ok) {
        throw new Error("Failed to fetch cache manifest");
      }
      
      const manifest = await manifestResponse.json();
      const urls = manifest.urls || [];
      
      console.log(`[OfflineIndicator] Enabling full offline mode for ${urls.length} URLs`);
      
      // Get SW registration
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg || !reg.active) {
        console.error("[OfflineIndicator] No active service worker");
        setOfflineStatus("unavailable");
        return;
      }
      
      // Create message channel for communication
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const data = event.data;
        
        if (data.type === "PRECACHE_PROGRESS") {
          setPercent(data.percent);
          setOfflineStatus("loading");
        }
        
        if (data.type === "PRECACHE_DONE") {
          setPercent(100);
          setOfflineStatus("ready");
          setFullyCached(true);
          setShowEnableButton(false);
          
          // Save preference
          localStorage.setItem(OFFLINE_MODE_KEY, "true");
          
          console.log("[OfflineIndicator] Full offline mode enabled", data);
        }
        
        if (data.type === "PRECACHE_ERROR") {
          console.error("[OfflineIndicator] Full offline cache error:", data.error);
          setOfflineStatus("unavailable");
          setPercent(null);
        }
      };
      
      // Send message to SW
      reg.active.postMessage(
        {
          type: "ENABLE_FULL_OFFLINE",
          urls: urls
        },
        [messageChannel.port2]
      );
      
    } catch (error) {
      console.error("[OfflineIndicator] Error enabling full offline:", error);
      setOfflineStatus("unavailable");
      setPercent(null);
    }
  };

  const updateStatus = async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      const hasSWSupport = "serviceWorker" in navigator && "caches" in window;
      
      if (!hasSWSupport) {
        setOfflineStatus("unavailable");
        setSwPhase("unsupported");
        setShowEnableButton(false);
        return;
      }

      const sw = navigator.serviceWorker;
      const reg = await sw.getRegistration();
      const isOnline = await checkNetworkConnectivity();
      const { exists: cacheExists, name } = await checkCacheStorage();
      const hasFullCache = await checkFullCache();

      setCacheName(name);
      setFullyCached(hasFullCache);

      const pwaState: PWAState = {
        isOnline,
        hasSWSupport,
        swRegistered: !!reg,
        swActivated: reg?.active?.state === "activated",
        cacheExists,
        cacheName: name
      };

      if (reg) {
        setSwPhase(toPhase(reg.installing || reg.waiting || reg.active));
      } else {
        setSwPhase("unregistered");
      }

      const { status, showRefresh } = determineStatus(pwaState);
      setOfflineStatus(status);

      // Determine if enable button should be shown
      const offlineModeEnabled = localStorage.getItem(OFFLINE_MODE_KEY) === "true";
      const shouldShowEnableButton = 
        status === "ready" && 
        !hasFullCache && 
        !offlineModeEnabled &&
        isOnline;
      
      setShowEnableButton(shouldShowEnableButton);

      if (status === "ready") {
        setPercent(hasFullCache ? 100 : null);
      }
      
      // Auto-enable if preference is saved and not yet cached
      if (offlineModeEnabled && !hasFullCache && status === "ready" && isOnline) {
        console.log("[OfflineIndicator] Auto-enabling full offline mode from saved preference");
        setTimeout(() => handleEnableFullOffline(), 1000);
      }
      
    } catch (e) {
      console.error("Error updating PWA status:", e);
      setOfflineStatus("unavailable");
      setSwPhase("unknown");
      setShowEnableButton(false);
    } finally {
      refreshingRef.current = false;
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    updateStatus();

    if (!("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data?.type) return;

      if (data.type === "PRECACHE_START") {
        setOfflineStatus("loading");
        setPercent(0);
      }
      if (data.type === "PRECACHE_PROGRESS") {
        setOfflineStatus("loading");
        if (typeof data.percent === "number") {
          setPercent(Math.round(Math.max(0, Math.min(100, data.percent))));
        }
      }
      if (data.type === "PRECACHE_DONE") {
        setPercent(100);
        updateStatus();
      }
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    sw.addEventListener("controllerchange", updateStatus);
    sw.addEventListener("message", onMessage);

    sw.getRegistration().then((reg) => {
      if (!reg) return;
      [reg.installing, reg.waiting, reg.active].forEach((worker) => {
        worker?.addEventListener("statechange", updateStatus);
      });
    });

    sw.ready.then(updateStatus).catch(() => setOfflineStatus("unavailable"));

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      sw.removeEventListener("controllerchange", updateStatus);
      sw.removeEventListener("message", onMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  const title = useMemo(() => {
    const controller = typeof navigator !== 'undefined' && "serviceWorker" in navigator ? !!navigator.serviceWorker.controller : false;
    const p = percent == null ? "" : ` (${percent}%)`;
    const cacheMode = fullyCached ? "Full offline mode" : "Runtime caching";
    
    return [
      offlineStatus === "loading"
        ? `Preparing offline support${p}…`
        : offlineStatus === "ready"
        ? `Offline ready - ${cacheMode}.`
        : offlineStatus === "offline"
        ? "You are offline."
        : "Offline unavailable.",
      `SW: ${swPhase}${controller ? " (controlling)" : " (not controlling yet)"}`,
      cacheName ? `Cache: ${cacheName}` : `Cache: missing (looking for "${CACHE_NAME_FRAGMENT}")`,
    ].join("\n");
  }, [offlineStatus, swPhase, percent, cacheName, fullyCached]);

  const badgeClass =
    offlineStatus === "loading"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : offlineStatus === "ready"
      ? "bg-green-50 text-green-700 border-green-200"
      : offlineStatus === "offline"
      ? "bg-gray-100 text-gray-600 border-gray-200"
      : "bg-orange-50 text-orange-700 border-orange-200";

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show standalone button when full offline is available to enable
  if (offlineStatus === "ready" && showEnableButton) {
    return (
      <button
        onClick={handleEnableFullOffline}
        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-full text-[10px] font-semibold transition-colors flex items-center gap-1.5 border border-green-700"
        title="Download all site content for full offline access"
      >
        <ZapOff className="w-3 h-3" />
        <span>Enable Full Offline</span>
      </button>
    );
  }

  // Otherwise, show the status chip
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border transition-colors duration-300 ${badgeClass}`}
      title={title}
    >
      {offlineStatus === "loading" && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Caching{percent == null ? "…" : `… ${percent}%`}</span>
        </>
      )}

      {offlineStatus === "ready" && (
        <>
          <CheckCircle2 className="w-3 h-3" />
          <span>Offline Ready</span>
        </>
      )}

      {offlineStatus === "offline" && (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline Mode</span>
        </>
      )}

      {offlineStatus === "unavailable" && (
        <>
          <AlertTriangle className="w-3 h-3" />
          <span>Retry Offline Caching</span>
            <span
              title="Unregister Service Worker and reload to fix cache issues"
              className="inline-flex"
            >
              <RefreshCcw
                onClick={handleRefresh}
                className="w-3 h-3 ml-2 cursor-pointer hover:rotate-180 transition-transform duration-300"
              />
            </span>
        </>
      )}
    </div>
  );
}
