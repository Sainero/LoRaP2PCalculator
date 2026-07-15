import { useState, useMemo } from 'react';
import { Gauge, ChevronDown, Calculator } from 'lucide-react';
import { DeviceProfile } from '@/types';
import { calculateToA } from '@/utils/lora';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NumberInput } from '@/components/ui/NumberInput';

interface DcCapacityPanelProps {
  devices: DeviceProfile[];
}

function deviceToaMs(dev: DeviceProfile): number {
  const totalPayload = dev.params.payload + (dev.params.customBlocks?.reduce((acc, b) => acc + b.bytes, 0) || 0);
  return calculateToA(dev.params.sf, dev.params.bw * 1000, totalPayload, dev.params.cr, dev.params.preamble, dev.params.explicitHeader, dev.params.crc).toa * 1000;
}

export function DcCapacityPanel({ devices }: DcCapacityPanelProps) {
  const [open, setOpen] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [messagesPerDay, setMessagesPerDay] = useState(24);

  const dev = devices.find((d) => d.id === selectedId) ?? devices[0];

  const calc = useMemo(() => {
    if (!dev) return null;
    const toaMs = deviceToaMs(dev);
    const dcFraction = dev.params.dutyCycle / 100;
    const airtimeBudgetSec = dcFraction * 3600;
    const maxTxPerHour = toaMs > 0 ? Math.floor((dcFraction * 3600_000) / toaMs) : 0;
    const maxTxPerDay = maxTxPerHour * 24;
    const intervalSec = maxTxPerHour > 0 ? 3600 / maxTxPerHour : 0;
    const fits = messagesPerDay <= maxTxPerDay;
    const actualDc = messagesPerDay > 0 ? (messagesPerDay * toaMs) / 86400_000 * 100 : 0;

    return { toaMs, dcFraction, airtimeBudgetSec, maxTxPerHour, maxTxPerDay, intervalSec, fits, actualDc };
  }, [dev, messagesPerDay]);

  if (devices.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Ёмкость по Duty Cycle</div>
            <div className="text-xs text-slate-500 truncate mt-0.5">Макс. передач в час/сутки для одного устройства</div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {calc && (
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-lg font-mono font-semibold tabular-nums text-slate-900">{calc.maxTxPerHour}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">макс. TX/час</span>
            </div>
          )}
          <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && calc && dev && (
        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-100 space-y-4">
          {/* Контролы в одну строку */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px] flex-1">
              <label className="text-xs text-slate-500 font-medium block mb-1.5">Профиль устройства</label>
              <CustomSelect
                value={dev.id}
                onChange={setSelectedId}
                options={devices.map((d) => ({ value: d.id, label: `${d.name} — SF${d.params.sf}, DC${d.params.dutyCycle}%` }))}
                className="w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 font-medium block mb-1.5">Сообщений/сутки</label>
              <NumberInput
                value={messagesPerDay}
                onChange={setMessagesPerDay}
                min={1}
                max={1440}
                step={1}
                className="font-mono text-sm w-28"
              />
            </div>
          </div>

          {/* Главный результат — большое число */}
          <div className="flex items-stretch gap-3">
            <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-0.5">Макс. передач в час</div>
                <div className="font-mono font-bold tabular-nums text-2xl text-slate-900">{calc.maxTxPerHour}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-0.5">в сутки</div>
                <div className="font-mono font-semibold tabular-nums text-lg text-slate-600">{calc.maxTxPerDay}</div>
              </div>
            </div>
            <div className={cn("rounded-xl border px-4 py-3 flex items-center", calc.fits ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100")}>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-0.5">Запрошено</div>
                <div className={cn("font-mono font-bold tabular-nums text-2xl", calc.fits ? "text-emerald-700" : "text-rose-700")}>{messagesPerDay}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">/сутки</div>
              </div>
            </div>
          </div>

          {/* Параметры устройства — компактно */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2.5 font-mono">
            <span>ToA: <strong className="text-slate-800">{calc.toaMs.toFixed(0)} мс</strong></span>
            <span>DC: <strong className="text-slate-800">{dev.params.dutyCycle}%</strong></span>
            <span>Бюджет: <strong className="text-slate-800">{calc.airtimeBudgetSec.toFixed(1)} с/час</strong></span>
            <span>Интервал: <strong className="text-slate-800">{calc.intervalSec > 0 ? `${calc.intervalSec.toFixed(0)} с` : '—'}</strong></span>
            <span>Фактич. DC: <strong className={cn(calc.fits ? "text-emerald-700" : "text-rose-700")}>{calc.actualDc.toFixed(2)}%</strong></span>
          </div>

          {/* Статус */}
          <div className={cn("rounded-lg px-4 py-2.5 text-sm font-medium", calc.fits ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
            {calc.fits
              ? `${messagesPerDay} сообщ./сутки — укладывается в DC лимит (${calc.maxTxPerDay} макс.)`
              : `${messagesPerDay} сообщ./сутки — превышает DC лимит (${calc.maxTxPerDay} макс.)`
            }
          </div>

          {/* Формулы */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <button
              onClick={() => setShowFormulas((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Формулы</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showFormulas && "rotate-180")} />
            </button>
            {showFormulas && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-slate-700 mb-1">Макс. передач в час</div>
                  <div className="bg-slate-100 rounded p-2 mb-1.5">
                    <code className="text-slate-800">N = (DC% × 3600000) / ToA</code>
                  </div>
                  <div className="bg-slate-100 rounded p-2">
                    <code className="text-blue-700">N = ({dev.params.dutyCycle}% × 3600000) / {calc.toaMs.toFixed(0)} = {calc.maxTxPerHour} TX/час</code>
                  </div>
                </div>
                <div className="bg-pink-50 rounded-lg p-3">
                  <div className="text-slate-700 mb-1">Макс. передач в сутки</div>
                  <div className="bg-slate-100 rounded p-2 mb-1.5">
                    <code className="text-slate-800">N_сутки = N × 24</code>
                  </div>
                  <div className="bg-slate-100 rounded p-2">
                    <code className="text-pink-700">N = {calc.maxTxPerHour} × 24 = {calc.maxTxPerDay} TX/сутки</code>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-slate-700 mb-1">Фактический DC при запрошенной нагрузке</div>
                  <div className="bg-slate-100 rounded p-2">
                    <code className="text-slate-700">DC_факт = ({messagesPerDay} × {calc.toaMs.toFixed(0)}) / 86400000 × 100 = {calc.actualDc.toFixed(2)}%</code>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Расчёт по регуляторному DC для одного устройства. Для оценки коллизий при N независимых узлов см. панель ALOHA ниже.
          </p>
        </div>
      )}
    </div>
  );
}
