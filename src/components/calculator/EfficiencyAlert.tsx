import { AlertTriangle, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';
import { LoRaParams, LoRaResults } from '@/types';

interface EfficiencyAlertProps {
  params: LoRaParams;
  results: LoRaResults;
  chartData: any[];
}

export function EfficiencyAlert({ params, results, chartData }: EfficiencyAlertProps) {
  const preamblePercentage = (results.preambleMs / results.toaMs) * 100;
  // If overhead is more than 40% of the packet, we consider it inefficient
  const isInefficient = preamblePercentage > 40;

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-lg">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        <div className="flex-1 space-y-5">
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase",
            isInefficient ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          )}>
            {isInefficient ? <AlertTriangle className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
            {isInefficient ? "Низкая эффективность" : "Оптимальная нагрузка"}
          </div>
          
          <h4 className="text-xl font-bold text-slate-900">
            {isInefficient ? "Слишком много служебных данных!" : "Хорошее соотношение данных"}
          </h4>
          
          <div className="text-sm text-slate-600 space-y-4 leading-relaxed">
            <p>
              Вы отправляете <strong className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{params.payload} байт</strong>. 
              Преамбула и заголовки занимают <strong className={cn("px-1.5 py-0.5 rounded", isInefficient ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900")}>{preamblePercentage.toFixed(1)}%</strong> эфирного времени.
            </p>
            {isInefficient && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="text-amber-900 font-medium mb-1">Совет для P2P протокола:</p>
                <p className="text-amber-800 text-sm">
                  Из-за ограничения Duty Cycle ({params.dutyCycle}%) после этого пакета модуль "заснёт" на <b>{(results.waitTimeMs / 1000).toFixed(2)}s</b>. 
                  Передача по 1-5 байт крайне невыгодна. Накапливайте данные в буфер и отправляйте их массивами по 20-50 байт за один раз.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/2 h-[260px] bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">
            Доля служебных данных (%) от размера Payload
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="payload" 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
                tickFormatter={(val) => `${val}B`}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                formatter={(value: number, name: string) => [
                  name === 'overheadPercent' ? `${value}%` : `${value} ms`, 
                  name === 'overheadPercent' ? 'Доля Overhead' : 'Time on Air'
                ]}
                labelFormatter={(label) => `Payload: ${label} Bytes`}
              />
              <ReferenceLine 
                x={params.payload} 
                stroke={isInefficient ? "#d97706" : "#059669"} 
                strokeDasharray="4 4" 
                label={{ position: 'top', value: 'Текущий выбор', fill: isInefficient ? "#d97706" : "#059669", fontSize: 10, fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="overheadPercent" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
