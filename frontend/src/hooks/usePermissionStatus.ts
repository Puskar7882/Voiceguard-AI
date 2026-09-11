import { useState, useEffect, useCallback } from 'react';

export type PermissionState = 'prompt' | 'requesting' | 'granted' | 'denied';

// Note: This only re-prompts on logins where the user hasn't already granted/denied
// permission for this origin — browser-level permission caching determines whether
// the native prompt appears, which cannot be overridden by application code.

let sessionPermissionRequested = false;

export function usePermissionStatus() {
  const [micStatus, setMicStatus] = useState<PermissionState>('prompt');
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Check initial browser permission status if supported
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((status) => {
          if (status.state === 'granted') setMicStatus('granted');
          else if (status.state === 'denied') setMicStatus('denied');
          else setMicStatus('prompt');

          status.onchange = () => {
            if (status.state === 'granted') setMicStatus('granted');
            else if (status.state === 'denied') setMicStatus('denied');
            else setMicStatus('prompt');
          };
        })
        .catch(() => {
          // Fallback to prompt state
        });
    }
  }, []);

  const requestMicPermission = useCallback(async (): Promise<'granted' | 'denied'> => {
    setMicStatus('requesting');
    sessionPermissionRequested = true;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicStatus('denied');
        return 'denied';
      }

      // Request audio stream once to register permission with browser
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Immediately stop and release tracks — do NOT start recording or WebSocket stream
      stream.getTracks().forEach((track) => track.stop());

      setMicStatus('granted');
      return 'granted';
    } catch (err: any) {
      setMicStatus('denied');
      return 'denied';
    }
  }, []);

  const resetSessionCheck = () => {
    sessionPermissionRequested = false;
  };

  return {
    micStatus,
    setMicStatus,
    isBannerDismissed,
    setIsBannerDismissed,
    requestMicPermission,
    hasRequestedThisSession: sessionPermissionRequested,
    resetSessionCheck
  };
}
