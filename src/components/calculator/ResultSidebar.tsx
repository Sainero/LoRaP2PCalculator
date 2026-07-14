import { LoRaResults, LoRaParams } from '@/types';

interface ResultSidebarProps {
  results: LoRaResults;
  params: LoRaParams;
}

function MetricRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-600 text-sm">{label}</span>
      <span className="text-slate-900 font-mono text-sm tabular-nums">
        {value} <span className="text-slate-400">{unit}</span>
      </span>
    </div>
  );
}

export function ResultSidebar({ results, params }: ResultSidebarProps) {
  const fmtSec = (val: number) => (val / 1000).toFixed(6);
  const totalPayload = params.payload + (params.customBlocks?.reduce((acc, b) => acc + b.bytes, 0) || 0);
  const rate = results.bitRate >= 1000
    ? `${(results.bitRate / 1000).toFixed(2)} кбит/с`
    : `${results.bitRate.toFixed(0)} бит/с`;
  const preambleOverhead = ((results.preambleMs / results.toaMs) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
      <h2 className="text-slate-900 font-semibold text-lg mb-5">Детали расчёта</h2>

      {/* Total ToA hero */}
      <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/40 border border-blue-100 p-4 mb-4">
        <div className="text-[11px] uppercase tracking-wider text-blue-600/70 font-medium mb-1">Total Time on Air</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-light font-mono text-slate-900 tabular-nums">{results.toaMs.toFixed(3)}</span>
          <span className="text-slate-500 text-sm">мс</span>
        </div>
        <div className="text-slate-400 text-xs mt-1 font-mono">{fmtSec(results.toaMs)} s</div>
      </div>

      {/* Cooldown */}
      {params.dutyCycle < 100 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
          <div className="text-xs text-amber-700 mb-1">Ожидание эфира (Duty Cycle {params.dutyCycle}%)</div>
          <div className="text-xl text-amber-600 font-mono tabular-nums">{(results.waitTimeMs / 1000).toFixed(3)} s</div>
          <div className="text-amber-600/70 text-[11px] mt-1">Обязательная пауза до след. пакета</div>
        </div>
      )}

      {/* Тайминги */}
      <div className="space-y-2.5 border-t border-slate-100 pt-4">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Тайминги</div>
        <MetricRow label="Symbol time (Tsym)" value={results.tSymMs.toFixed(3)} unit="ms" />
        <MetricRow label="Preamble time" value={results.preambleMs.toFixed(3)} unit="ms" />
        <MetricRow label="Payload symbols" value={String(results.payloadSymbNb)} unit="symb" />
        <MetricRow label="Payload time" value={results.payloadPartMs.toFixed(3)} unit="ms" />
        {params.lbtEnabled && (
          <MetricRow label="Задержка LBT (не ToA)" value={results.lbtOverheadMs.toFixed(3)} unit="ms" />
        )}
        <MetricRow label="Полный цикл" value={((results.cycleTimeMs + results.lbtOverheadMs) / 1000).toFixed(3)} unit="s" />
      </div>

      {/* Канал */}
      <div className="space-y-2.5 border-t border-slate-100 pt-4 mt-4">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Канал</div>
        <MetricRow label="Data rate (Rb)" value={rate} unit="" />
        <MetricRow label="Overhead преамбулы" value={preambleOverhead} unit="%" />
        <MetricRow label="LDRO (опт. низк. скор.)" value={results.ldro ? 'Вкл' : 'Выкл'} unit="" />
      </div>

      {/* Config footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
        <div><strong className="text-slate-700">Payload:</strong> {totalPayload} байт</div>
        <div>SF={params.sf}, BW={params.bw} kHz, CR=4/{params.cr + 4}</div>
        <div>Explicit={params.explicitHeader ? 'Да' : 'Нет'}, CRC={params.crc ? 'Да' : 'Нет'}</div>
        <div className="mt-2 text-emerald-600 font-medium">Пропускная способность: ~{results.maxPerHour} пак/час</div>
      </div>
    </div>
  );
}
