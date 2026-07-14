import React, { useState } from 'react';
import { Settings, Plus, X } from 'lucide-react';
import { LoRaParams, CustomBlock } from '@/types';

interface PacketStructureProps {
  params: LoRaParams;
  updateParam: <K extends keyof LoRaParams>(key: K, value: LoRaParams[K]) => void;
}

export function PacketStructure({ params, updateParam }: PacketStructureProps) {
  const [newBlockLabel, setNewBlockLabel] = useState("");
  const [newBlockBytes, setNewBlockBytes] = useState(1);

  const addBlock = () => {
    if (!newBlockLabel || newBlockBytes <= 0) return;
    const newBlock: CustomBlock = {
      id: Math.random().toString(36).substring(7),
      label: newBlockLabel,
      bytes: newBlockBytes
    };
    updateParam('customBlocks', [...params.customBlocks, newBlock]);
    setNewBlockLabel("");
    setNewBlockBytes(1);
  };

  const removeBlock = (id: string) => {
    updateParam('customBlocks', params.customBlocks.filter(b => b.id !== id));
  };

  const totalPayloadBytes = params.payload + params.customBlocks.reduce((acc, b) => acc + b.bytes, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="text-slate-900 font-semibold">Структура пакета</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Visualizer */}
        <div className="space-y-5">
          {/* Physical Layer */}
          <div>
            <div className="text-xs text-slate-500 mb-2 font-medium">Physical Layer</div>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-2 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 shadow-sm text-sm">
                Preamble ({params.preamble} sym)
              </div>
              {params.explicitHeader ? (
                <div className="px-3 py-2 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 shadow-sm text-sm">
                  PHDR + PHDR_CRC (20 bits)
                </div>
              ) : (
                <div className="px-3 py-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 shadow-sm text-sm">
                  Implicit header
                </div>
              )}
              <div className="px-3 py-2 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 shadow-sm text-sm font-medium">
                PHY Payload ({totalPayloadBytes} B)
              </div>
              {params.crc && (
                <div className="px-3 py-2 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 shadow-sm text-sm">
                  CRC (2 B)
                </div>
              )}
            </div>
          </div>

          {/* PHY Payload Contents (MAC/App Equivalent) */}
          <div>
            <div className="text-xs text-slate-500 mb-2 font-medium">PHY Payload Contents</div>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shadow-sm text-sm flex items-center">
                User data ({params.payload} B)
              </div>
              {params.customBlocks.map(block => (
                <div key={block.id} className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm text-sm flex items-center gap-2 group">
                  <span>{block.label} ({block.bytes} B)</span>
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="text-indigo-400 hover:text-indigo-700 transition-colors"
                    title="Удалить блок"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              В LoRa P2P вы сами определяете формат PHY Payload. Например, можно добавить байты для адреса отправителя, получателя и типа сообщения.
            </div>
          </div>
        </div>

        {/* Payload Builder UI */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
           <div className="text-sm font-semibold text-slate-800 mb-3">Управление Payload</div>
           
           <div className="space-y-3">
             <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
               <span className="text-slate-700 font-medium text-sm">Базовая нагрузка (User data)</span>
               <div className="flex items-center gap-2">
                 <input
                   className="w-24 px-3 py-1.5 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-slate-900 text-sm"
                   type="number"
                   min={1}
                   max={255}
                   value={params.payload}
                   onChange={(e) => updateParam('payload', Math.max(1, Math.min(255, Number(e.target.value))))}
                 />
                 <span className="text-slate-500 text-xs w-4">B</span>
               </div>
             </div>

             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
               <input
                 type="text"
                 placeholder="Название нового блока (напр. Sender ID)"
                 value={newBlockLabel}
                 onChange={e => setNewBlockLabel(e.target.value)}
                 className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none text-sm bg-white shadow-sm"
               />
               <div className="flex gap-3">
                 <input
                   type="number"
                   min={1}
                   max={255}
                   value={newBlockBytes}
                   onChange={e => setNewBlockBytes(Math.max(1, Math.min(255, Number(e.target.value))))}
                   className="w-24 px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none text-sm bg-white shadow-sm"
                 />
                 <button
                   onClick={addBlock}
                   disabled={!newBlockLabel}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm font-medium text-sm flex items-center gap-2"
                 >
                   <Plus className="w-4 h-4" />
                   Добавить
                 </button>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
