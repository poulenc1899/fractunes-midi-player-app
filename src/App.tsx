import { useState, useRef, useEffect } from 'react';
import './App.css';
import ModeSelector from './components/ModeSelector';
import SampleSlot from './components/SampleSlot';
import type { MidiSetting } from './components/SampleSlot';
import { AppBar, Toolbar, Typography, Box, Fab, Tooltip, IconButton } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsDialog from './components/SettingsDialog';
import MidiMonitor from './components/MidiMonitor';
import confetti from 'canvas-confetti';
import ConfettiContext from './context/ConfettiContext';
import type { ConfettiTrigger } from './context/ConfettiContext';
import { Analytics } from '@vercel/analytics/react';

const SLOT_LAYOUT = [
  [{ name: 'Kick', color: '#FF4136' }],
  [{ name: 'Clap', color: '#2ECC40' }],
  [
    { name: 'Whole', color: '#0074D9' },
    { name: 'Half', color: '#FFDC00' },
    { name: 'Quarter', color: '#B10DC9' },
  ],
];

type SlotRegistry = {
  [slotName: string]: {
    midiSetting: MidiSetting;
    play: () => void;
  };
};

function App() {
  const [mode, setMode] = useState<'default' | 'europapa'>('default');
  const [slotRegistry, setSlotRegistry] = useState<SlotRegistry>({});
  const [fullscreen, setFullscreen] = useState(false);
  const registryRef = useRef(slotRegistry);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [anySlotSettingsOpen, setAnySlotSettingsOpen] = useState(false);
  const [midiInputs, setMidiInputs] = useState<any[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string | null>(null);
  const [midiEvents, setMidiEvents] = useState<any[]>([]); // {note, velocity, channel, timestamp}
  const [partyMode, setPartyMode] = useState(false);

  // Keep registryRef in sync
  useEffect(() => {
    registryRef.current = slotRegistry;
  }, [slotRegistry]);

  // Register slots for MIDI
  const handleRegister = (slotName: string, midiSetting: MidiSetting, play: () => void) => {
    setSlotRegistry((prev) => ({
      ...prev,
      [slotName]: { midiSetting, play },
    }));
  };

  // MIDI input setup
  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      console.error('Web MIDI API not supported in this browser.');
      return;
    }
    let listeners: Array<() => void> = [];
    let inputList: any[] = [];
    console.log('Requesting MIDI access...');
    navigator.requestMIDIAccess().then(
      (access) => {
        console.log('MIDI access granted!');
        inputList = Array.from(access.inputs.values());
        setMidiInputs(inputList);
        console.log('Detected MIDI inputs:', inputList);
        let inputToUse = inputList[0];
        if (selectedInputId) {
          inputToUse = inputList.find((i) => i.id === selectedInputId) || inputList[0];
        }
        if (inputToUse) {
          inputToUse.addEventListener('midimessage', onMIDIMessage);
          listeners.push(() => inputToUse.removeEventListener('midimessage', onMIDIMessage));
        }
      },
      (err) => {
        console.error('MIDI access denied or not available:', err);
      }
    );
    function onMIDIMessage(event: any) {
      const [status, note, velocity] = event.data;
      console.log('MIDI message received:', { status, note, velocity });
      if ((status & 0xf0) === 0x90 && velocity > 0) {
        const channel = status & 0x0f;
        setMidiEvents((prev) => [
          { note, velocity, channel, timestamp: Date.now() },
          ...prev.slice(0, 19)
        ]);
        Object.entries(registryRef.current).forEach(([_, { midiSetting, play }]) => {
          const matchNote = midiSetting.note === 'all' || midiSetting.note === note;
          const matchVel = midiSetting.velocity === 'all' || midiSetting.velocity === velocity;
          const matchChan = midiSetting.channel === 'all' || midiSetting.channel === channel;
          if (matchNote && matchVel && matchChan) {
            play();
          }
        });
      }
    }
    return () => {
      listeners.forEach((off) => off());
    };
  }, [selectedInputId]);

  // Fullscreen API logic
  const handleFullscreenToggle = () => {
    if (!fullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if ((elem as any).webkitRequestFullscreen) (elem as any).webkitRequestFullscreen();
      else if ((elem as any).msRequestFullscreen) (elem as any).msRequestFullscreen();
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
      setFullscreen(false);
    }
  };

  // Listen for fullscreen change
  useEffect(() => {
    const onChange = () => {
      setFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    document.addEventListener('msfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
      document.removeEventListener('msfullscreenchange', onChange);
    };
  }, []);

  // Helper to trigger confetti
  const triggerConfetti: ConfettiTrigger = (color: string, origin?: { x: number, y: number }) => {
    if (!partyMode) return;
    confetti({
      particleCount: 250,
      spread: 300,
      origin: origin || { y: 0.6 },
      colors: [color],
      zIndex: 1,
      disableForReducedMotion: true,
    });
  };

  return (
    <ConfettiContext.Provider value={triggerConfetti}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f0f4f8', position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: 0 }}>
        {/* Top bar only if not fullscreen */}
        {!fullscreen && (
          <AppBar position="static" color="default" elevation={2} sx={{ mb: 0, width: '100vw', left: 0, top: 0, boxShadow: 2 }}>
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  fontSize: 24,
                  letterSpacing: 2,
                  color: '#0074D9',
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  textTransform: 'uppercase',
                }}
              >
                FracTunes
              </Typography>
              <Box sx={{ zIndex: 2600 }}>
                <IconButton color="primary" onClick={() => setSettingsOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>
        )}
        {/* ModeSelector always visible, fixed at top center */}
        <Box sx={{ position: 'fixed', top: 12, left: 0, width: '100vw', display: 'flex', justifyContent: 'center', zIndex: 2500 }}>
          <ModeSelector mode={mode} setMode={setMode} />
        </Box>
        {/* Responsive slots layout */}
        <Box sx={{ width: '100vw', height: fullscreen ? '100vh' : 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: fullscreen ? 0 : 2, pb: 0, px: 0, boxSizing: 'border-box' }}>
          <Box className="slots-container" sx={{
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'wrap',
            gap: 4,
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
          }}>
            {SLOT_LAYOUT.flat().map((slot) => (
              <SampleSlot
                key={slot.name}
                name={slot.name}
                color={slot.color}
                mode={mode}
                onRegister={handleRegister}
                fullscreen={fullscreen}
                onSettingsOpen={() => setAnySlotSettingsOpen(true)}
                onSettingsClose={() => setAnySlotSettingsOpen(false)}
              />
            ))}
          </Box>
        </Box>
        {/* Fullscreen toggle button */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 3000, display: fullscreen ? 'none' : 'flex' }}>
          <Tooltip title="Full Screen">
            <Fab color="primary" size="large" onClick={handleFullscreenToggle}>
              <FullscreenIcon fontSize="large" />
            </Fab>
          </Tooltip>
        </Box>
        {/* Exit fullscreen button */}
        {fullscreen && (
          <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 3000 }}>
            <Tooltip title="Exit Full Screen">
              <Fab color="primary" size="large" onClick={handleFullscreenToggle}>
                <FullscreenExitIcon fontSize="large" />
              </Fab>
            </Tooltip>
          </Box>
        )}
        {/* SettingsDialog and MidiMonitor only when settingsOpen */}
        <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} midiInputs={midiInputs} selectedInputId={selectedInputId} setSelectedInputId={setSelectedInputId} partyMode={partyMode} setPartyMode={setPartyMode} />
        {(settingsOpen || anySlotSettingsOpen) && <MidiMonitor events={midiEvents} />}
        <Analytics />
      </Box>
    </ConfettiContext.Provider>
  );
}

export default App;
