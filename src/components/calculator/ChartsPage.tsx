import { useMemo, useState, type ReactNode } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { BarChart3, Info } from 'lucide-react';
import { LoRaParams, DeviceProfile } from '@/types';
import { calculateToA } from '@/utils/lora';
import { cn } from '@/lib/utils';
import { NumberInput } from '@/components/ui/NumberInput';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface ChartsPageProps {
  params: LoRaParams;
  devices: DeviceProfile[];
  theme: 'light' | 'dark';
}

const SF_RANGE = [7, 8, 9, 10, 11, 12];
const PAYLOAD_STEPS = [1, 5, 10, 20, 30, 50, 75, 100, 128, 150, 200, 255];

const SNR_MIN: Record<number, number> = {
  7: -7.5, 8: -10, 9: -12.5, 10: -15, 11: -17.5, 12: -20
};

interface EnvEntry {
  id: string;
  label: string;
  gamma: number;
  Menv: number;
  Renv: number;
  color: string;
}

const ENVIRONMENTS: EnvEntry[] = [
  { id: 'free', label: 'Св. пространство', gamma: 2.0, Menv: 12, Renv: 0, color: '#3b82f6' },
  { id: 'rural', label: 'Сельская', gamma: 2.5, Menv: 24, Renv: 1, color: '#10b981' },
  { id: 'suburban', label: 'Пригород', gamma: 3.0, Menv: 41, Renv: 2, color: '#f59e0b' },
  { id: 'urban', label: 'Город', gamma: 3.5, Menv: 58, Renv: 3, color: '#ef4444' },
  { id: 'indoor', label: 'Indoor', gamma: 4.5, Menv: 89, Renv: 4, color: '#a855f7' },
];

function totalPayload(p: LoRaParams): number {
  return p.payload + (p.customBlocks?.reduce((acc, b) => acc + b.bytes, 0) || 0);
}

function ChartCard({ title, subtitle, children, description }: { title: string; subtitle: string; children: ReactNode; description?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
      {description && (
        <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
          <p>{description}</p>
        </div>
      )}
    </div>
  );
}

export function ChartsPage({ params, devices, theme }: ChartsPageProps) {
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const axisStroke = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipStyle = { borderRadius: '12px', border: `1px solid ${tooltipBorder}`, backgroundColor: tooltipBg, color: isDark ? '#e2e8f0' : '#0f172a' };
  const cursorFill = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)';

  const basePayload = totalPayload(params);
  const bwHz = params.bw * 1000;
  const crLabel = `4/${params.cr + 4}`;
  const [frequency, setFrequency] = useState(868);
  const FREQ_OPTIONS = [433, 470, 868, 915];
  const [txPower, setTxPower] = useState(14);
  const [gtx, setGtx] = useState(3);
  const [height, setHeight] = useState(2);
  const [envId, setEnvId] = useState('urban');

  // 1. ToA vs SF — для текущего payload и BW
  const toaVsSfData = useMemo(() => {
    return SF_RANGE.map((sf) => {
      const toa = calculateToA(sf, bwHz, basePayload, params.cr, params.preamble, params.explicitHeader, params.crc).toa * 1000;
      return { sf: `SF${sf}`, toa: Math.round(toa) };
    });
  }, [bwHz, basePayload, params.cr, params.preamble, params.explicitHeader, params.crc]);

  // 2. ToA vs Payload — для текущего SF и BW
  const toaVsPayloadData = useMemo(() => {
    return PAYLOAD_STEPS.map((pl) => {
      const toa = calculateToA(params.sf, bwHz, pl, params.cr, params.preamble, params.explicitHeader, params.crc).toa * 1000;
      return { payload: pl, toa: Math.round(toa) };
    });
  }, [params.sf, bwHz, params.cr, params.preamble, params.explicitHeader, params.crc]);

  // 3. TX/час vs SF — для текущего payload, BW и DC
  const txPerHourVsSfData = useMemo(() => {
    return SF_RANGE.map((sf) => {
      const toa = calculateToA(sf, bwHz, basePayload, params.cr, params.preamble, params.explicitHeader, params.crc).toa * 1000;
      const dcFraction = params.dutyCycle / 100;
      const maxTx = toa > 0 ? Math.floor((dcFraction * 3600_000) / toa) : 0;
      return { sf: `SF${sf}`, toa: Math.round(toa), maxTx };
    });
  }, [bwHz, basePayload, params.cr, params.preamble, params.explicitHeader, params.crc, params.dutyCycle]);

  // 4. Сравнение профилей — ToA всех устройств
  const profileComparisonData = useMemo(() => {
    return devices.map((d) => {
      const pl = totalPayload(d.params);
      const toa = calculateToA(d.params.sf, d.params.bw * 1000, pl, d.params.cr, d.params.preamble, d.params.explicitHeader, d.params.crc).toa * 1000;
      const dcFraction = d.params.dutyCycle / 100;
      const maxTx = toa > 0 ? Math.floor((dcFraction * 3600_000) / toa) : 0;
      return { name: d.name, toa: Math.round(toa), maxTx, sf: `SF${d.params.sf}` };
    });
  }, [devices]);

  // 5. Link budget / дальность — по модели LoRa калькулятора
  // S = -174 + 10·log10(BW_Hz) + NF + SNRmin(SF)
  // LB = TX + Gtx + Grx − S
  // Meff = max(0, Menv − Renv · max(0, SF − 7))
  // Rkm = 10^((LB − Meff − 32.44 − 20·log10(f_MHz)) / (20·γ))
  // Rfinal = Rkm · (1 + log10(h) / 10)
  const NF = 6;
  const GRX = 2;
  const IMPL_LOSS = 6; // implementation loss: PCB traces, matching network, connectors (3 TX + 3 RX)

  const linkBudgetData = useMemo(() => {
    const fMHz = frequency;
    const hFactor = 1 + Math.log10(Math.max(1, height)) / 10;
    return SF_RANGE.map((sf) => {
      const snrMin = SNR_MIN[sf] ?? -15;
      const sensitivity = -174 + 10 * Math.log10(bwHz) + NF + snrMin;
      const lb = txPower + gtx + GRX - sensitivity - IMPL_LOSS;
      const distances: Record<string, number> = {};
      ENVIRONMENTS.forEach((env) => {
        const meff = Math.max(0, env.Menv - env.Renv * Math.max(0, sf - 7));
        const exponent = (lb - meff - 32.44 - 20 * Math.log10(fMHz)) / (20 * env.gamma);
        const rkm = Math.pow(10, exponent);
        distances[env.id] = Math.max(0, Math.round(rkm * hFactor * 100) / 100);
      });
      return {
        sf: `SF${sf}`,
        sensitivity: Math.round(sensitivity * 10) / 10,
        linkBudget: Math.round(lb * 10) / 10,
        ...distances,
      };
    });
  }, [bwHz, frequency, txPower, gtx, height]);

  const selectedEnv = ENVIRONMENTS.find((e) => e.id === envId) ?? ENVIRONMENTS[3];

  const currentSfToa = toaVsSfData.find((d) => d.sf === `SF${params.sf}`)?.toa ?? 0;
  const sf12Toa = toaVsSfData[5]?.toa ?? 1;
  const sf7Toa = toaVsSfData[0]?.toa ?? 1;
  const sfRatio = (sf12Toa / (sf7Toa || 1)).toFixed(1);
  const currentVsSf7 = (currentSfToa / (sf7Toa || 1)).toFixed(1);
  const currentVsSf12 = (sf12Toa / (currentSfToa || 1)).toFixed(1);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Графики</h2>
          <p className="text-sm text-slate-500">Визуализация зависимости ToA, ёмкости и дальности от параметров LoRa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. ToA vs SF */}
        <ChartCard
          title="Time on Air vs Spreading Factor"
          subtitle={`Payload ${basePayload} байт · BW ${params.bw} кГц · CR ${crLabel}`}
          description="Каждый шаг SF удваивает длительность символа (2^SF / BW), поэтому ToA растёт экспоненциально. SF7 → SF12 — примерно 8× длиннее. Это ключевой компромисс: выше SF = дальше и надёжнее, но дольше передача и больше расход DC."
        >
          <ResponsiveContainer key={theme} width="100%" height={260}>
            <BarChart data={toaVsSfData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="sf" tick={{ fill: axisStroke, fontSize: 12 }} stroke={axisStroke} />
              <YAxis tick={{ fill: axisStroke, fontSize: 11 }} stroke={axisStroke} label={{ value: 'мс', angle: -90, position: 'insideLeft', fill: axisStroke, fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} formatter={(v: number) => [`${v} мс`, 'ToA']} />
              <ReferenceLine x={`SF${params.sf}`} stroke="#6366f1" strokeWidth={2} label={{ value: 'текущий', fill: '#6366f1', fontSize: 10, position: 'top' }} />
              <Bar dataKey="toa" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. ToA vs Payload */}
        <ChartCard
          title="Time on Air vs Payload"
          subtitle={`SF${params.sf} · BW ${params.bw} кГц · CR ${crLabel}`}
          description="Зависимость ступенчатая: количество символов payload растёт кратно (SF − 2) из-за кодирования FEC. При SF12 добавление каждых ~16 байт удлиняет ToA на ~1 с. В P2P весь FIFO (255 байт) доступен, но при высоком SF большой payload быстро исчерпает DC-лимит."
        >
          <ResponsiveContainer key={theme} width="100%" height={260}>
            <LineChart data={toaVsPayloadData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="payload" tick={{ fill: axisStroke, fontSize: 11 }} stroke={axisStroke} label={{ value: 'байт', position: 'insideBottom', offset: -5, fill: axisStroke, fontSize: 11 }} />
              <YAxis tick={{ fill: axisStroke, fontSize: 11 }} stroke={axisStroke} label={{ value: 'мс', angle: -90, position: 'insideLeft', fill: axisStroke, fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} мс`, 'ToA']} labelFormatter={(l) => `${l} байт`} />
              <ReferenceLine x={basePayload} stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" label={{ value: `${basePayload} байт`, fill: '#6366f1', fontSize: 10, position: 'top' }} />
              <Line type="monotone" dataKey="toa" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. TX/час vs SF */}
        <ChartCard
          title="Макс. передач в час vs Spreading Factor"
          subtitle={`Payload ${basePayload} байт · DC ${params.dutyCycle}% · BW ${params.bw} кГц`}
          description="N = (DC% × 3600 с) / ToA. При DC 1% и SF12 — всего ~4–5 передач в час, при SF7 — десятки. Каждый шаг SF примерно вдвое сокращает ёмкость канала по DC — обратная сторона дальнобойности."
        >
          <ResponsiveContainer key={theme} width="100%" height={260}>
            <BarChart data={txPerHourVsSfData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="sf" tick={{ fill: axisStroke, fontSize: 12 }} stroke={axisStroke} />
              <YAxis tick={{ fill: axisStroke, fontSize: 11 }} stroke={axisStroke} label={{ value: 'TX/час', angle: -90, position: 'insideLeft', fill: axisStroke, fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} formatter={(v: number) => [`${v}`, 'TX/час']} />
              <ReferenceLine x={`SF${params.sf}`} stroke="#10b981" strokeWidth={2} label={{ value: 'текущий', fill: '#10b981', fontSize: 10, position: 'top' }} />
              <Bar dataKey="maxTx" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Сравнение профилей */}
        {profileComparisonData.length > 0 && (
          <ChartCard
            title="Сравнение профилей устройств"
            subtitle="ToA (мс, левая ось) и макс. TX/час (правая ось) для каждого сохранённого профиля"
            description="Устройство с наибольшим ToA — бутылочное горлышко по DC: оно сможет передавать реже остальных. Оптимизация: снизить SF, уменьшить payload или увеличить BW."
          >
            <ResponsiveContainer key={theme} width="100%" height={260}>
              <BarChart data={profileComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" tick={{ fill: axisStroke, fontSize: 10 }} stroke={axisStroke} angle={-15} textAnchor="end" height={50} />
                <YAxis yAxisId="left" tick={{ fill: axisStroke, fontSize: 11 }} stroke={axisStroke} label={{ value: 'ToA, мс', angle: -90, position: 'insideLeft', fill: axisStroke, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: axisStroke, fontSize: 11 }} stroke={axisStroke} label={{ value: 'TX/час', angle: 90, position: 'insideRight', fill: axisStroke, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} formatter={(v: number, name: string) => [name === 'toa' ? `${v} мс` : `${v}`, name === 'toa' ? 'ToA' : 'TX/час']} />
                <Bar yAxisId="left" dataKey="toa" fill="#6366f1" radius={[4, 4, 0, 0]} name="toa" />
                <Bar yAxisId="right" dataKey="maxTx" fill="#10b981" radius={[4, 4, 0, 0]} name="maxTx" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

      </div>

      {/* 5. Link Budget / дальность — full width */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Теоретическая дальность связи</h3>
          <p className="text-xs text-slate-500 mt-0.5">Link Budget по чувствительности SX1262</p>
        </div>

        {/* Контролы */}
        <div className="flex flex-wrap items-end gap-4 mb-5">
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1.5">Среда</label>
            <div className="flex gap-1.5 flex-wrap">
              {ENVIRONMENTS.map((env) => (
                <button
                  key={env.id}
                  onClick={() => setEnvId(env.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                    envId === env.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"
                  )}
                >
                  {env.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 font-medium block mb-1.5">Частота, МГц</label>
            <CustomSelect
              value={String(frequency)}
              onChange={(v) => setFrequency(Number(v))}
              options={FREQ_OPTIONS.map((f) => ({ value: String(f), label: String(f) }))}
              className="w-24"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 font-medium block mb-1.5">TX, dBm</label>
            <div className="w-20">
              <NumberInput
                value={txPower}
                onChange={setTxPower}
                min={0}
                max={22}
                step={1}
                className="font-mono text-xs px-2.5 py-1.5"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 font-medium block mb-1.5">Gtx, dBi</label>
            <div className="w-20">
              <NumberInput
                value={gtx}
                onChange={setGtx}
                min={0}
                max={10}
                step={1}
                className="font-mono text-xs px-2.5 py-1.5"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 font-medium block mb-1.5">Высота, м</label>
            <div className="w-20">
              <NumberInput
                value={height}
                onChange={setHeight}
                min={1}
                max={100}
                step={1}
                className="font-mono text-xs px-2.5 py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Группированный bar chart — все среды */}
        <ResponsiveContainer key={theme} width="100%" height={320}>
          <BarChart data={linkBudgetData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="sf" tick={{ fill: axisStroke, fontSize: 12 }} stroke={axisStroke} />
            <YAxis tick={{ fill: axisStroke, fontSize: 11 }} stroke={axisStroke} label={{ value: 'км', angle: -90, position: 'insideLeft', fill: axisStroke, fontSize: 11 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: cursorFill }}
              formatter={(v: number, name: string) => {
                const env = ENVIRONMENTS.find((e) => e.id === name);
                return [`${v} км`, env?.label ?? name];
              }}
            />
            <Legend content={({ payload }) => {
              if (!payload) return null;
              return (
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {ENVIRONMENTS.map((env) => {
                    const entry = (payload as Array<{ dataKey?: string }>).find((p) => p.dataKey === env.id);
                    if (!entry) return null;
                    return (
                      <div key={env.id} className="flex items-center gap-1.5 text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: env.color }} />
                        {env.label}
                      </div>
                    );
                  })}
                </div>
              );
            }} />
            <ReferenceLine x={`SF${params.sf}`} stroke="#6366f1" strokeWidth={2} label={{ value: 'текущий', fill: '#6366f1', fontSize: 10, position: 'top' }} />
            {ENVIRONMENTS.map((env) => (
              <Bar key={env.id} dataKey={env.id} fill={env.color} radius={[4, 4, 0, 0]} name={env.id} />
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Детализированная таблица для выбранной среды */}
        <div className="mt-5">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">
            {selectedEnv.label} (γ={selectedEnv.gamma}, Menv={selectedEnv.Menv} dB, Renv={selectedEnv.Renv} dB/шаг)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left py-2 px-3 font-medium">SF</th>
                  <th className="text-right py-2 px-3 font-medium">SNRmin, dB</th>
                  <th className="text-right py-2 px-3 font-medium">Чувств., dBm</th>
                  <th className="text-right py-2 px-3 font-medium">LB, dB</th>
                  <th className="text-right py-2 px-3 font-medium">Meff, dB</th>
                  <th className="text-right py-2 px-3 font-medium">Дальность, км</th>
                </tr>
              </thead>
              <tbody>
                {linkBudgetData.map((row) => {
                  const sfNum = parseInt(row.sf.slice(2));
                  const snrMin = SNR_MIN[sfNum] ?? -15;
                  const meff = Math.max(0, selectedEnv.Menv - selectedEnv.Renv * Math.max(0, sfNum - 7));
                  const dist = row[selectedEnv.id] as number;
                  return (
                    <tr key={row.sf} className={cn("border-b border-slate-100", row.sf === `SF${params.sf}` && "bg-blue-50")}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{row.sf}</td>
                      <td className="text-right py-2 px-3 text-slate-600">{snrMin}</td>
                      <td className="text-right py-2 px-3 text-slate-600">{row.sensitivity}</td>
                      <td className="text-right py-2 px-3 text-slate-600">{row.linkBudget}</td>
                      <td className="text-right py-2 px-3 text-slate-600">{Math.round(meff * 10) / 10}</td>
                      <td className="text-right py-2 px-3 font-semibold text-slate-900">{dist}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
          <p>
            Чувствительность: S = −174 + 10·log₁₀(BW) + NF + SNRmin(SF), где NF=6 dB (SX1262).
            Бюджет линка: LB = TX + Gtx + Grx − S − L_impl, где Grx=2 dB, L_impl=6 dB (потери на PCB, разъёмах, matching network).
            Дальность: R = 10^((LB − Meff − 32.44 − 20·log₁₀(f)) / (20·γ)) × (1 + log₁₀(h)/10).
            Meff = max(0, Menv − Renv·max(0, SF−7)) — запас среды уменьшается с ростом SF
            (обработка интерференции в чипе). Реальная дальность зависит от рельефа, препятствий и помех.
          </p>
        </div>
      </div>

      {/* Краткая сводка */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 font-mono">
        <div>
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Текущий ToA</span>
          <strong className="text-slate-900 text-sm">{currentSfToa} мс</strong>
        </div>
        <div>
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">SF7 → SF12</span>
          <strong className="text-slate-900 text-sm">×{sfRatio}</strong> длиннее
        </div>
        <div>
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Текущий vs SF7</span>
          <strong className="text-slate-900 text-sm">×{currentVsSf7}</strong> медленнее
        </div>
        <div>
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Текущий vs SF12</span>
          <strong className="text-slate-900 text-sm">×{currentVsSf12}</strong> быстрее
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
        Графики 1–4 рассчитываются по текущим параметрам редактора. ToA — по формуле Semtech (SX126x datasheet),
        TX/час — из регуляторного DC-лимита. График дальности использует модель бюджет линка с чувствительностью
        SX1262 (NF=6 dB) и лог-нормальное затухание для 5 типов среды. Измените параметры на вкладке
        «Калькулятор пакета» — графики 1–4 обновятся; параметры графика дальности настраиваются независимо.
      </p>
    </div>
  );
}
