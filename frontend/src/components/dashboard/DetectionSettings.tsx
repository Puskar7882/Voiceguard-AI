import React, { useState } from 'react';
import { Sliders, ShieldCheck, BellRing, EyeOff } from 'lucide-react';

interface DetectionSettingsProps {
  highSensitivity: boolean;
  onToggleSensitivity: () => void;
  pushAlerts: boolean;
  onToggleAlerts: () => void;
  riskThreshold: number;
  onChangeThreshold: (val: number) => void;
}

export const DetectionSettings: React.FC<DetectionSettingsProps> = ({
  highSensitivity,
  onToggleSensitivity,
  pushAlerts,
  onToggleAlerts,
  riskThreshold,
  onChangeThreshold
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 p-stack-lg flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-2">
        <Sliders className="w-4 h-4 text-primary" />
        <h4 className="font-mono text-xs font-bold text-on-surface uppercase tracking-wider">
          Detection Parameters
        </h4>
      </div>

      {/* Toggle 1: High Sensitivity */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-body-md text-sm font-semibold text-on-surface">High Sensitivity Mode</span>
          <span className="font-body-sm text-xs text-on-surface-variant">Flag borderline neural vocoder artifacts</span>
        </div>
        <button
          type="button"
          onClick={onToggleSensitivity}
          className={`w-12 h-6 rounded-full transition-colors duration-300 relative focus:outline-none p-1 ${
            highSensitivity ? 'bg-primary' : 'bg-surface-variant'
          }`}
        >
          <span
            className={`block w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
              highSensitivity ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Toggle 2: Push Alerts */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-body-md text-sm font-semibold text-on-surface">Real-Time Threat Alerts</span>
          <span className="font-body-sm text-xs text-on-surface-variant">Instant audio popups on high risk flag</span>
        </div>
        <button
          type="button"
          onClick={onToggleAlerts}
          className={`w-12 h-6 rounded-full transition-colors duration-300 relative focus:outline-none p-1 ${
            pushAlerts ? 'bg-primary' : 'bg-surface-variant'
          }`}
        >
          <span
            className={`block w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
              pushAlerts ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Threshold Slider */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-outline-variant/30">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-on-surface-variant">Deepfake Threshold:</span>
          <span className="font-mono font-bold text-error">{riskThreshold} / 100</span>
        </div>
        <input
          type="range"
          min="40"
          max="90"
          value={riskThreshold}
          onChange={(e) => onChangeThreshold(Number(e.target.value))}
          className="w-full h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
          <span>Aggressive (40)</span>
          <span>Standard (70)</span>
          <span>Conservative (90)</span>
        </div>
      </div>

      {/* DPDP Compliance Notice */}
      <div className="p-2.5 bg-secondary-container/20 rounded-lg flex items-center gap-2 border border-secondary/20">
        <EyeOff className="w-4 h-4 text-secondary shrink-0" />
        <span className="font-mono text-[10px] text-secondary font-medium">
          DPDP Act Privacy Shield: Raw Audio Zero-Persistence Enforced
        </span>
      </div>
    </div>
  );
};
