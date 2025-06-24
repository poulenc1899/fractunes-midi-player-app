import type { MidiSetting } from '../components/SampleSlot';

type MidiSettings = {
  [mode: string]: {
    [slot: string]: MidiSetting;
  };
};

export const defaultMidiSettings: MidiSettings = {
  default: {
    Clap: { note: "all", velocity: "all", channel: 1 },
    Half: { note: "all", velocity: 126, channel: 2 },
    Kick: { note: "all", velocity: "all", channel: 0 },
    Quarter: { note: "all", velocity: 125, channel: 2 },
    Whole: { note: "all", velocity: 127, channel: 2 }
  },
  europapa: {
    Clap: { note: "all", velocity: "all", channel: 1 },
    Half: { note: "all", velocity: 126, channel: 2 },
    Kick: { note: "all", velocity: "all", channel: 0 },
    Quarter: { note: "all", velocity: 125, channel: 2 },
    Whole: { note: "all", velocity: 127, channel: 2 }
  }
}; 