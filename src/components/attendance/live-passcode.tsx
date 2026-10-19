"use client";

import { useState, useEffect } from "react";
import { getLiveSessionCodeAction } from "@/lib/attendance/actions";
import { KeyRound, RefreshCw } from "lucide-react";

interface LivePasscodeProps {
  sessionId: string;
}

export function LivePasscode({ sessionId }: LivePasscodeProps) {
  const [code, setCode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchCode() {
      try {
        const res = await getLiveSessionCodeAction(sessionId);
        if (!mounted) return;
        if (res.success && res.code) {
          setCode(res.code);
          setSecondsLeft(res.secondsRemaining || 30);
          setError(null);
        } else {
          setError(res.error || "Failed to load dynamic passcode");
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Error fetching passcode";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCode();
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchCode();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [sessionId]);

  return (
    <div className="bg-[#111318] border border-[#00E5FF]/30 rounded-xl p-6 shadow-xl text-center">
      <div className="flex items-center justify-center gap-2 text-[#00E5FF] font-mono text-xs mb-3">
        <KeyRound className="w-4 h-4" />
        <span>LIVE DYNAMIC PASSCODE (30S ROTATION)</span>
      </div>

      {loading ? (
        <div className="py-6 flex justify-center">
          <RefreshCw className="w-8 h-8 text-[#00E5FF] animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 py-4">{error}</p>
      ) : (
        <>
          <div className="text-4xl font-extrabold font-mono tracking-[0.4em] text-white py-4 bg-[#0C0E13] rounded-lg border border-zinc-800 my-2 select-all">
            {code}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Refreshes in {secondsLeft}s</span>
            <div className="w-32 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#00E5FF] h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(secondsLeft / 30) * 100}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
