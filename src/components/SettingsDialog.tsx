import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  midiInputs: any[];
  selectedInputId: string | null;
  setSelectedInputId: (id: string) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose, midiInputs, selectedInputId, setSelectedInputId }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>MIDI Settings</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>MIDI Input</InputLabel>
          <Select
            value={selectedInputId || ''}
            label="MIDI Input"
            onChange={e => setSelectedInputId(e.target.value as string)}
          >
            {midiInputs.length === 0 && <MenuItem value="">No MIDI Inputs Found</MenuItem>}
            {midiInputs.map((input) => (
              <MenuItem key={input.id} value={input.id}>{input.name || input.manufacturer || input.id}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog; 