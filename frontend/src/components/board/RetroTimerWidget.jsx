import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, ChevronDown, Bell, Check } from 'lucide-react';
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
 * Helper to play a chime sound when timer finishes using Web Audio API
 */
function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    // Chime notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];

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
  } catch {
    // AudioContext blocked or not supported
  }
}

export default function RetroTimerWidget({
  boardId,
  onShowToast,
  externalTimerState,
}) {
  const [timerState, setTimerState] = useState({
    duration: 300,
    remaining: 300,
    isRunning: false,
    startedAt: null,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasAlertedEnd, setHasAlertedEnd] = useState(false);
  const dropdownRef = useRef(null);

  // Sync with external Pusher timer state
  useEffect(() => {
    if (externalTimerState) {
      setTimerState((prev) => ({
        ...prev,
        ...externalTimerState,
      }));
      setHasAlertedEnd(false);
    }
  }, [externalTimerState]);

  // Initial fetch from backend
  const fetchTimer = useCallback(async () => {
    if (!boardId) return;
    try {
      const data = await api.getBoardTimer(boardId);
      if (data) {
        setTimerState(data);
      }
    } catch {
      // Fallback to default
    }
  }, [boardId]);

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

  // Real-time ticking interval
  useEffect(() => {
    if (!timerState.isRunning) return;

    const interval = setInterval(() => {
      setTimerState((prev) => {
        if (!prev.isRunning) return prev;

        const now = Date.now();
        let currentRemaining = prev.remaining;

        if (prev.startedAt) {
          const elapsed = Math.floor((now - new Date(prev.startedAt).getTime()) / 1000);
          currentRemaining = Math.max(0, prev.remaining - elapsed);
        } else {
          currentRemaining = Math.max(0, prev.remaining - 1);
        }

        if (currentRemaining === 0) {
          if (!hasAlertedEnd) {
            playChimeSound();
            if (onShowToast) onShowToast('⏰ Waktu sesi retrospective telah habis!');
            setHasAlertedEnd(true);
          }
          return {
            ...prev,
            remaining: 0,
            isRunning: false,
          };
        }

        return {
          ...prev,
          remaining: currentRemaining,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isRunning, hasAlertedEnd, onShowToast]);

  const handleTogglePlay = async () => {
    if (timerState.isRunning) {
      // Pause
      setTimerState((prev) => ({ ...prev, isRunning: false }));
      try {
        const res = await api.pauseBoardTimer(boardId);
        setTimerState(res);
      } catch (err) {
        if (onShowToast) onShowToast(err.message || 'Gagal menjeda timer');
      }
    } else {
      // Start / Resume
      setHasAlertedEnd(false);
      setTimerState((prev) => ({
        ...prev,
        isRunning: true,
        startedAt: new Date().toISOString(),
      }));
      try {
        const res = await api.startBoardTimer(boardId);
        setTimerState(res);
      } catch (err) {
        if (onShowToast) onShowToast(err.message || 'Gagal memulai timer');
      }
    }
  };

  const handleReset = async () => {
    setHasAlertedEnd(false);
    setTimerState((prev) => ({
      ...prev,
      remaining: prev.duration,
      isRunning: false,
      startedAt: null,
    }));
    try {
      const res = await api.resetBoardTimer(boardId);
      setTimerState(res);
      if (onShowToast) onShowToast('Timer direset');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal mereset timer');
    }
  };

  const handleSelectPreset = async (seconds) => {
    setIsDropdownOpen(false);
    setHasAlertedEnd(false);
    setTimerState((prev) => ({
      ...prev,
      duration: seconds,
      remaining: seconds,
      isRunning: false,
      startedAt: null,
    }));
    try {
      const res = await api.updateBoardTimerDuration(boardId, seconds);
      setTimerState(res);
      if (onShowToast) onShowToast(`Durasi timer diatur ke ${seconds / 60} menit`);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Gagal mengubah durasi timer');
    }
  };

  // Format seconds into MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
          <span>{timerState.duration / 60}m</span>
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
              zIndex: 100,
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
