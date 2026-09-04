import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, ChevronDown, Check } from 'lucide-react';
import { api } from '../../services/api';

const DURATION_PRESETS = [
  { label: '1 Menit', value: 60 },
  { label: '3 Menit', value: 180 },
  { label: '5 Menit', value: 300 },
  { label: '10 Menit', value: 600 },
  { label: '15 Menit', value: 900 },
  { label: '20 Menit', value: 1200 },
];

/**
 * Shared AudioContext singleton with proactive user-gesture unlock
 */
let sharedAudioCtx = null;

function getSharedAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  } catch {
    // AudioContext not supported
  }
  return sharedAudioCtx;
}

// Proactively unlock AudioContext on the first user interaction anywhere in the window
if (typeof window !== 'undefined') {
  const unlockAudioContext = () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('click', unlockAudioContext);
      window.removeEventListener('keydown', unlockAudioContext);
      window.removeEventListener('touchstart', unlockAudioContext);
    }
  };
  window.addEventListener('click', unlockAudioContext, { passive: true });
  window.addEventListener('keydown', unlockAudioContext, { passive: true });
  window.addEventListener('touchstart', unlockAudioContext, { passive: true });
}

/**
 * Helper to play a chime sound when timer finishes using Web Audio API
 */
function playChimeSound() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const playNotes = () => {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 melodic chime

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.3, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(playNotes).catch(playNotes);
    } else {
      playNotes();
    }
  } catch {
    // Web Audio blocked or not supported
  }
}

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function RetroTimerWidget({
  boardId,
  onShowToast,
  externalTimerState,
}) {
  const [timerState, setTimerState] = useState(() => {
    // 1. Initial sync from externalTimerState if available
    if (externalTimerState) {
      const duration = externalTimerState.duration || 300;
      let remaining = typeof externalTimerState.remaining === 'number' ? externalTimerState.remaining : duration;
      const isRunning = Boolean(externalTimerState.isRunning);
      let endsAt = externalTimerState.endsAt || null;

      if (isRunning && externalTimerState.startedAt) {
        const startTime = new Date(externalTimerState.startedAt).getTime();
        endsAt = externalTimerState.endsAt || (startTime + remaining * 1000);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        remaining = Math.max(0, remaining - elapsed);
      }

      return {
        duration,
        remaining,
        isRunning: isRunning && remaining > 0,
        startedAt: externalTimerState.startedAt || null,
        endsAt: isRunning && remaining > 0 ? endsAt : null,
        clockDiff: 0,
      };
    }

    // 2. Default clean initial state (5 minutes)
    return {
      duration: 300,
      remaining: 300,
      isRunning: false,
      startedAt: null,
      endsAt: null,
      clockDiff: 0,
    };
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasAlertedEnd, setHasAlertedEnd] = useState(false);
  const dropdownRef = useRef(null);

  // Helper to normalize and sync timer data from server / Pusher
  const syncTimerData = useCallback((data) => {
    if (!data) return;

    const serverNow = data.serverTime ? new Date(data.serverTime).getTime() : Date.now();
    const clientNow = Date.now();
    const clockDiff = serverNow - clientNow;

    let endsAt = data.endsAt || null;
    let currentRemaining = typeof data.remaining === 'number' ? data.remaining : (data.duration || 300);

    if (data.isRunning && data.startedAt) {
      const startTime = new Date(data.startedAt).getTime();
      const initialRemaining = typeof data.remaining === 'number' ? data.remaining : (data.duration || 300);
      endsAt = data.endsAt || (startTime + initialRemaining * 1000);

      const adjustedNow = clientNow + clockDiff;
      currentRemaining = Math.max(0, Math.ceil((endsAt - adjustedNow) / 1000));
    }

    const isRunning = Boolean(data.isRunning) && currentRemaining > 0;
    const duration = data.duration || 300;

    setTimerState((prev) => {
      // Jika timer sedang aktif berjalan secara lokal dan menerima broadcast/ack start yang sama (selisih < 2.5s)
      // Pertahankan endsAt lokal agar tidak terjadi lompatan/rubberbanding 1 detik ke belakang
      if (
        prev.isRunning &&
        isRunning &&
        prev.endsAt &&
        endsAt &&
        Math.abs((endsAt - clockDiff) - prev.endsAt) < 2500
      ) {
        return {
          ...prev,
          duration,
          startedAt: data.startedAt || prev.startedAt,
          clockDiff,
        };
      }

      return {
        duration,
        remaining: currentRemaining,
        isRunning,
        startedAt: data.startedAt || null,
        endsAt: isRunning ? endsAt : null,
        clockDiff,
      };
    });

    if (currentRemaining === 0 && data.isRunning) {
      setHasAlertedEnd(true);
    } else if (currentRemaining > 0) {
      setHasAlertedEnd(false);
    }
  }, []);

  // Sync with external Pusher / Board timer state
  useEffect(() => {
    if (externalTimerState) {
      syncTimerData(externalTimerState);
    }
  }, [externalTimerState, syncTimerData]);

  // Initial fetch from backend
  const fetchTimer = useCallback(async () => {
    if (!boardId) return;
    try {
      const data = await api.getBoardTimer(boardId);
      if (data) {
        syncTimerData(data);
      }
    } catch {
      // Fallback to existing state
    }
  }, [boardId, syncTimerData]);

  useEffect(() => {
    fetchTimer();
  }, [fetchTimer]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time lockstep countdown check
  useEffect(() => {
    if (!timerState.isRunning || !timerState.endsAt) return;

    const interval = setInterval(() => {
      const adjustedNow = Date.now() + (timerState.clockDiff || 0);
      const remaining = Math.max(0, Math.ceil((timerState.endsAt - adjustedNow) / 1000));

      if (remaining === 0) {
        if (!hasAlertedEnd) {
          playChimeSound();
          if (onShowToast) onShowToast('⏰ Waktu sesi retrospective telah habis!');
          setHasAlertedEnd(true);
        }
        setTimerState((prev) => {
          if (!prev.isRunning) return prev;
          return {
            ...prev,
            remaining: 0,
            isRunning: false,
            endsAt: null,
          };
        });
      } else {
        setTimerState((prev) => {
          // Guard: Cegah race condition penimpaan sisa waktu jika timer baru saja di-reset, dijeda, atau diganti preset
          if (!prev.isRunning || !prev.endsAt) return prev;
          return prev.remaining !== remaining ? { ...prev, remaining } : prev;
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.endsAt, timerState.clockDiff, hasAlertedEnd, onShowToast]);

  const handleTogglePlay = async () => {
    getSharedAudioContext(); // Pre-warm AudioContext on direct user click

    if (timerState.isRunning) {
      // Pause action (Optimistic Update)
      const currentRemaining = timerState.remaining;
      setTimerState((prev) => ({
        ...prev,
        remaining: currentRemaining,
        isRunning: false,
        endsAt: null,
      }));

      try {
        const res = await api.pauseBoardTimer(boardId);
        syncTimerData(res);
      } catch (err) {
        setTimerState((prev) => ({ ...prev, isRunning: true }));
        if (onShowToast) onShowToast(err.message || 'Gagal menjeda timer');
      }
    } else {
      // Start / Resume action (Optimistic Update)
      setHasAlertedEnd(false);
      const startRemaining = timerState.remaining <= 0 ? timerState.duration : timerState.remaining;
      const optimisticEndsAt = Date.now() + startRemaining * 1000;

      setTimerState((prev) => ({
        ...prev,
        remaining: startRemaining,
        isRunning: true,
        startedAt: new Date().toISOString(),
        endsAt: optimisticEndsAt,
      }));

      try {
        const res = await api.startBoardTimer(
          boardId,
          startRemaining === timerState.duration ? timerState.duration : undefined
        );
        syncTimerData(res);
      } catch (err) {
        setTimerState((prev) => ({
          ...prev,
          isRunning: false,
          endsAt: null,
        }));
        if (onShowToast) onShowToast(err.message || 'Gagal memulai timer');
      }
    }
  };

  const handleReset = async () => {
    getSharedAudioContext();
    setHasAlertedEnd(false);

    // Optimistic Reset
    setTimerState((prev) => ({
      ...prev,
      remaining: prev.duration,
      isRunning: false,
      startedAt: null,
      endsAt: null,
    }));

    try {
      const res = await api.resetBoardTimer(boardId);
      syncTimerData(res);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal mereset timer');
    }
  };

  const handleSelectPreset = async (seconds) => {
    getSharedAudioContext();
    setIsDropdownOpen(false);
    setHasAlertedEnd(false);

    // Optimistic Duration Change
    setTimerState((prev) => ({
      ...prev,
      duration: seconds,
      remaining: seconds,
      isRunning: false,
      startedAt: null,
      endsAt: null,
    }));

    try {
      const res = await api.updateBoardTimerDuration(boardId, seconds);
      syncTimerData(res);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal mengubah durasi timer');
    }
  };

  const isTimeUp = timerState.remaining === 0;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: isTimeUp ? '#fef2f2' : (timerState.isRunning ? '#f5f3ff' : '#f8fafc'),
        padding: '4px 8px',
        borderRadius: '10px',
        border: isTimeUp
          ? '1.5px solid #f87171'
          : (timerState.isRunning ? '1.5px solid #818cf8' : '1px solid #cbd5e1'),
        boxShadow: timerState.isRunning ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Timer Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 6px',
        }}
      >
        <Clock
          size={15}
          color={isTimeUp ? '#ef4444' : (timerState.isRunning ? '#5956e9' : '#64748b')}
        />
        <span
          style={{
            fontFamily: 'monospace, sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: isTimeUp ? '#ef4444' : (timerState.isRunning ? '#4f46e5' : '#0f172a'),
          }}
        >
          {formatTime(timerState.remaining)}
        </span>
      </div>

      {/* Play / Pause Toggle Button */}
      <button
        type="button"
        onClick={handleTogglePlay}
        title={timerState.isRunning ? 'Jeda Timer' : 'Mulai Timer'}
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: timerState.isRunning ? '#e0e7ff' : '#5956e9',
          color: timerState.isRunning ? '#4f46e5' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {timerState.isRunning ? <Pause size={13} fill="#4f46e5" /> : <Play size={13} fill="#ffffff" />}
      </button>

      {/* Reset Button */}
      <button
        type="button"
        onClick={handleReset}
        title="Reset Timer"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <RotateCcw size={12} />
      </button>

      {/* Duration Preset Selector */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title="Pilih durasi sesi retro"
          style={{
            height: '26px',
            padding: '0 6px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#475569',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
          }}
        >
          <span>{Math.floor(timerState.duration / 60)}m</span>
          <ChevronDown size={11} color="#94a3b8" />
        </button>

        {isDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '6px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              padding: '4px',
              minWidth: '110px',
              zIndex: 150,
            }}
          >
            <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Durasi Sesi
            </div>
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleSelectPreset(preset.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: timerState.duration === preset.value ? '#f1f5f9' : 'transparent',
                  color: timerState.duration === preset.value ? '#5956e9' : '#334155',
                  fontSize: '12px',
                  fontWeight: timerState.duration === preset.value ? 700 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{preset.label}</span>
                {timerState.duration === preset.value && <Check size={12} color="#5956e9" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
