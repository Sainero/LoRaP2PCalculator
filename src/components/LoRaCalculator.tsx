import { useLoRaState } from '@/hooks/useLoRaState';
import { RadioTower, Network, Calculator, BookOpen, Globe, Menu, X, ChevronDown, Info } from 'lucide-react';
import { Controls } from './calculator/Controls';
import { PacketStructure } from './calculator/PacketStructure';
import { ResultSidebar } from './calculator/ResultSidebar';
import { StickyResultBar } from './calculator/StickyResultBar';
import { CyclogramVisualizer } from './calculator/CyclogramVisualizer';
import { EfficiencyAlert } from './calculator/EfficiencyAlert';
import { Formulas } from './calculator/Formulas';
import { DeviceProfilesPanel } from './calculator/DeviceProfilesPanel';
import { NetworkCapacity } from './calculator/NetworkCapacity';
import { useDeviceProfiles } from '@/hooks/useDeviceProfiles';
import { Glossary } from './calculator/Glossary';
import { RegionalParameters } from './calculator/RegionalParameters';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Tab = 'packet' | 'network' | 'glossary' | 'regional';

function NetworkGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">
              Как пользоваться вкладкой «Ёмкость сети»
            </div>
            <div className="text-xs text-slate-500 truncate mt-0.5">
              Режимы циклограммы, Duty Cycle, коллизии, профиль устройства
            </div>
          </div>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-4 text-sm text-slate-600 leading-relaxed">
          <div>
            <h4 className="font-semibold text-slate-800 mb-1.5">Циклограмма</h4>
            <p>
              Устройства берутся из сохранённых профилей на вкладке «Калькулятор пакета». Активное устройство
              выбирается в панели «Структура ToA». Добавляйте TX, RX, свободные паузы или готовый диалог
              «Запрос → Ответ».
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-1.5">Режимы</h4>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>
                <strong>Стандарт</strong> — после каждого TX вставляется пауза Duty Cycle (как в LoRaWAN).
                Диалог включает окно обработки 1 с (RX1) и остаток паузы DC. DC считается по окну сценария.
              </li>
              <li>
                <strong>Быстрый</strong> — TX подряд без пауз. Диалог «Запрос → Ответ» сразу TX → TX.
                Паузу на обработку можно добавить «Свободной паузой». DC считается по часовому окну:
                можно выжечь лимит за минуту, но потом молчать остаток часа. Панель показывает, сколько
                таких бёрстов уложится в лимит.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-1.5">Duty Cycle</h4>
            <p>
              Регуляторное ограничение EU868: ~1% эфирного времени на канал (≈ 36 сек TX в час). Прошивка
              донгла его не контролирует — это ответственность программы. В «Стандарте» пауза соблюдается
              на каждый пакет. В «Быстром» все TX подряд, панель показывает укладывается ли суммарный эфир
              в часовой лимит.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-1.5">Коллизии (ALOHA)</h4>
            <p>
              «Повторов/час» — сколько независимых пар устройств выполняют тот же сценарий одновременно.
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono"> G = (повторов/час) · T_эфир</code>,
              вероятность коллизии <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">P = 1 − e⁻²ᴳ</code>.
              Держите P &lt; 5%. LBT на донгле снижает реальные коллизии.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-1.5">Обобщённая оценка (ниже)</h4>
            <p>
              Расчёт по модели ALOHA для N одинаковых узлов. ToA и DC берутся из выбранного профиля устройства.
              Не учитывает конкретный сценарий — только верхняя оценка.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoRaCalculator() {
  const { params, setParams, updateParam, results, chartData } = useLoRaState();
  const { devices, addDevice, removeDevice } = useDeviceProfiles();
  const [activeTab, setActiveTab] = useState<Tab>('packet');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => { setActiveTab('packet'); setIsMobileMenuOpen(false); }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left", 
          activeTab === 'packet' ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        )}
      >
        <Calculator className="w-5 h-5" />
        Калькулятор пакета
      </button>
      <button
        onClick={() => { setActiveTab('network'); setIsMobileMenuOpen(false); }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left", 
          activeTab === 'network' ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        )}
      >
        <Network className="w-5 h-5" />
        Ёмкость сети
      </button>
      <button
        onClick={() => { setActiveTab('glossary'); setIsMobileMenuOpen(false); }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left", 
          activeTab === 'glossary' ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        )}
      >
        <BookOpen className="w-5 h-5" />
        Глоссарий
      </button>
      <button
        onClick={() => { setActiveTab('regional'); setIsMobileMenuOpen(false); }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left", 
          activeTab === 'regional' ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        )}
      >
        <Globe className="w-5 h-5" />
        Регионы
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg shadow-sm shadow-blue-600/20">
            <RadioTower className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-bold text-slate-900 text-sm leading-tight">LoRa P2P<br/>Calculator</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 bg-slate-100 rounded-lg">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-slate-900/20 backdrop-blur-sm z-20" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white p-4 border-b border-slate-200 shadow-xl" onClick={e => e.stopPropagation()}>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 border-r border-slate-200 bg-slate-100/50 sticky top-0 h-screen flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-4 mb-10 mt-2 px-2">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0">
            <RadioTower className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight">LoRa P2P</h1>
            <span className="text-sm font-medium text-slate-500">Analyzer</span>
          </div>
        </div>
        
        <nav className="flex-1">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-4 mt-2">Инструменты</h2>
          <NavContent />
        </nav>
        
        <div className="mt-8 px-4">
          <div className="bg-slate-200/50 p-4 rounded-xl text-xs text-slate-500">
            Спроектируйте структуру пакета, рассчитайте Time on Air и Duty Cycle.
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-10">
        <div className="max-w-[1440px] mx-auto">
          {/* Tab Content */}
          {activeTab === 'packet' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Compact sticky KPI bar — always visible while scrolling */}
              <StickyResultBar results={results} params={params} />

              {/* Radio params + detailed breakdown side by side */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <Controls params={params} updateParam={updateParam} />
                </div>
                <div className="xl:col-span-1">
                  <ResultSidebar results={results} params={params} />
                </div>
              </div>

              {/* Full-width sections */}
              <PacketStructure params={params} updateParam={updateParam} />
              <DeviceProfilesPanel
                devices={devices}
                params={params}
                toaMs={results.toaMs}
                onSave={(name) => addDevice(name, params, results.toaMs)}
                onLoad={(p) => setParams(p)}
                onRemove={removeDevice}
              />
              <EfficiencyAlert params={params} results={results} chartData={chartData} />
              <Formulas params={params} results={results} />
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CyclogramVisualizer devices={devices} />

              <NetworkGuide />

              <NetworkCapacity params={params} results={results} devices={devices} />
            </div>
          )}

          {activeTab === 'glossary' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Glossary />
            </div>
          )}

          {activeTab === 'regional' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RegionalParameters />
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
