import { Clock, X, ArrowRight, Timer, Trash2, Activity, CheckCircle2, AlertTriangle, Radio, Cpu, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Undo2, Redo2 } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NumberInput } from '@/components/ui/NumberInput';
import { DeviceProfile, LoRaParams } from '@/types';
import { calculateToA } from '@/utils/lora';
import { motion } from 'motion/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface SeqItem {
  id: string;
  type: 'TX' | 'RX' | 'WAIT';
  label: string;
  durationMs: number;
  details: string;
  deviceId?: string;
}

interface CyclogramVisualizerProps {
  devices: DeviceProfile[];
  initialSequence?: SeqItem[];
  initialDcMode?: 'strict' | 'burst';
  key?: string | number;
  onSequenceChange?: (seq: SeqItem[]) => void;
  onDcModeChange?: (mode: 'strict' | 'burst') => void;
}

const rid = () => Math.random().toString(36).substring(2, 9);

const DEVICE_COLORS = [
  { bg: 'bg-blue-600', border: 'border-blue-700' },
  { bg: 'bg-violet-600', border: 'border-violet-700' },
  { bg: 'bg-teal-600', border: 'border-teal-700' },
  { bg: 'bg-amber-600', border: 'border-amber-700' },
  { bg: 'bg-rose-600', border: 'border-rose-700' },
];

function deviceResults(p: LoRaParams) {
  const totalPayload = p.payload + (p.customBlocks?.reduce((acc, b) => acc + b.bytes, 0) || 0);
  const r = calculateToA(p.sf, p.bw * 1000, totalPayload, p.cr, p.preamble, p.explicitHeader, p.crc);
  const toaMs = r.toa * 1000;
  const dcFraction = p.dutyCycle / 100;
  const waitTimeMs = dcFraction > 0 ? toaMs * ((1 / dcFraction) - 1) : 0;
  return { toaMs, preambleMs: r.tPreamble * 1000, payloadPartMs: r.tPayload * 1000, waitTimeMs, totalPayload };
}

export function CyclogramVisualizer({ devices, initialSequence, initialDcMode, onSequenceChange, onDcModeChange }: CyclogramVisualizerProps) {
  const [customWaitSec, setCustomWaitSec] = useState<number>(1);
  const [sequence, setSequenceRaw] = useState<SeqItem[]>(initialSequence ?? []);
  const [undoStack, setUndoStack] = useState<SeqItem[][]>([]);
  const [redoStack, setRedoStack] = useState<SeqItem[][]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [responderId, setResponderId] = useState<string>('');
  const [repsPerHour, setRepsPerHour] = useState<number>(1);
  const [dcMode, setDcMode] = useState<'strict' | 'burst'>(initialDcMode ?? 'strict');
  const [pxPerSec, setPxPerSec] = useState(150);
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);

  const setSequence = useCallback((updater: SeqItem[] | ((prev: SeqItem[]) => SeqItem[])) => {
    setSequenceRaw((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: SeqItem[]) => SeqItem[])(prev) : updater;
      if (next !== prev) {
        setUndoStack((u) => [...u, prev].slice(-50));
        setRedoStack([]);
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setUndoStack((u) => {
      if (u.length === 0) return u;
      const prev = u[u.length - 1];
      setRedoStack((r) => [...r, sequence]);
      setSequenceRaw(prev);
      setSelStart(null); setSelEnd(null);
      return u.slice(0, -1);
    });
  }, [sequence]);

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[r.length - 1];
      setUndoStack((u) => [...u, sequence]);
      setSequenceRaw(next);
      setSelStart(null); setSelEnd(null);
      return r.slice(0, -1);
    });
  }, [sequence]);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    const el = containerRef.current;
    if (el) el.addEventListener('keydown', handler);
    return () => { if (el) el.removeEventListener('keydown', handler); };
  }, [undo, redo]);

  useEffect(() => { onSequenceChange?.(sequence); }, [sequence, onSequenceChange]);
  useEffect(() => { onDcModeChange?.(dcMode); }, [dcMode, onDcModeChange]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const selLo = selStart !== null && selEnd !== null ? Math.min(selStart, selEnd) : selStart;
  const selHi = selStart !== null && selEnd !== null ? Math.max(selStart, selEnd) : selStart;
  const hasSel = selLo !== null && selHi !== null;
  const isSelected = (i: number) => hasSel && i >= (selLo as number) && i <= (selHi as number);

  const handleBlockClick = (e: { shiftKey: boolean }, i: number) => {
    if (e.shiftKey && selStart !== null) {
      setSelEnd(i);
    } else {
      setSelStart(i);
      setSelEnd(i);
    }
  };

  const moveSel = (dir: -1 | 1) => {
    if (!hasSel) return;
    const lo = selLo as number;
    const hi = selHi as number;
    if (dir === -1 && lo === 0) return;
    if (dir === 1 && hi === sequence.length - 1) return;
    setSequence((prev) => {
      const next = [...prev];
      if (dir === -1) {
        const tmp = next[lo - 1];
        next.splice(lo - 1, 1);
        next.splice(hi, 0, tmp);
      } else {
        const tmp = next[hi + 1];
        next.splice(hi + 1, 1);
        next.splice(lo, 0, tmp);
      }
      return next;
    });
    if (dir === -1) { setSelStart((s) => (s !== null ? s - 1 : s)); setSelEnd((s) => (s !== null ? s - 1 : s)); }
    else { setSelStart((s) => (s !== null ? s + 1 : s)); setSelEnd((s) => (s !== null ? s + 1 : s)); }
  };

  const blockWidth = (durationMs: number, isWait = false) => {
    if (isWait) {
      if (durationMs > 500) {
        const base = (500 / 1000) * pxPerSec;
        const extra = Math.log10(durationMs / 500) * pxPerSec * 0.25;
        return Math.max(base + extra, 40);
      }
      const w = (durationMs / 1000) * pxPerSec;
      return Math.max(w, 40);
    }
    const w = (durationMs / 1000) * pxPerSec;
    return Math.min(Math.max(w, 80), 100);
  };

  const fitToWidth = () => {
    if (totalSeqTimeMs === 0) return;
    const containerWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth - 80, 760) : 760;
    const ideal = containerWidth / (totalSeqTimeSec || 1);
    setPxPerSec(Math.max(15, Math.min(400, Math.round(ideal * 10) / 10)));
  };

  const colorIndex = (id?: string) => {
    const idx = devices.findIndex((d) => d.id === id);
    return idx < 0 ? 0 : idx % DEVICE_COLORS.length;
  };

  if (devices.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-100 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-slate-900 font-semibold text-lg">Циклограмма обмена</h3>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400 py-12 border border-dashed border-slate-200 rounded-xl">
          <Cpu className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-sm text-center max-w-sm">Нет сохранённых устройств. Настройте радио на вкладке <strong>«Калькулятор пакета»</strong> и сохраните хотя бы одно устройство.</span>
        </div>
      </div>
    );
  }

  const active = devices.find((d) => d.id === activeId) ?? devices[0];
  const responder = devices.find((d) => d.id === responderId) ?? devices.find((d) => d.id !== active.id) ?? active;
  const activeRes = deviceResults(active.params);
  const preamblePercentage = (activeRes.preambleMs / activeRes.toaMs) * 100;
  const payloadPercentage = (activeRes.payloadPartMs / activeRes.toaMs) * 100;

  const addTxWithDC = () => {
    const r = deviceResults(active.params);
    setSequence((prev) => [
      ...prev,
      { id: rid(), type: 'TX', deviceId: active.id, label: `${active.name} · TX`, durationMs: r.toaMs, details: `SF${active.params.sf}, ${r.totalPayload}B` },
      ...(dcMode === 'strict' ? [{ id: rid(), type: 'WAIT' as const, label: `Пауза DC (${active.params.dutyCycle}%)`, durationMs: r.waitTimeMs, details: active.name }] : []),
    ]);
  };

  const addDialog = () => {
    const rInit = deviceResults(active.params);
    const rResp = deviceResults(responder.params);
    const rx1Delay = dcMode === 'strict' ? 1000 : 0;
    const items: SeqItem[] = [
      { id: rid(), type: 'TX', deviceId: active.id, label: `${active.name} · TX`, durationMs: rInit.toaMs, details: `Запрос · SF${active.params.sf}, ${rInit.totalPayload}B` },
    ];
    if (rx1Delay > 0) {
      items.push({ id: rid(), type: 'WAIT', label: 'Обработка / RX1', durationMs: rx1Delay, details: '≈1 с' });
    }
    items.push({ id: rid(), type: 'TX', deviceId: responder.id, label: `${responder.name} · TX`, durationMs: rResp.toaMs, details: `Ответ · SF${responder.params.sf}, ${rResp.totalPayload}B` });
    if (dcMode === 'strict') {
      // DC пауза для responder (после его TX он должен молчать)
      if (rResp.waitTimeMs > 0) {
        items.push({ id: rid(), type: 'WAIT', label: `Пауза DC (${responder.params.dutyCycle}%)`, durationMs: rResp.waitTimeMs, details: responder.name });
      }
      // Остаток DC для initiator: его required silence = waitTimeMs,
      // из которого 1с обработки + TX responder + DC пауза responder уже покрыли часть
      const coveredA = rx1Delay + rResp.toaMs + rResp.waitTimeMs;
      const remainingWaitA = Math.max(0, rInit.waitTimeMs - coveredA);
      if (remainingWaitA > 0) {
        items.push({ id: rid(), type: 'WAIT', label: 'Остаток DC', durationMs: remainingWaitA, details: active.name });
      }
    }
    setSequence((prev) => [...prev, ...items]);
  };

  const addRx = () => {
    const r = deviceResults(active.params);
    setSequence((prev) => [...prev, { id: rid(), type: 'RX', deviceId: active.id, label: 'Окно приёма (RX)', durationMs: r.toaMs, details: `Прослушивание · ${active.name}` }]);
  };

  const addWait = (ms: number, label: string) => {
    setSequence((prev) => [...prev, { id: rid(), type: 'WAIT', label, durationMs: ms, details: 'Ожидание' }]);
  };

  const removeSeqItem = (id: string) => {
    setSequence((prev) => prev.filter((i) => i.id !== id));
    setSelStart(null); setSelEnd(null);
  };
  const removeSelected = () => {
    if (!hasSel) return;
    const lo = selLo as number;
    const hi = selHi as number;
    setSequence((prev) => prev.filter((_, i) => i < lo || i > hi));
    setSelStart(null); setSelEnd(null);
  };
  const clearSequence = () => { setSequence([]); setSelStart(null); setSelEnd(null); };

  const totalSeqTimeMs = sequence.reduce((acc, item) => acc + item.durationMs, 0);
  const totalSeqTimeSec = totalSeqTimeMs / 1000;

  // Устройства, участвующие в циклограмме (TX или RX).
  const participatingDeviceIds: string[] = Array.from(
    new Set(sequence.filter((i): i is SeqItem & { deviceId: string } => (i.type === 'TX' || i.type === 'RX') && !!i.deviceId).map((i) => i.deviceId))
  );
  const dcRows = participatingDeviceIds.map((id) => {
    const dev = devices.find((d) => d.id === id);
    const limit = dev?.params.dutyCycle ?? 1;
    const airtime = sequence.filter((i) => i.type === 'TX' && i.deviceId === id).reduce((acc, i) => acc + i.durationMs, 0);
    // strict: доля эфира в окне сценария (паузы встроены в последовательность)
    // burst: доля эфира в часовом окне с учётом повторений
    const windowMs = dcMode === 'strict' ? totalSeqTimeMs : 3600_000;
    const effectiveAirtime = dcMode === 'burst' ? airtime * repsPerHour : airtime;
    const used = windowMs > 0 ? (effectiveAirtime / windowMs) * 100 : 0;
    const requiredWindow = limit > 0 ? effectiveAirtime / (limit / 100) : 0;
    const compliant = used <= limit + 1e-9;
    const deficit = Math.max(0, requiredWindow - (dcMode === 'strict' ? totalSeqTimeMs : 3600_000));
    // burst: сколько таких бёрстов влезет в час до лимита
    const burstsPerHour = dcMode === 'burst' && airtime > 0 ? Math.floor((limit / 100) * 3600_000 / airtime) : 0;
    // Лимит эфира в секундах и остаток
    const limitSec = (limit / 100) * (dcMode === 'strict' ? totalSeqTimeSec : 3600);
    const usedSec = effectiveAirtime / 1000;
    const remainingSec = Math.max(0, limitSec - usedSec);
    const txCount = sequence.filter((i) => i.type === 'TX' && i.deviceId === id).length;
    const rxCount = sequence.filter((i) => i.type === 'RX' && i.deviceId === id).length;
    return { id, name: dev?.name ?? '—', airtime, limit, used, compliant, deficit, requiredWindow, burstsPerHour, colorIdx: colorIndex(id), limitSec, usedSec, remainingSec, txCount, rxCount };
  });
  const allCompliant = dcRows.every((r) => r.compliant);

  // Ёмкость по сценарию: оценка коллизий для собранного диалога
  const totalTxAirtimeMs = sequence.filter((i) => i.type === 'TX').reduce((acc, i) => acc + i.durationMs, 0);
  const scenarioT = totalTxAirtimeMs / 1000;
  const scenarioG = (repsPerHour / 3600) * scenarioT;
  const scenarioP = 1 - Math.exp(-2 * scenarioG);
  const scenarioSuccessful = repsPerHour * Math.exp(-2 * scenarioG);
  const scenarioPPct = scenarioP * 100;
  const scenarioCollTone = scenarioPPct < 5 ? 'ok' : scenarioPPct < 10 ? 'warn' : 'bad';

  return (
    <div ref={containerRef} tabIndex={0} className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-100 shadow-lg focus:outline-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-slate-900 font-semibold text-lg">Циклограмма обмена</h3>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {devices.map((d, i) => (
            <div key={d.id} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`w-3 h-3 rounded-sm ${DEVICE_COLORS[i % DEVICE_COLORS.length].bg}`} />
              <span className="truncate max-w-[140px]">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {/* Micro Cyclogram — активное устройство */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-3 gap-2">
            <div>
              <span className="text-sm font-bold text-slate-800 block">Структура ToA</span>
              <span className="text-xs text-slate-500">Эфирное время одной посылки — {active.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <CustomSelect
                value={active.id}
                onChange={setActiveId}
                options={devices.map((d) => ({ value: d.id, label: d.name }))}
                className="w-36"
              />
              <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{activeRes.toaMs.toFixed(1)} ms</span>
            </div>
          </div>

          <div className="h-12 rounded-xl overflow-hidden flex shadow-sm bg-slate-100 border border-slate-200">
            <motion.div
              initial={false}
              animate={{ width: `${preamblePercentage}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              className="bg-indigo-500 flex flex-col items-center justify-center text-white relative group border-r border-indigo-600 min-w-[20px]"
            >
              <span className="text-[10px] sm:text-xs font-bold tracking-wider px-2 truncate">PRE</span>
              <span className="text-[10px] font-mono opacity-90 truncate hidden sm:block">{activeRes.preambleMs.toFixed(1)}ms</span>
            </motion.div>
            <motion.div
              initial={false}
              animate={{ width: `${payloadPercentage}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              className="bg-emerald-500 flex flex-col items-center justify-center text-white relative group min-w-[20px]"
            >
              <span className="text-[10px] sm:text-xs font-bold tracking-wider px-2 truncate">PAYLOAD</span>
              <span className="text-[10px] font-mono opacity-90 truncate hidden sm:block">{activeRes.payloadPartMs.toFixed(1)}ms</span>
            </motion.div>
          </div>
        </div>

        {/* Macro Cyclogram (Sequence Builder) */}
        <div className="pt-8 border-t border-slate-100">
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <span className="text-sm font-bold text-slate-800">Сценарий обмена</span>
              <span className="text-xs text-slate-500 block mt-1">Соберите диалог между сохранёнными устройствами. Каждый TX — излучение конкретного устройства (цвет), паузы и RX эфир не занимают.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Режим DC */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 h-8 flex-shrink-0">
                <button
                  onClick={() => setDcMode('strict')}
                  className={cn('px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors', dcMode === 'strict' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                  title="Пауза DC после каждого TX (как LoRaWAN)"
                >Стандарт</button>
                <button
                  onClick={() => setDcMode('burst')}
                  className={cn('px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors', dcMode === 'burst' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                  title="Без авто-пауз: TX подряд, DC по часовому окну"
                >Быстрый</button>
              </div>
              <button onClick={addTxWithDC} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium transition-colors">
                <ArrowRight className="w-3.5 h-3.5" /> {dcMode === 'strict' ? 'TX + Пауза DC' : 'TX'}
              </button>
              <button onClick={addRx} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-medium transition-colors">
                <Radio className="w-3.5 h-3.5" /> Окно RX
              </button>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8">
                <NumberInput
                  value={customWaitSec}
                  onChange={(v) => setCustomWaitSec(v)}
                  min={0.1}
                  step={0.1}
                  borderless
                  title="Задержка в секундах"
                  className="w-24 h-full px-2 text-xs bg-transparent focus:outline-none"
                />
                <span className="text-xs text-slate-500 pr-1 select-none">с</span>
                <button onClick={() => addWait(customWaitSec * 1000, 'Свободная пауза')} className="flex items-center gap-1.5 px-3 h-full bg-slate-100 text-slate-700 hover:bg-slate-200 border-l border-slate-200 text-xs font-medium transition-colors">
                  <Timer className="w-3.5 h-3.5" /> +
                </button>
              </div>
              {sequence.length > 0 && (
                <button onClick={clearSequence} className="flex items-center gap-1 px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs transition-colors ml-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {devices.length >= 2 && (
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 bg-indigo-50/50 border border-indigo-100 rounded-lg p-2.5">
                <span className="text-[11px] font-medium text-indigo-700 flex-shrink-0">Диалог:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <CustomSelect value={active.id} onChange={setActiveId} options={devices.map((d) => ({ value: d.id, label: d.name }))} className="w-32 sm:w-36" />
                  <ArrowRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <CustomSelect value={responder.id} onChange={setResponderId} options={devices.map((d) => ({ value: d.id, label: d.name }))} className="w-32 sm:w-36" />
                </div>
                <button onClick={addDialog} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:brightness-90 rounded-lg text-xs font-medium transition-all flex-shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" /> Запрос → Ответ
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
            {sequence.length > 0 && (
              <div className="flex items-center justify-between mb-3 sticky top-0 bg-slate-50 py-1 z-10 gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setPxPerSec((p) => Math.max(15, Math.round(p / 1.5 * 10) / 10))}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Уменьшить масштаб"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-500 min-w-[60px] text-center">{pxPerSec} px/с</span>
                  <button
                    onClick={() => setPxPerSec((p) => Math.min(400, Math.round(p * 1.5 * 10) / 10))}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Увеличить масштаб"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={fitToWidth}
                    className="flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-xs font-medium"
                    title="Уместить в экран"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Fit
                  </button>
                  <div className="flex items-center gap-0.5 ml-1 bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Отменить (Ctrl+Z)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Повторить (Ctrl+Y)"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                  </div>
                  {hasSel && (
                    <div className="flex items-center gap-0.5 ml-1 bg-blue-50 border border-blue-200 rounded-lg p-0.5">
                      <button
                        onClick={() => moveSel(-1)}
                        disabled={(selLo as number) === 0}
                        className="p-1 text-blue-700 hover:bg-blue-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Сдвинуть влево"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-mono text-blue-600 px-1 select-none">
                        {selLo !== selHi ? `${(selLo as number) + 1}–${(selHi as number) + 1}` : `${(selLo as number) + 1}`}
                      </span>
                      <button
                        onClick={() => moveSel(1)}
                        disabled={(selHi as number) === sequence.length - 1}
                        className="p-1 text-blue-700 hover:bg-blue-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Сдвинуть вправо"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={removeSelected}
                        className="p-1 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                        title="Удалить выделенное"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1">{totalSeqTimeSec < 1 ? `${totalSeqTimeMs.toFixed(0)} ms` : totalSeqTimeSec < 60 ? `${totalSeqTimeSec.toFixed(2)} с` : `${Math.floor(totalSeqTimeSec / 60)}м ${Math.round(totalSeqTimeSec % 60)}с`}</span>
              </div>
            )}
            <div className="overflow-x-auto">
            {sequence.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 min-h-[140px]">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm">Сценарий пуст. Добавьте элементы.</span>
              </div>
            ) : (
              <div className="min-w-max flex flex-col justify-center min-h-[140px]">
                <div className="flex items-stretch h-20 mb-6">
                  {sequence.map((item, idx) => {
                    const isWait = item.type === 'WAIT';
                    const w = blockWidth(item.durationMs, isWait);
                    const showFull = w >= 100;
                    const showCompact = w >= 80 && !showFull;
                    const sel = isSelected(idx);
                    if (item.type === 'TX') {
                      const c = DEVICE_COLORS[colorIndex(item.deviceId)];
                      return (
                        <div key={item.id} onClick={(e) => handleBlockClick(e, idx)} className={cn(`group relative flex flex-col justify-center items-center ${c.bg} text-white px-1 rounded-md shadow-sm border ${c.border} z-10 mx-0.5 cursor-pointer transition-all`, sel && 'ring-2 ring-blue-400 ring-offset-1')} style={{ width: w, minWidth: w }}>
                          {showFull ? (
                            <>
                              <span className="text-[11px] font-bold tracking-wide text-center px-1 leading-tight">{item.label}</span>
                              <span className="text-[10px] font-mono mt-0.5">{item.durationMs.toFixed(0)} ms</span>
                              <span className="text-[9px] opacity-80 mt-0.5 text-center px-1 leading-tight">{item.details}</span>
                            </>
                          ) : showCompact ? (
                            <>
                              <span className="text-[10px] font-bold text-center px-0.5 leading-tight truncate max-w-full">TX</span>
                              <span className="text-[9px] font-mono mt-0.5">{item.durationMs.toFixed(0)}ms</span>
                            </>
                          ) : (
                            <span className="text-[9px] font-bold rotate-90 whitespace-nowrap">TX</span>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); removeSeqItem(item.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }
                    if (item.type === 'RX') {
                      const c = DEVICE_COLORS[colorIndex(item.deviceId)];
                      return (
                        <div key={item.id} onClick={(e) => handleBlockClick(e, idx)} className={cn('group relative flex flex-col justify-center items-center text-white px-1 rounded-md shadow-sm border z-10 mx-0.5 cursor-pointer transition-all', `${c.bg} opacity-60 ${c.border}`, sel && 'ring-2 ring-blue-400 ring-offset-1')} style={{ width: w, minWidth: w }}>
                          {showFull ? (
                            <>
                              <span className="text-[11px] font-bold tracking-wide text-center px-1 leading-tight">{item.label}</span>
                              <span className="text-[10px] font-mono mt-0.5">{item.durationMs.toFixed(0)} ms</span>
                              <span className="text-[9px] opacity-90 mt-0.5 text-center px-1 leading-tight">{item.details}</span>
                            </>
                          ) : showCompact ? (
                            <>
                              <span className="text-[10px] font-bold text-center px-0.5 leading-tight truncate max-w-full">RX</span>
                              <span className="text-[9px] font-mono mt-0.5">{item.durationMs.toFixed(0)}ms</span>
                            </>
                          ) : (
                            <span className="text-[9px] font-bold rotate-90 whitespace-nowrap">RX</span>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); removeSeqItem(item.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div key={item.id} onClick={(e) => handleBlockClick(e, idx)} className={cn('group relative flex flex-col justify-center items-center pattern-diagonal-lines text-slate-800 bg-slate-200 border border-slate-400 rounded-md mx-0.5 cursor-pointer transition-all', sel && 'ring-2 ring-blue-400 ring-offset-1')} style={{ width: w, minWidth: w }}>
                        {showFull ? (
                          <div className="bg-slate-50/90 backdrop-blur-sm px-2 py-1 border border-slate-400 rounded-lg shadow-sm flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-900 truncate max-w-full">{item.label}</span>
                            <span className="text-[10px] font-mono text-slate-600">
                              {item.durationMs >= 1000 ? `${(item.durationMs / 1000).toFixed(2)} s` : `${item.durationMs.toFixed(0)} ms`}
                            </span>
                          </div>
                        ) : showCompact ? (
                          <div className="bg-slate-50/90 backdrop-blur-sm px-1 py-0.5 border border-slate-400 rounded shadow-sm flex flex-col items-center">
                            <span className="text-[9px] font-mono text-slate-600">
                              {item.durationMs >= 1000 ? `${(item.durationMs / 1000).toFixed(1)}s` : `${item.durationMs.toFixed(0)}ms`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold rotate-90 whitespace-nowrap text-slate-600">{item.durationMs >= 1000 ? `${(item.durationMs / 1000).toFixed(0)}с` : 'W'}</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); removeSeqItem(item.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono w-full px-1 relative">
                  <span>0s</span>
                  <div className="flex-1 border-t border-dashed border-slate-300 mt-1.5 mx-2 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-50 px-2 text-slate-600 font-sans font-medium text-xs rounded border border-slate-200 shadow-sm whitespace-nowrap">
                      Общее время: {totalSeqTimeSec < 1 ? `${totalSeqTimeMs.toFixed(0)} ms` : totalSeqTimeSec < 60 ? `${totalSeqTimeSec.toFixed(2)} s` : `${Math.floor(totalSeqTimeSec / 60)}м ${Math.round(totalSeqTimeSec % 60)}с`}
                    </div>
                  </div>
                  <span>{totalSeqTimeSec < 1 ? `${totalSeqTimeMs.toFixed(0)} ms` : totalSeqTimeSec < 60 ? `${totalSeqTimeSec.toFixed(2)} s` : `${Math.floor(totalSeqTimeSec / 60)}м ${Math.round(totalSeqTimeSec % 60)}с`}</span>
                </div>
              </div>
            )}
            </div>
          </div>

          {dcRows.length > 0 && (
            <div className={`mt-4 rounded-xl border p-4 ${allCompliant ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {allCompliant ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                <span className={`font-semibold text-sm ${allCompliant ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {allCompliant ? 'Duty Cycle соблюдён всеми устройствами' : 'Превышение Duty Cycle'}
                </span>
                <span className="text-xs text-slate-500 font-mono">· окно {dcMode === 'strict' ? `${(totalSeqTimeMs / 1000).toFixed(2)} с` : '1 час'}</span>
              </div>
              {dcMode === 'burst' && !allCompliant && (
                <div className="mb-3 text-xs text-rose-700 bg-rose-100/60 rounded-lg px-3 py-2">
                  В «быстром» режиме весь эфирный лимит тратится за бёрст. После превышения нужно ждать до конца часового окна, прежде чем передавать снова.
                </div>
              )}
              <div className="space-y-2">
                {dcRows.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1.5 min-w-[140px]">
                      <span className={`w-2.5 h-2.5 rounded-sm ${DEVICE_COLORS[r.colorIdx].bg}`} />
                      <span className="font-medium text-slate-700 truncate">{r.name}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {r.txCount > 0 ? `${r.txCount} TX` : 'только приём'}{r.rxCount > 0 ? ` · ${r.rxCount} RX` : ''}
                    </span>
                    {r.txCount > 0 ? (
                      <>
                        <span className="font-mono text-slate-600">
                          эфир {r.usedSec.toFixed(2)} с{dcMode === 'burst' && repsPerHour !== 1 ? ` (${r.airtime.toFixed(0)} мс × ${repsPerHour})` : ''}
                        </span>
                        <span className="font-mono text-slate-500">лимит {r.limitSec.toFixed(1)} с</span>
                        <span className="font-mono">занято <strong className={r.compliant ? 'text-emerald-700' : 'text-rose-700'}>{r.used.toFixed(2)}%</strong> / {r.limit}%</span>
                        <span className={`font-mono ${r.compliant ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {r.compliant ? `осталось ${r.remainingSec.toFixed(1)} с` : `перебор на ${(r.usedSec - r.limitSec).toFixed(1)} с`}
                        </span>
                        {dcMode === 'burst' && (
                          <span className={r.compliant ? 'text-emerald-700' : 'text-rose-700'}>макс. {r.burstsPerHour}/час{repsPerHour > r.burstsPerHour ? ` — превышение на ${repsPerHour - r.burstsPerHour}` : ''}</span>
                        )}
                        {dcMode === 'strict' && !r.compliant && (
                          <span className="text-rose-700">добавьте ~{(r.deficit / 1000).toFixed(1)} с тишины</span>
                        )}
                      </>
                    ) : (
                      <span className="font-mono text-slate-400">эфир 0 с · DC не расходуется</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ёмкость по сценарию */}
          {sequence.length > 0 && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Ёмкость по сценарию (ALOHA)</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Повторов/час:</label>
                  <NumberInput
                    value={repsPerHour}
                    onChange={(v) => setRepsPerHour(v)}
                    min={0.1}
                    step={0.1}
                    className="w-24 px-2 py-1.5 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">Эфир сценария</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono font-semibold tabular-nums text-lg text-slate-900">{totalTxAirtimeMs.toFixed(0)}</span>
                    <span className="text-[11px] text-slate-400">мс TX</span>
                  </div>
                </div>
                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">Нагрузка</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono font-semibold tabular-nums text-lg text-slate-900">{scenarioG.toFixed(4)}</span>
                    <span className="text-[11px] text-slate-400">E</span>
                  </div>
                </div>
                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">Вер. коллизии</div>
                  <div className="flex items-baseline gap-1">
                    <span className={cn('font-mono font-semibold tabular-nums text-lg', scenarioCollTone === 'ok' ? 'text-emerald-600' : scenarioCollTone === 'warn' ? 'text-amber-600' : 'text-rose-600')}>{scenarioPPct.toFixed(2)}</span>
                    <span className="text-[11px] text-slate-400">%</span>
                  </div>
                </div>
                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">Успешных/час</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono font-semibold tabular-nums text-lg text-slate-900">{scenarioSuccessful.toFixed(1)}</span>
                    <span className="text-[11px] text-slate-400">из {repsPerHour}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Нагрузка <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">G = (повторов/час) · T_эфир</code>, вероятность коллизии <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">P = 1 − e⁻²ᴳ</code>. T_эфир — суммарное время TX в сценарии ({totalTxAirtimeMs.toFixed(0)} мс). Оценка предполагает, что N независимых пар устройств выполняют тот же сценарий одновременно.
              </p>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-3 max-w-3xl">
            Каждый <strong>TX</strong> — излучение конкретного устройства (учитывается в его Duty Cycle). Паузы и окна <strong>RX</strong> эфир не занимают. <strong>«Стандарт»</strong>: после каждого TX вставляется пауза DC для передатчика, окно обработки 1 с (как LoRaWAN). <strong>«Быстрый»</strong>: TX подряд без пауз — DC считается по часовому окну с учётом количества повторов/час. <strong>Клик</strong> по блоку — выделить, <strong>Shift+клик</strong> — выделить диапазон, кнопки ← → — переместить.
          </p>
        </div>
      </div>
    </div>
  );
}
