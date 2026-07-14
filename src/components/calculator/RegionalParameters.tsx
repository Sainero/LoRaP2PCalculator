import React from "react";
import { AlertTriangle, Info, Globe, Radio, FileText, ExternalLink } from "lucide-react";

export function RegionalParameters() {
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white border border-indigo-500">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-indigo-100" />
          <h2 className="text-white font-bold text-xl">Справочник по ISM диапазонам (LoRa P2P)</h2>
        </div>
        <p className="text-indigo-50 text-sm leading-relaxed mt-2 max-w-3xl">
          В отличие от LoRaWAN, в сетях P2P вы самостоятельно настраиваете параметры трансивера (частота, мощность, SF, BW). Тем не менее, <strong>вы обязаны аппаратно или программно соблюдать региональные законодательные ограничения</strong> на использование ISM (Industrial, Scientific, Medical) диапазонов, такие как максимальная излучаемая мощность и Duty Cycle (рабочий цикл).
        </p>
      </div>

      {/* Frequency Channels Table - RU868 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
        <div className="mb-6">
          <h2 className="text-slate-900 font-bold text-lg mb-2 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            Частотный план RU868
          </h2>
          <p className="text-sm text-slate-600">
            Для РФ использование радиочастот регламентируется решением ГКРЧ (и ГОСТ Р 71168-2023). При работе с LoRa P2P в РФ вы можете использовать указанные ниже частоты, строго соблюдая ограничения.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Номер канала (LoRaWAN)</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Центральная частота</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Макс. ЭИИМ</th>
                <th className="py-3 px-4 font-semibold">Ограничения (Duty Cycle / LBT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="bg-indigo-50/50">
                <td colSpan={4} className="py-2 px-4 font-semibold text-indigo-800 text-xs uppercase tracking-wider">
                  Основной поддиапазон (868.7 - 869.2 МГц)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs">0</td>
                <td className="py-3 px-4 font-bold text-slate-900">868.9 MHz</td>
                <td className="py-3 px-4">25 мВт</td>
                <td rowSpan={2} className="py-3 px-4 align-top border-l border-slate-100">
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-200">
                    Рабочий цикл: 1% (допускается до 10% в некоторых документах, но 1% — безопасный стандарт)
                  </span>
                  <div className="mt-1 text-xs text-slate-500">или механизм LBT (Listen Before Talk)</div>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs">1</td>
                <td className="py-3 px-4 font-bold text-slate-900">869.1 MHz</td>
                <td className="py-3 px-4">25 мВт</td>
              </tr>
              
              <tr className="bg-indigo-50/50 border-t border-slate-200">
                <td colSpan={4} className="py-2 px-4 font-semibold text-indigo-800 text-xs uppercase tracking-wider">
                  Вспомогательный поддиапазон (864 - 865 МГц)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs">2</td>
                <td className="py-3 px-4 font-bold text-slate-900">864.1 MHz</td>
                <td className="py-3 px-4">25 мВт</td>
                <td rowSpan={3} className="py-3 px-4 align-top border-l border-slate-100 text-xs space-y-1">
                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md font-semibold border border-rose-200 mb-1">
                    Рабочий цикл: 0.1%
                  </span>
                  <div className="text-slate-600">или механизм LBT (Listen Before Talk)</div>
                  <div className="text-rose-600 font-medium mt-1 border-t border-rose-100 pt-1">
                    ⚠️ Запрещается использование вблизи аэродромов
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs">3</td>
                <td className="py-3 px-4 font-bold text-slate-900">864.3 MHz</td>
                <td className="py-3 px-4">25 мВт</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-500 text-xs">... до 864.9</td>
                <td className="py-3 px-4 font-bold text-slate-900">864.5 - 864.9 MHz</td>
                <td className="py-3 px-4">25 мВт</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequency Channels Table - EU868 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
        <div className="mb-6">
          <h2 className="text-slate-900 font-bold text-lg mb-2 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            Частотный план EU868 (Европа)
          </h2>
          <p className="text-sm text-slate-600">
            Официальные рамки ETSI EN 300 220. Часто аппаратура производится с настройками EU868 по умолчанию.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Полоса</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Частоты</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Макс. Мощность</th>
                <th className="py-3 px-4 font-semibold">Ограничения (Duty Cycle)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-mono text-xs font-semibold">g (SRD)</td>
                <td className="py-3 px-4 font-bold text-slate-900">868.0 - 868.6 MHz</td>
                <td className="py-3 px-4">+14 dBm (25 мВт)</td>
                <td className="py-3 px-4">
                  <span className="inline-flex bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-200">
                    1%
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs font-semibold">g3 (SRD)</td>
                <td className="py-3 px-4 font-bold text-slate-900">869.4 - 869.65 MHz</td>
                <td className="py-3 px-4 font-bold text-emerald-600">+27 dBm (500 мВт)</td>
                <td className="py-3 px-4">
                  <span className="inline-flex bg-orange-50 text-orange-800 px-2.5 py-1 rounded-md text-xs font-semibold border border-orange-200">
                    10%
                  </span>
                  <div className="text-xs text-slate-500 mt-1">(Часто используется для базовых станций / мощных маяков)</div>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs font-semibold">g4 (SRD)</td>
                <td className="py-3 px-4 font-bold text-slate-900">869.7 - 870.0 MHz</td>
                <td className="py-3 px-4">+14 dBm (25 мВт)</td>
                <td className="py-3 px-4">
                  <span className="inline-flex bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-200">
                    1%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Duty Cycle Information */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
        <h2 className="text-slate-900 font-bold text-lg mb-4">Ограничения Duty Cycle (Рабочий цикл)</h2>
        <p className="text-sm text-slate-600 mb-6">
          В P2P сетях ваш микроконтроллер (например, ESP32) должен программно отслеживать время отправки пакетов (ToA) и блокировать передатчик на нужное время, чтобы не нарушать закон. <strong>Duty Cycle считается как процент времени излучения за 1 час.</strong>
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 0.1% Duty Cycle */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-slate-900 text-lg">0.1%</div>
              <span className="bg-white text-xs font-mono px-2 py-1 border border-slate-200 rounded text-slate-500">Жесткий лимит</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Максимум <strong>3.6 секунд</strong> эфира в час
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                После передачи (например, 1 сек) устройство обязано молчать <strong>999 секунд</strong> (около 16 минут).
              </li>
            </ul>
          </div>

          {/* 1% Duty Cycle */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-indigo-900 text-lg">1%</div>
              <span className="bg-white text-xs font-mono px-2 py-1 border border-indigo-200 rounded text-indigo-600 font-bold">Стандарт</span>
            </div>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                Максимум <strong>36 секунд</strong> эфира в час
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                После передачи (например, 1 сек) устройство обязано молчать <strong>99 секунд</strong>.
              </li>
            </ul>
          </div>

          {/* 10% Duty Cycle */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-emerald-900 text-lg">10%</div>
              <span className="bg-white text-xs font-mono px-2 py-1 border border-emerald-200 rounded text-emerald-600 font-bold">Высокий лимит</span>
            </div>
            <ul className="space-y-2 text-sm text-emerald-800">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                Максимум <strong>6 минут</strong> эфира в час
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                После передачи (например, 1 сек) устройство обязано молчать <strong>9 секунд</strong>.
              </li>
            </ul>
          </div>
        </div>

        {/* LBT (Listen Before Talk) */}
        <div className="mt-6 p-5 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-amber-900 mb-2">Механизм LBT (Listen Before Talk)</div>
              <div className="text-sm text-amber-800 space-y-1.5 leading-relaxed">
                <p>
                  Альтернатива жестким лимитам Duty Cycle. Перед отправкой трансивер переходит в режим RX на короткое время (обычно 5 мс) и измеряет уровень сигнала (RSSI) на канале.
                </p>
                <p>
                  Если сигнал ниже порога (канал свободен), начинается передача. Если канал занят, передача откладывается на случайное время. В P2P это отличный способ снизить количество коллизий при плотном расположении устройств.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Packet Structure Table P2P vs LoRaWAN */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
        <h2 className="text-slate-900 font-bold text-lg mb-4">Максимальный размер Payload (P2P vs LoRaWAN)</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Spreading Factor</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Bandwidth</th>
                <th className="py-3 px-4 font-semibold">Max Payload в LoRaWAN</th>
                <th className="py-3 px-4 font-semibold">Max Payload в LoRa P2P (PHY)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SF12</td>
                <td className="py-3 px-4">125 kHz</td>
                <td className="py-3 px-4">51 байт</td>
                <td rowSpan={9} className="py-3 px-4 border-l border-slate-100 align-middle">
                  <div className="font-bold text-indigo-700 mb-1">До 255 байт (всегда)</div>
                  <div className="text-xs text-slate-500 leading-relaxed max-w-xs">
                    Ограничения трансивера SX127x/SX126x — буфер 255 байт. В P2P вы можете передать все 255 байт на любом SF и BW. 
                    Однако при SF12 передача 255 байт займет <strong>более 8 секунд</strong>, что может нарушить Duty Cycle и увеличить риск коллизии.
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SF11</td>
                <td className="py-3 px-4">125 kHz</td>
                <td className="py-3 px-4">51 байт</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SF10</td>
                <td className="py-3 px-4">125 kHz</td>
                <td className="py-3 px-4">51 байт</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SF9</td>
                <td className="py-3 px-4">125 kHz</td>
                <td className="py-3 px-4">115 байт</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SF8</td>
                <td className="py-3 px-4">125 kHz</td>
                <td className="py-3 px-4">222 байт</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SF7</td>
                <td className="py-3 px-4">125 kHz</td>
                <td className="py-3 px-4">222 байт</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SF7</td>
                <td className="py-3 px-4">250 kHz</td>
                <td className="py-3 px-4">222 байт</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SF7</td>
                <td className="py-3 px-4">500 kHz</td>
                <td className="py-3 px-4">222 байт <span className="text-xs text-slate-400 font-normal">(зависит от региона)</span></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SF6</td>
                <td className="py-3 px-4">любая</td>
                <td className="py-3 px-4">Не стандартизировано</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Источники и нормативная база */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
        <h2 className="text-slate-900 font-bold text-lg mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Источники и нормативная база
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-5 max-w-3xl">
          LoRa P2P не использует MAC-уровень LoRaWAN, но работает в тех же <strong>ISM-диапазонах</strong> и обязан
          соблюдать те же региональные ограничения (частоты, ЭИИМ, Duty Cycle). Частотный план и лимиты для РФ
          закреплены в <strong>ГОСТ Р 71168-2023</strong> и совпадают с планом LoRa Alliance
          <strong> «LoRaWAN 1.0.3 Regional Parameters»</strong>; для ЕС — <strong>ETSI EN 300 220</strong>.
          Формула Time on Air — по <strong>Semtech AN1200.13</strong>. Конкретные значения Duty Cycle приведены как
          безопасные ориентиры: перед вводом в эксплуатацию сверяйтесь с первоисточниками и актуальными решениями ГКРЧ.
        </p>
        <ul className="space-y-2.5">
          {[
            { t: "LoRaWAN 1.0.3 Regional Parameters (LoRa Alliance)", u: "https://lora-alliance.org/resource_hub/lorawan-regional-parameters-v1-0-3reva/" },
            { t: "ГОСТ Р 71168-2023", u: "https://allgosts.ru/35/020/gost_r_71168-2023" },
            { t: "ETSI EN 300 220 (SRD, диапазоны 863–870 МГц)", u: "https://www.etsi.org/standards-search#page=1&search=EN%20300%20220" },
            { t: "Semtech AN1200.13 — LoRa Modem Designer's Guide", u: "https://www.semtech.com/uploads/documents/LoraDesignGuide_STD.pdf" },
          ].map((ref) => (
            <li key={ref.u}>
              <a
                href={ref.u}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                {ref.t}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
