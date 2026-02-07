import React, { useEffect, useMemo, useRef, useState } from "react";
import { WifiOff, Loader2, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";

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
 * Decision tree for determining offline indicator status:
 * 
 * 1. If SW/Cache API not supported → unavailable (unsupported)
 * 2. If SW not registered → unavailable (unregistered)
 * 3. If offline (no network) AND cache exists → offline (cached content available)
 * 4. If offline (no network) AND no cache → unavailable (nothing cached)
 * 5. If SW activated AND cache exists → ready (fully functional)
 * 6. If SW activated AND no cache → unavailable (corrupted/cleared)
 * 7. If SW not activated yet → loading (installing/activating)
 */
function determineStatus(state: PWAState): {
  status: OfflineStatus;
  showRefresh: boolean;
} {
  // Rule 1: No SW support
  if (!state.hasSWSupport) {
    return { status: "unavailable", showRefresh: false };
  }

  // Rule 2: SW not registered
  if (!state.swRegistered) {
    return { status: "unavailable", showRefresh: false };
  }

  // Rule 3 & 4: Offline scenarios
  if (!state.isOnline) {
    return {
      status: state.cacheExists ? "offline" : "unavailable",
      showRefresh: false
    };
  }

  // Rule 5 & 6: SW activated scenarios
  if (state.swActivated) {
    return {
      status: state.cacheExists ? "ready" : "unavailable",
      showRefresh: !state.cacheExists // Show refresh button if cache missing
    };
  }

  // Rule 7: SW still loading
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
  const [showRefreshButton, setShowRefreshButton] = useState(false);

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

  const updateStatus = async () => {
    // Prevent concurrent executions
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      // Gather PWA state
      const hasSWSupport = "serviceWorker" in navigator && "caches" in window;
      
      if (!hasSWSupport) {
        setOfflineStatus("unavailable");
        setSwPhase("unsupported");
        setShowRefreshButton(false);
        return;
      }

      const sw = navigator.serviceWorker;
      const reg = await sw.getRegistration();
      const isOnline = await checkNetworkConnectivity();
      const { exists: cacheExists, name } = await checkCacheStorage();

      setCacheName(name);

      const pwaState: PWAState = {
        isOnline,
        hasSWSupport,
        swRegistered: !!reg,
        swActivated: reg?.active?.state === "activated",
        cacheExists,
        cacheName: name
      };

      // Update SW phase
      if (reg) {
        setSwPhase(toPhase(reg.installing || reg.waiting || reg.active));
      } else {
        setSwPhase("unregistered");
      }

      // Apply state machine
      const { status, showRefresh } = determineStatus(pwaState);
      setOfflineStatus(status);
      setShowRefreshButton(showRefresh);

      // Set percent to 100 if ready
      if (status === "ready") {
        setPercent(100);
      }
    } catch (e) {
      console.error("Error updating PWA status:", e);
      setOfflineStatus("unavailable");
      setSwPhase("unknown");
      setShowRefreshButton(false);
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

    // Handle precache progress messages from SW
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

    // Register event listeners
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    sw.addEventListener("controllerchange", updateStatus);
    sw.addEventListener("message", onMessage);

    // Listen for SW state changes
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
    const controller = "serviceWorker" in navigator ? !!navigator.serviceWorker.controller : false;
    const p = percent == null ? "" : ` (${percent}%)`;
    return [
      offlineStatus === "loading"
        ? `Preparing offline support${p}…`
        : offlineStatus === "ready"
        ? "Offline ready."
        : offlineStatus === "offline"
        ? "You are offline."
        : "Offline unavailable.",
      `SW: ${swPhase}${controller ? " (controlling)" : " (not controlling yet)"}`,
      cacheName ? `Cache: ${cacheName}` : `Cache: missing (looking for "${CACHE_NAME_FRAGMENT}")`,
    ].join("\n");
  }, [offlineStatus, swPhase, percent, cacheName]);

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
          <span>{showRefreshButton ? "Retry Offline Caching" : "Offline Caching Unavailable"}</span>
          {showRefreshButton && (
            <span
              title="Unregister Service Worker and reload to fix cache issues"
              className="inline-flex"
            >
              <RefreshCcw
                onClick={handleRefresh}
                className="w-3 h-3 ml-2 cursor-pointer hover:rotate-180 transition-transform duration-300"
              />
            </span>
          )}
        </>
      )}
    </div>
  );
}
