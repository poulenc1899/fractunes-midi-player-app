import React from 'react';
export type ConfettiTrigger = (color: string, origin?: { x: number, y: number }) => void;
const ConfettiContext = React.createContext<ConfettiTrigger>(() => {});
export default ConfettiContext; 