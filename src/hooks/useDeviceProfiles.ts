import { useCallback, useEffect, useState } from 'react';
import { DeviceProfile, LoRaParams } from '../types';

const STORAGE_KEY = 'lora_device_profiles_v1';

function loadFromStorage(): DeviceProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DeviceProfile[]) : [];
  } catch {
    return [];
  }
}

function genId(): string {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useDeviceProfiles() {
  const [devices, setDevices] = useState<DeviceProfile[]>(loadFromStorage);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [devices]);

  const addDevice = useCallback((name: string, params: LoRaParams, toaMs: number): DeviceProfile => {
    const device: DeviceProfile = {
      id: genId(),
      name: name.trim() || `Устройство ${Date.now().toString().slice(-4)}`,
      params: JSON.parse(JSON.stringify(params)) as LoRaParams,
      toaMs,
    };
    setDevices(prev => [...prev, device]);
    return device;
  }, []);

  const updateDevice = useCallback((id: string, params: LoRaParams, toaMs: number) => {
    setDevices(prev => prev.map(d => (d.id === id ? { ...d, params: JSON.parse(JSON.stringify(params)) as LoRaParams, toaMs } : d)));
  }, []);

  const renameDevice = useCallback((id: string, name: string) => {
    setDevices(prev => prev.map(d => (d.id === id ? { ...d, name } : d)));
  }, []);

  const removeDevice = useCallback((id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearDevices = useCallback(() => setDevices([]), []);

  const replaceDevices = useCallback((newDevices: DeviceProfile[]) => {
    setDevices(newDevices);
  }, []);

  return { devices, addDevice, updateDevice, renameDevice, removeDevice, clearDevices, replaceDevices };
}
