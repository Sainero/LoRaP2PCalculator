import { useState } from 'react';
import { Save, Trash2, Upload, Cpu, Radio, RefreshCw } from 'lucide-react';
import { DeviceProfile, LoRaParams } from '@/types';

interface DeviceProfilesPanelProps {
  devices: DeviceProfile[];
  params: LoRaParams;
  toaMs: number;
  onSave: (name: string) => void;
  onLoad: (params: LoRaParams) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, params: LoRaParams, toaMs: number) => void;
}

function totalBytes(p: LoRaParams): number {
  return p.payload + (p.customBlocks?.reduce((acc, b) => acc + b.bytes, 0) || 0);
}

export function DeviceProfilesPanel({ devices, params, toaMs, onSave, onLoad, onRemove, onUpdate }: DeviceProfilesPanelProps) {
  const [name, setName] = useState('');

  const handleSave = () => {
    const fallback = `Устройство ${devices.length + 1}`;
    onSave(name.trim() || fallback);
    setName('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-100">
      <div className="flex items-center gap-2 mb-1">
        <Cpu className="w-5 h-5 text-blue-600" />
        <h3 className="text-slate-900 font-semibold text-lg">Профили устройств</h3>
      </div>
      <p className="text-xs text-slate-500 mb-5 max-w-2xl">
        Сохраните текущую конфигурацию как отдельное устройство (например «Устройство 1 — оконечка», «Устройство 2 — базовая станция»).
        Сохранённые устройства собираются вместе на вкладке <strong>«Ёмкость сети»</strong> для моделирования диалога.
      </p>

      {/* Save current */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={`Устройство ${devices.length + 1}`}
          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-slate-900 text-sm"
        />
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:brightness-90 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Save className="w-4 h-4" />
          Сохранить текущую конфигурацию
        </button>
      </div>

      {/* Current config summary */}
      <div className="text-xs font-mono text-slate-500 mb-5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
        Сейчас в редакторе: SF{params.sf} · {params.bw} kHz · 4/{params.cr + 4} · {totalBytes(params)} B · DC {params.dutyCycle}% · ToA {toaMs.toFixed(1)} мс
      </div>

      {/* Saved list */}
      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-slate-400 py-8 border border-dashed border-slate-200 rounded-xl">
          <Radio className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-sm">Пока нет сохранённых устройств.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((d, i) => (
            <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900 truncate">{d.name}</div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    SF{d.params.sf} · {d.params.bw} kHz · 4/{d.params.cr + 4} · {totalBytes(d.params)} B · DC {d.params.dutyCycle}% · ToA {d.toaMs.toFixed(1)} мс
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onLoad(d.params)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium transition-colors"
                  title="Загрузить в редактор"
                >
                  <Upload className="w-3.5 h-3.5" /> Загрузить
                </button>
                <button
                  onClick={() => onUpdate(d.id, params, toaMs)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-medium transition-colors"
                  title="Перезаписать текущими настройками"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Обновить
                </button>
                <button
                  onClick={() => onRemove(d.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
