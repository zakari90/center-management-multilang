"use client";

import { useEffect, useState } from "react";

interface CacheDebugInfo {
  timestamp: string;
  isOnline: boolean;
  cacheStatus: string;
  renderCount: number;
}

let renderCount = 0;

export default function CacheDebugBanner() {
  const [info, setInfo] = useState<CacheDebugInfo | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    renderCount++;
    
    const updateInfo = () => {
      setInfo({
        timestamp: new Date().toISOString(),
        isOnline: navigator.onLine,
        cacheStatus: navigator.onLine ? "ONLINE" : "OFFLINE (cached)",
        renderCount,
      });
    };

    updateInfo();

    // Listen for online/offline changes
    window.addEventListener("online", updateInfo);
    window.addEventListener("offline", updateInfo);

    return () => {
      window.removeEventListener("online", updateInfo);
      window.removeEventListener("offline", updateInfo);
    };
  }, []);

  if (!info || !visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 70,
        right: 10,
        zIndex: 9999,
        background: info.isOnline ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        maxWidth: "300px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>🔍 Cache Debug</strong>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ marginTop: "4px" }}>
        <div>Status: <strong>{info.cacheStatus}</strong></div>
        <div>Render: #{info.renderCount}</div>
        <div>Time: {info.timestamp.split("T")[1].slice(0, 8)}</div>
      </div>
    </div>
  );
}
