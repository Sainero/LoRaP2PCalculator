import { useState, useMemo } from "react";
import { Network, ChevronDown } from "lucide-react";
import { LoRaParams, LoRaResults, DeviceProfile } from "@/types";
import { calculateToA } from "@/utils/lora";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface NetworkCapacityProps {
  params: LoRaParams;
  results: LoRaResults;
  devices: DeviceProfile[];
}

function StatMini({ label, value, unit, tone = 'default' }: { label: string; value: string; unit: string; tone?: 'default' | 'ok' | 'warn' | 'bad' }) {
  const valueColor = tone === 'ok' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : tone === 'bad' ? 'text-rose-600' : 'text-slate-900';
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1 truncate">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={cn('font-mono font-semibold tabular-nums text-lg', valueColor)}>{value}</span>
        <span className="text-[11px] text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

export function NetworkCapacity({ params, results, devices }: NetworkCapacityProps) {
  // Параметры event-модели ёмкости (прямая постановка)
  const [nodesInRange, setNodesInRange] = useState(5);                     // Узлов в зоне одного канала
  const [sessionsPerHourPerNode, setSessionsPerHourPerNode] = useState(1); // Сеансов/час на узел
  const [numChannels, setNumChannels] = useState(1);                       // Для P2P по умолчанию 1 канал
  const [confirmedMode, setConfirmedMode] = useState(true);
  const [open, setOpen] = useState(false);                                 // Свёрнуто по умолчанию — справочный расчёт
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Базовые параметры: из выбранного профиля устройства или из редактора
  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const baseParams = selectedDevice?.params ?? params;
  const baseName = selectedDevice?.name ?? 'Редактор';

  const baseToaMs = useMemo(() => {
    const totalPayload = baseParams.payload + (baseParams.customBlocks?.reduce((acc, b) => acc + b.bytes, 0) || 0);
    return calculateToA(baseParams.sf, baseParams.bw * 1000, totalPayload, baseParams.cr, baseParams.preamble, baseParams.explicitHeader, baseParams.crc).toa * 1000;
  }, [baseParams]);

  const toaUL = baseToaMs / 1000;

  // Рассчитываем время ToA для ACK пакета (пусть это будет пустой пакет с 4 байтами payload)
  const ackToaMs = useMemo(() => {
    return calculateToA(baseParams.sf, baseParams.bw * 1000, 4, baseParams.cr, baseParams.preamble, baseParams.explicitHeader, baseParams.crc).toa;
  }, [baseParams.sf, baseParams.bw, baseParams.cr, baseParams.preamble, baseParams.explicitHeader, baseParams.crc]);
  const toaDL = ackToaMs;

  const calc = useMemo(() => {
    // Полное эфирное время одного сеанса (UL + ACK DL в режиме с подтверждением)
    const messageTime = confirmedMode ? toaUL + toaDL : toaUL;

    // Суммарный поток сеансов на канал
    const totalSessionsPerHour = nodesInRange * sessionsPerHourPerNode;
    const arrivalsPerSec = totalSessionsPerHour / 3600;

    // Нагрузка на канал (Erlang) — доля занятости эфира предлагаемым трафиком
    const G = numChannels > 0 ? (arrivalsPerSec * messageTime) / numChannels : 0;

    // Pure ALOHA: вероятность коллизии за уязвимый период 2·T
    const pCollision = 1 - Math.exp(-2 * G);

    // Успешные сеансы = предложенные · (1 − Pкол)
    const successfulPerHour = totalSessionsPerHour * Math.exp(-2 * G);

    // Теоретический предел канала ALOHA: S_max = 1/(2e) ≈ 0.184 при G = 0.5
    const channelLimitPerHour = messageTime > 0 ? (numChannels * 0.5 * Math.exp(-1) / messageTime) * 3600 : 0;

    // Предел по duty cycle для одного узла (учитывается только собственное излучение UL)
    const dcFraction = baseParams.dutyCycle / 100;
    const dcSessionsPerHourPerNode = toaUL > 0 ? (dcFraction * 3600) / toaUL : 0;

    return {
      messageTime,
      totalSessionsPerHour,
      G,
      pCollision,
      successfulPerHour,
      channelLimitPerHour,
      dcSessionsPerHourPerNode,
    };
  }, [toaUL, toaDL, confirmedMode, nodesInRange, sessionsPerHourPerNode, numChannels, baseParams.dutyCycle]);

  const pPct = calc.pCollision * 100;
  const collTone = pPct < 5 ? "ok" : pPct < 10 ? "warn" : "bad";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Заголовок-кнопка со сводкой */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex-shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Обобщённая оценка ёмкости (ALOHA)
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">справочно</span>
            </div>
            <div className="text-xs text-slate-500 font-mono truncate mt-0.5">
              {baseName} · SF{baseParams.sf} · {nodesInRange} узл. · {sessionsPerHourPerNode} сеанс/ч · {confirmedMode ? "UL+ACK" : "UL"} · {numChannels} кан.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-end leading-none">
            <span className={cn("text-lg font-mono font-semibold tabular-nums", collTone === "ok" ? "text-emerald-600" : collTone === "warn" ? "text-amber-600" : "text-rose-600")}>{pPct.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400 mt-0.5">вер. коллизии</span>
          </div>
          <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-6">
          {/* Компактные контролы */}
          <div className="space-y-5 mt-4">
            {devices.length > 0 && (
              <div>
                <label className="text-slate-700 font-medium text-sm block mb-2">Базовый профиль устройства</label>
                <CustomSelect
                  value={selectedDeviceId}
                  onChange={setSelectedDeviceId}
                  options={[
                    { value: "", label: "Из редактора (текущие параметры)" },
                    ...devices.map((d) => ({ value: d.id, label: `${d.name} — SF${d.params.sf}, ${d.params.bw}kHz, DC${d.params.dutyCycle}%` })),
                  ]}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1.5">ToA и Duty Cycle берутся из профиля. Все N узлов используют параметры выбранного устройства.</p>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-700 font-medium text-sm">Узлов в зоне канала</label>
                <span className="font-mono text-blue-600 bg-blue-50 px-2 rounded font-bold text-sm">{nodesInRange}</span>
              </div>
              <input
                type="range" min="1" max="200" step="1"
                value={nodesInRange}
                onChange={(e) => setNodesInRange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-slate-500 mt-1.5">Конкурентный доступ без координатора на одном канале.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 font-medium text-sm block mb-2">Сеансов в час на узел</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-slate-900 font-mono text-sm"
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={sessionsPerHourPerNode}
                  onChange={(e) => setSessionsPerHourPerNode(Math.max(0.1, Number(e.target.value)))}
                />
                <p className="text-xs text-slate-500 mt-1.5">Интервал: <span className="font-mono text-blue-600">{(60 / sessionsPerHourPerNode).toFixed(1)}</span> мин.</p>
              </div>
              <div>
                <label className="text-slate-700 font-medium text-sm block mb-2">Количество каналов (частот)</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-slate-900 font-mono text-sm"
                  type="number"
                  min={1}
                  max={64}
                  value={numChannels}
                  onChange={(e) => setNumChannels(Math.max(1, Math.min(64, Number(e.target.value))))}
                />
                <p className="text-xs text-slate-500 mt-1.5">Для P2P обычно 1 канал.</p>
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-medium text-sm block mb-2">Протокол сеанса</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmedMode(true)}
                  className={cn("py-2.5 px-3 rounded-xl border-2 transition-all text-sm font-medium", confirmedMode ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-blue-300 bg-white text-slate-700")}
                >
                  Запрос - Ответ (UL + ACK)
                </button>
                <button
                  onClick={() => setConfirmedMode(false)}
                  className={cn("py-2.5 px-3 rounded-xl border-2 transition-all text-sm font-medium", !confirmedMode ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-blue-300 bg-white text-slate-700")}
                >
                  Односторонне (только UL)
                </button>
              </div>
            </div>
          </div>

          {/* Мини-статистика */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatMini label="Вероятность коллизии" value={pPct.toFixed(2)} unit="%" tone={collTone as 'ok' | 'warn' | 'bad'} />
            <StatMini label="Нагрузка (Erlang)" value={calc.G.toFixed(4)} unit="E" />
            <StatMini label="Предложено сеансов" value={calc.totalSessionsPerHour.toFixed(0)} unit="/ч" />
            <StatMini label="Успешных сеансов" value={calc.successfulPerHour.toFixed(0)} unit="/ч" />
          </div>

          {/* Пределы + короткая заметка */}
          <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono">
              <span>Предел канала ALOHA: <strong className="text-slate-700">{calc.channelLimitPerHour.toFixed(0)}</strong> сеанс/ч</span>
              <span>DC на узел: <strong className="text-slate-700">{calc.dcSessionsPerHourPerNode.toFixed(0)}</strong> сеанс/ч</span>
              <span>Время сеанса: <strong className="text-slate-700">{(calc.messageTime * 1000).toFixed(1)}</strong> мс (UL {(toaUL * 1000).toFixed(1)}{confirmedMode ? ` + ACK ${(toaDL * 1000).toFixed(1)}` : ""} мс)</span>
            </div>
            <p className="leading-relaxed pt-1.5 max-w-3xl">
              Чистая модель <strong>ALOHA</strong>: нагрузка <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">G = λ·T</code>, вероятность коллизии <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">P = 1 − e⁻²ᴳ</code>. Держите &lt; 5%. Для конкретного сценария обмена смотрите циклограмму выше; <strong>LBT</strong> на практике снижает коллизии.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
