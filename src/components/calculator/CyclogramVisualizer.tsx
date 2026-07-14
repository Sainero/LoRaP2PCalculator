import { Clock, X, ArrowRight, Timer, Trash2, Activity, CheckCircle2, AlertTriangle, Radio, Cpu } from 'lucide-react';
import { DeviceProfile, LoRaParams } from '@/types';
import { calculateToA } from '@/utils/lora';
import { motion } from 'motion/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CyclogramVisualizerProps {
  devices: DeviceProfile[];
}

interface SeqItem {
  id: string;
  type: 'TX' | 'RX' | 'WAIT';
  label: string;
  durationMs: number;
  details: string;
  deviceId?: string;
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

export function CyclogramVisualizer({ devices }: CyclogramVisualizerProps) {
  const [customWaitSec, setCustomWaitSec] = useState<number>(1);
  const [sequence, setSequence] = useState<SeqItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [responderId, setResponderId] = useState<string>('');
  const [repsPerHour, setRepsPerHour] = useState<number>(1);
  const [dcMode, setDcMode] = useState<'strict' | 'burst'>('strict');

  const colorIndex = (id?: string) => {
    const idx = devices.findIndex((d) => d.id === id);
    return idx < 0 ? 0 : idx % DEVICE_COLORS.length;
  };

  if (devices.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-lg">
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
    const remainingWait = Math.max(0, rInit.waitTimeMs - rx1Delay - rResp.toaMs);
    setSequence((prev) => [
      ...prev,
      { id: rid(), type: 'TX', deviceId: active.id, label: `${active.name} · TX`, durationMs: rInit.toaMs, details: `Запрос · SF${active.params.sf}, ${rInit.totalPayload}B` },
      ...(rx1Delay > 0 ? [{ id: rid(), type: 'WAIT' as const, label: 'Обработка / RX1', durationMs: rx1Delay, details: '≈1 с' }] : []),
      { id: rid(), type: 'TX', deviceId: responder.id, label: `${responder.name} · TX`, durationMs: rResp.toaMs, details: `Ответ · SF${responder.params.sf}, ${rResp.totalPayload}B` },
      ...(dcMode === 'strict' && remainingWait > 0 ? [{ id: rid(), type: 'WAIT' as const, label: 'Остаток DC', durationMs: remainingWait, details: active.name }] : []),
    ]);
  };

  const addRx = () => {
    const r = deviceResults(active.params);
    setSequence((prev) => [...prev, { id: rid(), type: 'RX', label: 'Окно приёма (RX)', durationMs: r.toaMs, details: `Прослушивание · ${active.name}` }]);
  };

  const addWait = (ms: number, label: string) => {
    setSequence((prev) => [...prev, { id: rid(), type: 'WAIT', label, durationMs: ms, details: 'Ожидание' }]);
  };

  const removeSeqItem = (id: string) => setSequence((prev) => prev.filter((i) => i.id !== id));
  const clearSequence = () => setSequence([]);

  const totalSeqTimeMs = sequence.reduce((acc, item) => acc + item.durationMs, 0);
  const totalSeqTimeSec = totalSeqTimeMs / 1000;

  // Duty cycle по каждому устройству: учитывается только собственное излучение (TX).
  const txDeviceIds: string[] = Array.from(
    new Set(sequence.filter((i): i is SeqItem & { deviceId: string } => i.type === 'TX' && !!i.deviceId).map((i) => i.deviceId))
  );
  const dcRows = txDeviceIds.map((id) => {
    const dev = devices.find((d) => d.id === id);
    const limit = dev?.params.dutyCycle ?? 1;
    const airtime = sequence.filter((i) => i.type === 'TX' && i.deviceId === id).reduce((acc, i) => acc + i.durationMs, 0);
    // strict: доля эфира в окне сценария; burst: доля эфира в часовом окне
    const windowMs = dcMode === 'strict' ? totalSeqTimeMs : 3600_000;
    const used = windowMs > 0 ? (airtime / windowMs) * 100 : 0;
    const requiredWindow = limit > 0 ? airtime / (limit / 100) : 0;
    const compliant = used <= limit + 1e-9;
    const deficit = Math.max(0, requiredWindow - (dcMode === 'strict' ? totalSeqTimeMs : 0));
    // burst: сколько таких бёрстов влезет в час до лимита
    const burstsPerHour = dcMode === 'burst' && airtime > 0 ? Math.floor((limit / 100) * 3600_000 / airtime) : 0;
    return { id, name: dev?.name ?? '—', airtime, limit, used, compliant, deficit, requiredWindow, burstsPerHour, colorIdx: colorIndex(id) };
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
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-lg">
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
              <select
                value={active.id}
                onChange={(e) => setActiveId(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-blue-400"
              >
                {devices.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
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
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 h-8">
                <button
                  onClick={() => setDcMode('strict')}
                  className={cn('px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors', dcMode === 'strict' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                  title="Пауза DC после каждого TX (как LoRaWAN)"
                >Стандарт</button>
                <button
                  onClick={() => setDcMode('burst')}
                  className={cn('px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors', dcMode === 'burst' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                  title="Без авто-пауз: TX подряд, задержка только на обработку, DC по часовому окну"
                >Быстрый</button>
              </div>
              <button onClick={addTxWithDC} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium transition-colors">
                <ArrowRight className="w-3.5 h-3.5" /> {dcMode === 'strict' ? 'TX + Пауза DC' : 'TX'}
              </button>
              <button onClick={addRx} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-medium transition-colors">
                <Radio className="w-3.5 h-3.5" /> Окно RX
              </button>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8">
                <input
                  type="number"
                  value={customWaitSec}
                  onChange={(e) => setCustomWaitSec(Number(e.target.value))}
                  className="w-16 h-full px-2 text-xs border-none bg-transparent focus:ring-0 focus:outline-none"
                  min={0.1}
                  step={0.1}
                  title="Задержка в секундах"
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
              <div className="flex flex-wrap items-center gap-2 bg-indigo-50/50 border border-indigo-100 rounded-lg p-2.5">
                <span className="text-[11px] font-medium text-indigo-700">Диалог:</span>
                <select value={active.id} onChange={(e) => setActiveId(e.target.value)} className="text-xs border border-indigo-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none">
                  {devices.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
                <ArrowRight className="w-4 h-4 text-indigo-400" />
                <select value={responder.id} onChange={(e) => setResponderId(e.target.value)} className="text-xs border border-indigo-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none">
                  {devices.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
                <button onClick={addDialog} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-medium transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" /> Запрос → Ответ
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
            {sequence.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 min-h-[140px]">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm">Сценарий пуст. Добавьте элементы.</span>
              </div>
            ) : (
              <div className="min-w-max flex flex-col justify-center min-h-[140px]">
                <div className="flex items-stretch h-20 mb-6">
                  {sequence.map((item) => {
                    if (item.type === 'TX') {
                      const c = DEVICE_COLORS[colorIndex(item.deviceId)];
                      return (
                        <div key={item.id} className={`group relative flex flex-col justify-center items-center ${c.bg} text-white min-w-[90px] px-3 rounded-md shadow-sm border ${c.border} z-10 mx-0.5`}>
                          <span className="text-[11px] font-bold tracking-wide truncate max-w-[110px]">{item.label}</span>
                          <span className="text-[10px] font-mono mt-0.5">{item.durationMs.toFixed(0)} ms</span>
                          <span className="text-[9px] opacity-80 mt-1 truncate max-w-[110px]">{item.details}</span>
                          <button onClick={() => removeSeqItem(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }
                    if (item.type === 'RX') {
                      return (
                        <div key={item.id} className="group relative flex flex-col justify-center items-center bg-emerald-500 text-white min-w-[90px] px-3 rounded-md shadow-sm border border-emerald-600 z-10 mx-0.5">
                          <span className="text-[11px] font-bold tracking-wide truncate max-w-[110px]">{item.label}</span>
                          <span className="text-[10px] font-mono mt-0.5">{item.durationMs.toFixed(0)} ms</span>
                          <span className="text-[9px] opacity-80 mt-1 truncate max-w-[110px]">{item.details}</span>
                          <button onClick={() => removeSeqItem(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div key={item.id} className="group relative flex flex-col justify-center items-center pattern-diagonal-lines text-slate-700 min-w-[120px] bg-slate-100 border border-slate-300 rounded-md mx-0.5" style={{ flexGrow: 1, minWidth: item.durationMs > 2000 ? '160px' : '100px' }}>
                        <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm flex flex-col items-center">
                          <span className="text-[10px] font-bold">{item.label}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {item.durationMs >= 1000 ? `${(item.durationMs / 1000).toFixed(2)} s` : `${item.durationMs.toFixed(0)} ms`}
                          </span>
                        </div>
                        <button onClick={() => removeSeqItem(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20">
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
                      Общее время: {totalSeqTimeSec < 1 ? `${totalSeqTimeMs.toFixed(0)} ms` : `${totalSeqTimeSec.toFixed(2)} s`}
                    </div>
                  </div>
                  <span>{totalSeqTimeSec < 1 ? `${totalSeqTimeMs.toFixed(0)} ms` : `${totalSeqTimeSec.toFixed(2)} s`}</span>
                </div>
              </div>
            )}
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
              <div className="space-y-2">
                {dcRows.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1.5 min-w-[140px]">
                      <span className={`w-2.5 h-2.5 rounded-sm ${DEVICE_COLORS[r.colorIdx].bg}`} />
                      <span className="font-medium text-slate-700 truncate">{r.name}</span>
                    </span>
                    <span className="font-mono text-slate-600">эфир {r.airtime.toFixed(0)} ms</span>
                    <span className="font-mono">занято <strong className={r.compliant ? 'text-emerald-700' : 'text-rose-700'}>{r.used.toFixed(2)}%</strong> / {r.limit}%</span>
                    {dcMode === 'burst' ? (
                      <span className={r.compliant ? 'text-emerald-700' : 'text-rose-700'}>≈ {r.burstsPerHour} таких бёрстов/час до лимита</span>
                    ) : (!r.compliant && (
                      <span className="text-rose-700">добавьте ~{(r.deficit / 1000).toFixed(1)} с тишины (мин. окно {(r.requiredWindow / 1000).toFixed(1)} с)</span>
                    ))}
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
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={repsPerHour}
                    onChange={(e) => setRepsPerHour(Math.max(0.1, Number(e.target.value)))}
                    className="w-20 px-2 py-1.5 text-sm font-mono rounded-lg border border-slate-200 focus:border-blue-400 focus:outline-none bg-white"
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
            Каждый <strong>TX</strong> — излучение конкретного устройства (учитывается в его Duty Cycle). Паузы и окна <strong>RX</strong> эфир не занимают. <strong>«Стандарт»</strong>: после каждого TX вставляется пауза DC, окно обработки 1 с (как LoRaWAN). <strong>«Быстрый»</strong>: TX подряд без пауз — при необходимости добавьте «Свободную паузу» вручную. DC проверяется по часовому окну.
          </p>
        </div>
      </div>
    </div>
  );
}
