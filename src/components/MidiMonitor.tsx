import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface MidiEvent {
  note: number;
  velocity: number;
  channel: number;
  timestamp: number;
}

interface MidiMonitorProps {
  events: MidiEvent[];
}

const MidiMonitor: React.FC<MidiMonitorProps> = ({ events }) => {
  return (
    <Paper elevation={6} sx={{ position: 'fixed', bottom: 24, left: 24, zIndex: 4000, minWidth: 220, maxHeight: 320, overflowY: 'auto', bgcolor: 'rgba(0,0,0,0.85)', color: '#fff', p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#FFDC00' }}>MIDI Monitor</Typography>
      {events.length === 0 && <Typography variant="body2">No MIDI events yet</Typography>}
      {events.map((e, idx) => (
        <Box key={e.timestamp + '-' + idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, mb: 0.5 }}>
          <span>Note: {e.note}</span>
          <span>Vel: {e.velocity}</span>
          <span>Ch: {e.channel + 1}</span>
        </Box>
      ))}
    </Paper>
  );
};

export default MidiMonitor; 