import React from 'react';

type ModeSelectorProps = {
  mode: 'default' | 'europapa';
  setMode: (mode: 'default' | 'europapa') => void;
};

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode }) => {
  return (
    <div className="mode-selector">
      <button
        className={mode === 'default' ? 'active' : ''}
        onClick={() => setMode('default')}
      >
        Default Mode
      </button>
      <button
        className={mode === 'europapa' ? 'active' : ''}
        onClick={() => setMode('europapa')}
      >
        Europapa Mode
      </button>
    </div>
  );
};

export default ModeSelector; 