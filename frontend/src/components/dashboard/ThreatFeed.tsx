import React, { useState } from 'react';
import { Gavel, Radio, Bell, ShieldAlert, Sparkles } from 'lucide-react';

interface ThreatFeedProps {
  threatEvents?: { id: string; title: string; subtitle: string; time: string; type: 'threat' | 'policy' | 'update' }[];
}

export const ThreatFeed: React.FC<ThreatFeedProps> = ({ threatEvents }) => {
  const defaultEvents = [
    {
      id: '1',
      title: 'Policy Triggered: Blocked Subnet',
      subtitle: 'Subnet 192.168.1.x terminated via high anomaly flag',
      time: 'Just now',
      type: 'threat' as const
    },
    {
      id: '2',
      title: 'Global Signature Update',
      subtitle: 'AASIST-v4.2.1 Weights Deployed',
      time: '15 mins ago',
      type: 'update' as const
    },
    {
      id: '3',
      title: 'Out-of-Band OTP Mandate',
      subtitle: 'Session INT_44021 escalation logged',
      time: '42 mins ago',
      type: 'policy' as const
    }
  ];

  const events = threatEvents && threatEvents.length > 0 ? threatEvents : defaultEvents;

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 p-stack-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
        <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
          </span>
          Live Threat Feed
        </h3>
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Stream Active</span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[220px]">
        {events.map((evt) => (
          <div key={evt.id} className="p-2.5 bg-surface-container-low rounded-lg flex items-start gap-2.5 border border-outline-variant/20 hover:bg-surface-container transition-colors">
            {evt.type === 'threat' ? (
              <Gavel className="w-4 h-4 text-error mt-0.5 shrink-0" />
            ) : evt.type === 'update' ? (
              <Radio className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            ) : (
              <Bell className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs font-semibold text-on-surface truncate">{evt.title}</p>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">{evt.subtitle}</p>
              <span className="font-mono text-[10px] text-on-surface-variant/70">{evt.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
