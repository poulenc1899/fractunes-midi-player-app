// MidiSetting type for external use
export type MidiSetting = {
  note: number | 'all';
  velocity: number | 'all';
  channel: number | 'all';
};

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Typography, IconButton, Drawer, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import clsx from 'clsx';
import { defaultMidiSettings } from '../config/defaultMidiSettings';

interface SampleSlotProps {
  name: string;
  color: string;
  mode: 'default' | 'europapa';
  onRegister?: (slotName: string, midiSetting: MidiSetting, play: () => void) => void;
  fullscreen?: boolean;
  onSettingsOpen?: () => void;
  onSettingsClose?: () => void;
}

const midiNumbers = Array.from({ length: 128 }, (_, i) => i);
const velocityNumbers = Array.from({ length: 128 }, (_, i) => i);
const channelNumbers = Array.from({ length: 16 }, (_, i) => i);

const getStorageKey = (slot: string, mode: string) => `fractunes-midi-setting-${mode}-${slot}`;

const getSampleUrl = (mode: string, name: string) => {
  // Remove spaces and lowercase for filenames
  const file = `${name.replace(/\s/g, '').toLowerCase()}.wav`;
  return `/sound/fractunes-${mode}-mode/${file.charAt(0).toUpperCase() + file.slice(1)}`;
};

const WAVEFORM_WIDTH = 140;
const WAVEFORM_HEIGHT = 40;

const SampleSlot: React.FC<SampleSlotProps> = ({ name, color, mode, onRegister, fullscreen, onSettingsOpen, onSettingsClose }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [midiSetting, setMidiSetting] = useState<MidiSetting>(() => {
    const key = getStorageKey(name, mode);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultMidiSettings[mode][name];
  });
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0); // 0 to 1
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const playDurationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    const key = getStorageKey(name, mode);
    localStorage.setItem(key, JSON.stringify(midiSetting));
  }, [midiSetting, name, mode]);

  // Load sample on mount or mode change
  useEffect(() => {
    let isMounted = true;
    const url = getSampleUrl(mode, name);
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    fetch(url)
      .then(res => {
        if (!res.ok) {
          console.error(`Failed to fetch sample: ${url} (status: ${res.status})`);
          throw new Error(`Failed to fetch sample: ${url}`);
        }
        return res.arrayBuffer();
      })
      .then(arrayBuffer => audioCtxRef.current!.decodeAudioData(arrayBuffer))
      .then(buffer => {
        if (isMounted) setAudioBuffer(buffer);
      })
      .catch((err) => {
        setAudioBuffer(null);
        console.error(`Error loading sample for slot '${name}' at ${url}:`, err);
      });
    return () => { isMounted = false; };
  }, [mode, name]);

  // Expose playSample and midiSetting to parent for MIDI
  useEffect(() => {
    if (onRegister) {
      onRegister(name, midiSetting, playSample);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [midiSetting, audioBuffer]);

  // Draw waveform
  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, WAVEFORM_WIDTH, WAVEFORM_HEIGHT);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / WAVEFORM_WIDTH);
    for (let i = 0; i < WAVEFORM_WIDTH; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y1 = ((1 - min) * 0.5) * WAVEFORM_HEIGHT;
      const y2 = ((1 - max) * 0.5) * WAVEFORM_HEIGHT;
      ctx.moveTo(i, y1);
      ctx.lineTo(i, y2);
    }
    ctx.stroke();
  }, [audioBuffer]);

  // Playhead animation
  useEffect(() => {
    if (!isPlaying || !audioBuffer) return;
    playStartTimeRef.current = audioCtxRef.current!.currentTime;
    playDurationRef.current = audioBuffer.duration;
    setPlayhead(0);
    function animate() {
      if (!playStartTimeRef.current || !audioBuffer) return;
      const elapsed = audioCtxRef.current!.currentTime - playStartTimeRef.current;
      const progress = Math.min(elapsed / playDurationRef.current, 1);
      setPlayhead(progress);
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, audioBuffer]);

  // Draw playhead
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    if (!audioBuffer) return;
    // Redraw waveform
    ctx.clearRect(0, 0, WAVEFORM_WIDTH, WAVEFORM_HEIGHT);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / WAVEFORM_WIDTH);
    for (let i = 0; i < WAVEFORM_WIDTH; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y1 = ((1 - min) * 0.5) * WAVEFORM_HEIGHT;
      const y2 = ((1 - max) * 0.5) * WAVEFORM_HEIGHT;
      ctx.moveTo(i, y1);
      ctx.lineTo(i, y2);
    }
    ctx.stroke();
    // Draw playhead
    if (isPlaying) {
      ctx.save();
      ctx.strokeStyle = '#FF4136';
      ctx.lineWidth = 3;
      const x = playhead * WAVEFORM_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WAVEFORM_HEIGHT);
      ctx.stroke();
      ctx.restore();
    }
  }, [playhead, isPlaying, audioBuffer]);

  // Play sample
  const playSample = () => {
    if (!audioBuffer || !audioCtxRef.current) return;
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtxRef.current.destination);
    source.start();
    setIsPlaying(true);
    source.onended = () => {
      setIsPlaying(false);
      setPlayhead(0);
    };
  };

  // Fix: use 'any' for event type to avoid MUI SelectChangeEvent import error
  const handleChange = (field: keyof MidiSetting) => (event: any) => {
    const value = event.target.value === 'all' ? 'all' : Number(event.target.value);
    setMidiSetting((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card
      className={clsx({ 'sample-slot-playing': isPlaying })}
      sx={{
        width: 180,
        height: 120,
        borderRadius: 4,
        background: color,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 6,
        touchAction: 'manipulation',
        transition: 'transform 0.15s',
        cursor: audioBuffer ? 'pointer' : 'not-allowed',
        ...(isPlaying && { transform: 'rotate(-2deg) scale(1.04)' }),
      }}
      onClick={audioBuffer ? playSample : undefined}
    >
      {!fullscreen && (
        <IconButton
          aria-label="settings"
          onClick={e => { e.stopPropagation(); setSettingsOpen(true); onSettingsOpen && onSettingsOpen(); }}
          sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', background: 'rgba(0,0,0,0.18)' }}
          size="large"
        >
          <SettingsIcon fontSize="large" />
        </IconButton>
      )}
      <CardContent sx={{ p: 1, width: '100%', textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', fontSize: 24, textShadow: '1px 2px 8px rgba(0,0,0,0.18)' }}>
          {name}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1 }}>
          <canvas
            ref={canvasRef}
            width={WAVEFORM_WIDTH}
            height={WAVEFORM_HEIGHT}
            style={{ width: WAVEFORM_WIDTH, height: WAVEFORM_HEIGHT, background: 'rgba(255,255,255,0.08)', borderRadius: 8, touchAction: 'none' }}
          />
        </Box>
        {!audioBuffer && (
          <Typography variant="body2" sx={{ color: '#fff', opacity: 0.7, mt: 1 }}>
            Sample not loaded
          </Typography>
        )}
      </CardContent>
      {!fullscreen && (
        <Drawer
          anchor="right"
          open={settingsOpen}
          onClose={() => { setSettingsOpen(false); onSettingsClose && onSettingsClose(); }}
          PaperProps={{ sx: { width: 300, p: 2 } }}
        >
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>MIDI Settings</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Note</InputLabel>
              <Select
                value={String(midiSetting.note)}
                label="Note"
                onChange={handleChange('note')}
              >
                <MenuItem value={'all'}>All</MenuItem>
                {midiNumbers.map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Velocity</InputLabel>
              <Select
                value={String(midiSetting.velocity)}
                label="Velocity"
                onChange={handleChange('velocity')}
              >
                <MenuItem value={'all'}>All</MenuItem>
                {velocityNumbers.map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Channel</InputLabel>
              <Select
                value={String(midiSetting.channel)}
                label="Channel"
                onChange={handleChange('channel')}
              >
                <MenuItem value={'all'}>All</MenuItem>
                {channelNumbers.map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Drawer>
      )}
    </Card>
  );
};

export default SampleSlot; 