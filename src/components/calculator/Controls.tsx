import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoRaParams } from '@/types';
import { NumberInput } from '../ui/NumberInput';

interface ControlsProps {
  params: LoRaParams;
  updateParam: <K extends keyof LoRaParams>(key: K, value: LoRaParams[K]) => void;
}

export function Controls({ params, updateParam }: ControlsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h2 className="text-slate-900 font-semibold text-lg">Параметры радио (P2P)</h2>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
        {/* SF */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-700 font-medium text-sm">Spreading Factor (SF)</label>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100">
            <input 
              type="range" min="6" max="12" step="1" 
              value={params.sf} onChange={(e) => updateParam('sf', Number(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-center mt-3">
              <span className="inline-block bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                SF{params.sf}
              </span>
            </div>
          </div>
        </div>

        {/* BW */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-slate-700 font-medium text-sm">Bandwidth (kHz)</label>
          </div>
          <NumberInput
            value={params.bw}
            onChange={(v) => updateParam('bw', v)}
            min={7.8}
            max={500}
            step={0.1}
            className="font-mono"
          />
          <div className="grid grid-cols-3 gap-2 mt-3">
             {[125, 250, 500].map(val => (
               <button
                 key={val}
                 onClick={() => updateParam('bw', val)}
                 className={cn(
                   "py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                   params.bw === val 
                    ? "bg-blue-100 text-blue-700 border border-blue-200" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                 )}
               >
                 {val}
               </button>
             ))}
          </div>
        </div>

        {/* Coding Rate */}
        <div className="sm:col-span-2">
          <label className="text-slate-700 font-medium text-sm block mb-2">Coding Rate (CR)</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((cr) => (
              <button
                key={cr}
                onClick={() => updateParam('cr', cr)}
                className={cn(
                  "py-2.5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-1.5",
                  params.cr === cr
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300 bg-white"
                )}
              >
                <span className={cn("font-bold text-sm", params.cr === cr ? "text-blue-700" : "text-slate-700")}>4/{cr + 4}</span>
                <span className="text-slate-400 text-[11px]">CR{cr}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preamble */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-slate-700 font-medium text-sm">Преамбула (символы)</label>
          </div>
          <NumberInput
            value={params.preamble}
            onChange={(v) => updateParam('preamble', v)}
            min={4}
            max={65535}
            step={1}
          />
          <div className="text-slate-500 text-xs mt-2">Типично: 8 для LoRaWAN/P2P</div>
        </div>
      </div>

      {/* Additional Options */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h3 className="text-slate-900 font-medium mb-4">Настройки протокола</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
            <input
              type="checkbox"
              checked={params.explicitHeader}
              onChange={(e) => updateParam('explicitHeader', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 accent-blue-600"
            />
            <div>
              <div className="text-slate-900 font-medium text-sm">Explicit Header</div>
              <div className="text-slate-500 text-xs mt-0.5">Включить явный заголовок пакета</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
            <input
              type="checkbox"
              checked={params.crc}
              onChange={(e) => updateParam('crc', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 accent-blue-600"
            />
            <div>
              <div className="text-slate-900 font-medium text-sm">CRC Payload</div>
              <div className="text-slate-500 text-xs mt-0.5">Контрольная сумма пакета</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 sm:col-span-2">
            <input
              type="checkbox"
              checked={params.lbtEnabled}
              onChange={(e) => updateParam('lbtEnabled', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 accent-blue-600"
            />
            <div>
              <div className="text-slate-900 font-medium text-sm">LBT (CCA) — Listen Before Talk</div>
              <div className="text-slate-500 text-xs mt-0.5">Прослушивание канала перед передачей. Не входит в ToA — это задержка доступа (RX).</div>
            </div>
          </label>

          {params.lbtEnabled && (
            <div className="sm:col-span-2 grid grid-cols-2 gap-4 pl-3 pr-3">
              <div>
                <label className="text-slate-700 font-medium text-sm block mb-1.5">Tcca (мс)</label>
                <NumberInput
                  value={params.lbtTccaMs}
                  onChange={(v) => updateParam('lbtTccaMs', v)}
                  min={0}
                  max={1000}
                  step={0.1}
                  className="font-mono text-sm"
                />
                <div className="text-slate-500 text-xs mt-1.5">Время проверки занятости канала</div>
              </div>
              <div>
                <label className="text-slate-700 font-medium text-sm block mb-1.5">Tbo (мс)</label>
                <NumberInput
                  value={params.lbtTboMs}
                  onChange={(v) => updateParam('lbtTboMs', v)}
                  min={0}
                  max={1000}
                  step={0.1}
                  className="font-mono text-sm"
                />
                <div className="text-slate-500 text-xs mt-1.5">Окно backoff при занятом канале</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duty Cycle Limits */}
      <div className="mt-6 pt-6 border-t border-slate-100">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 font-medium">Ограничение Duty Cycle</h3>
            <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded text-sm">{params.dutyCycle}%</span>
         </div>
         <div className="grid grid-cols-3 gap-3">
          {[0.1, 1, 10].map((val) => (
            <button
              key={val}
              onClick={() => updateParam('dutyCycle', val)}
              className={cn(
                "p-2 rounded-xl border-2 transition-all duration-200 text-sm",
                params.dutyCycle === val
                  ? "border-blue-600 bg-blue-50 font-bold text-blue-700"
                  : "border-slate-200 hover:border-blue-300 bg-white text-slate-700 font-medium"
              )}
            >
              {val}%
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">1% — стандартное ограничение для диапазона 868 МГц в Европе / РФ.</p>
      </div>
    </div>
  );
}
