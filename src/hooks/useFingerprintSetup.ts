import { useCallback, useEffect, useRef, useState } from "react";
import { checkFingerprintStatus } from "../services/api";

type Status = "idle" | "waiting" | "success" | "error" | "timeout";

interface Options {
  intervalMs?: number;   // default 5000
  maxAttempts?: number;  // default 24 (≈2 minutes)
}

export function useFingerprintSetup({ intervalMs = 5000, maxAttempts = 24 }: Options = {}) {
  const [status, setStatus] = useState<Status>("idle");
  const [fingerprintNum, setFingerprintNum] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<number | null>(null);
  const activeUserRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    activeUserRef.current = null;
    setStatus((s) => (s === "waiting" ? "idle" : s));
  }, []);

  const pollOnce = useCallback(async () => {
    const uid = activeUserRef.current;
    if (!runningRef.current || uid == null) return;

    try {
      const res = await checkFingerprintStatus(uid); // must return { fingerprintNum?: number }
      if (res?.fingerprintNum) {
        setFingerprintNum(res.fingerprintNum);
        setStatus("success");
        stop();
        return;
      }
      // not ready yet
      setAttempts((n) => n + 1);
      if (attempts + 1 >= maxAttempts) {
        setStatus("timeout");
        stop();
        return;
      }
      timerRef.current = window.setTimeout(pollOnce, intervalMs);
    } catch (e: any) {
      setError(e?.message || "Fingerprint status check failed");
      setStatus("error");
      stop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts, intervalMs, maxAttempts, stop]);

  const start = useCallback((userId: number) => {
    // reset state
    setStatus("waiting");
    setFingerprintNum(undefined);
    setError(undefined);
    setAttempts(0);

    runningRef.current = true;
    activeUserRef.current = userId;

    // kick off first poll immediately
    pollOnce();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollOnce]);

  // Cleanup on unmount
  useEffect(() => stop, [stop]);

  return {
    status,            // "idle" | "waiting" | "success" | "error" | "timeout"
    fingerprintNum,    // number | undefined
    error,             // string | undefined
    attempts,          // number
    isPolling: status === "waiting",
    start,             // (userId: number) => void
    stop,              // () => void
  };
}
