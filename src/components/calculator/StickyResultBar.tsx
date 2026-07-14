import { Copy, Check, Zap } from 'lucide-react';
import { LoRaResults, LoRaParams } from '@/types';
import { useState } from 'react';

interface StickyResultBarProps {
  results: LoRaResults;
  params: LoRaParams;
}

function Kpi({ label, value, unit, tone = 'default' }: { label: string; value: string; unit: string; tone?: 'default' | 'primary' | 'accent' }) {
  const valueColor =
    tone === 'accent' ? 'text-amber-300' : 'text-white';
  return (
    <div className="flex flex-col leading-none">
      <span className="text-[10px] uppercase tracking-wider text-white/70 font-medium mb-1">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`font-mono font-semibold tabular-nums ${tone === 'primary' ? 'text-2xl' : 'text-lg'} ${valueColor}`}>{value}</span>
        <span className="text-[11px] text-white/60">{unit}</span>
      </span>
    </div>
  );
}

function fmtRate(bps: number): { value: string; unit: string } {
  if (bps >= 1000) return { value: (bps / 1000).toFixed(2), unit: 'кбит/с' };
  return { value: bps.toFixed(0), unit: 'бит/с' };
}

export function StickyResultBar({ results, params }: StickyResultBarProps) {
  const [copied, setCopied] = useState(false);
  const totalPayload = params.payload + (params.customBlocks?.reduce((acc, b) => acc + b.bytes, 0) || 0);
  const rate = fmtRate(results.bitRate);

  const handleCopy = () => {
    const text = `LoRa P2P ToA: ${results.toaMs.toFixed(3)} ms\nSF${params.sf} BW${params.bw}kHz CR4/${params.cr + 4}\nPayload: ${totalPayload}B\n~${results.maxPerHour} pkt/h`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="md:sticky md:top-4 md:z-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-600/20 border border-blue-500/30 text-white px-3 sm:px-6 py-3 sm:py-3.5">
      <div className="flex items-center gap-3 sm:gap-6 sm:flex-wrap sm:justify-between">
        {/* Left: label + config summary */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white/15 rounded-lg flex-shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="text-[11px] uppercase tracking-wider text-white/90 font-semibold">Результат</div>
            <div className="text-xs text-white/70 font-mono truncate">
              SF{params.sf} · {params.bw} kHz · 4/{params.cr + 4} · {totalPayload} B
            </div>
          </div>
        </div>

        {/* Right: KPIs + copy — horizontally scrollable on mobile */}
        <div className="flex items-center gap-4 sm:gap-6 sm:gap-x-8 overflow-x-auto scrollbar-none flex-1 sm:flex-none">
          <Kpi label="Time on Air" value={results.toaMs.toFixed(1)} unit="мс" tone="primary" />
          <Kpi label="Битрейт" value={rate.value} unit={rate.unit} />
          {params.dutyCycle < 100 && (
            <Kpi label={`Пауза DC ${params.dutyCycle}%`} value={(results.waitTimeMs / 1000).toFixed(2)} unit="с" tone="accent" />
          )}
          {params.lbtEnabled && (
            <Kpi label="Задержка LBT" value={results.lbtOverheadMs.toFixed(1)} unit="мс" tone="accent" />
          )}
          <Kpi label="Полный цикл" value={((results.cycleTimeMs + results.lbtOverheadMs) / 1000).toFixed(2)} unit="с" />
          <Kpi label="Пропускная" value={`~${results.maxPerHour}`} unit="пак/ч" />
          <button
            onClick={handleCopy}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10 flex-shrink-0"
            title="Скопировать результат"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
