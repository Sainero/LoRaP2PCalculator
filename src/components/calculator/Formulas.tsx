import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { LoRaParams, LoRaResults } from '@/types';

interface FormulasProps {
  params: LoRaParams;
  results: LoRaResults;
}

export function Formulas({ params, results }: FormulasProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const fmt = (val: number) => val.toFixed(6);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-slate-900 font-semibold text-lg">Подробный математический расчёт</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-6 font-mono text-sm">
          {/* Step 1 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="text-slate-700 font-sans font-medium mb-3">1. Время символа (Tsym)</div>
            <div className="bg-white rounded-lg p-3 mb-2 shadow-sm border border-slate-100">
              <span className="text-slate-600">T<sub>sym</sub> = 2<sup>SF</sup> / BW</span>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
              <span className="text-blue-700">T<sub>sym</sub> = 2<sup>{params.sf}</sup> / {params.bw * 1000} = {fmt(results.tSymMs / 1000)} s</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="text-slate-700 font-sans font-medium mb-3">2. Время преамбулы</div>
            <div className="bg-white rounded-lg p-3 mb-2 shadow-sm border border-slate-100">
              <span className="text-slate-600">T<sub>preamble</sub> = (N<sub>preamble</sub> + 4.25) × T<sub>sym</sub></span>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
              <span className="text-indigo-600">T<sub>preamble</sub> = ({params.preamble} + 4.25) × {fmt(results.tSymMs)} = {results.preambleMs.toFixed(3)} ms</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="text-slate-700 font-sans font-medium mb-3">3. Количество символов полезной нагрузки (N<sub>payload</sub>)</div>
            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm border border-slate-100 text-xs overflow-x-auto">
              <span className="text-slate-800 block whitespace-nowrap">
                8 + max(ceil[(8×PL - 4×SF + 28 + 16×CRC - 20×H) / 4(SF - 2×DE)] × (CR + 4), 0)
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 bg-white p-3 rounded-lg border border-slate-100">
              <div><span className="text-slate-500">PL:</span> {params.payload + (params.customBlocks?.reduce((acc, b) => acc + b.bytes, 0) || 0)} B</div>
              <div><span className="text-slate-500">SF:</span> {params.sf}</div>
              <div><span className="text-slate-500">CRC:</span> {results.crcVal}</div>
              <div><span className="text-slate-500">H (Header):</span> {results.ih}</div>
              <div><span className="text-slate-500">DE (LDRO):</span> {results.ldro}</div>
              <div><span className="text-slate-500">CR:</span> {params.cr}</div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
              <span className="text-teal-700 font-bold block mb-1">Итого символов:</span>
              <span className="text-teal-700 text-lg">{results.payloadSymbNb}</span>
            </div>
          </div>

          {/* Step 4 & 5 */}
          <div className="bg-blue-600 rounded-xl p-5 text-white shadow-md">
            <div className="font-sans font-medium mb-3 text-white/90">4. Итоговое время (ToA)</div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-2">
              <span className="text-white/80">T<sub>payload</sub> = N<sub>payload</sub> × T<sub>sym</sub> = {results.payloadSymbNb} × {fmt(results.tSymMs)} = {results.payloadPartMs.toFixed(3)} ms</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <span className="font-bold text-lg">ToA = T<sub>preamble</sub> + T<sub>payload</sub> = {results.toaMs.toFixed(3)} ms</span>
            </div>
          </div>

          {/* Источник формулы */}
          <div className="font-sans text-xs text-slate-500 pt-1">
            Источник формулы:{" "}
            <a
              href="https://www.semtech.com/uploads/documents/LoraDesignGuide_STD.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Semtech AN1200.13 — LoRa Modem Designer&apos;s Guide
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
