import { Info, BookOpen, Layers, Zap, Hash } from "lucide-react";

export function Glossary() {
  return (
    <div className="space-y-6">
      
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Глоссарий и архитектура P2P</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">LoRa P2P</span>
        </div>
        <p className="text-slate-600 leading-relaxed max-w-3xl">
          LoRa P2P (Peer-to-Peer) отличается от LoRaWAN отсутствием жесткой стандартизации MAC-уровня. 
          Вы сами формируете структуру пакета и управляете коллизиями. Ниже приведены основные понятия физического уровня LoRa.
        </p>
      </div>

      {/* Physical Layer Structure */}
      <section className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-500" /> Структура физического кадра (PHY)
          </h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm font-medium">
              <div className="px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex-1 min-w-[120px] text-center">Preamble</div>
              <div className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-center">PHDR (Header)</div>
              <div className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-center">PHDR_CRC</div>
              <div className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex-[3] min-w-[150px] text-center">PHY Payload (Ваши данные)</div>
              <div className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-center">CRC</div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-800 mb-1">Preamble (Преамбула)</div>
                <div className="text-sm text-slate-600">Последовательность символов для синхронизации приемника. Обычно 8 символов. Чем длиннее, тем надежнее пробуждение приемника (CAD), но дольше передача.</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-800 mb-1">PHDR (Явный заголовок)</div>
                <div className="text-sm text-slate-600">Содержит информацию о длине Payload, Coding Rate и наличии CRC. При SF6 часто отключается (Implicit Header mode) для экономии времени.</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-800 mb-1">PHY Payload</div>
                <div className="text-sm text-slate-600">Собственно ваши данные. В P2P вы сами можете поместить сюда адреса устройств, счетчики пакетов и команды (сформировать свой MAC-уровень).</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-800 mb-1">CRC</div>
                <div className="text-sm text-slate-600">Контрольная сумма полезной нагрузки (2 байта). Приемник аппаратно отбрасывает пакеты с неверным CRC, защищая вас от "мусора".</div>
              </div>
            </div>
          </div>
        </section>

      {/* Radio Parameters */}
      <section className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-slate-500" /> Параметры радиосигнала
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { k: 'Spreading Factor (SF)', v: 'SF6 – SF12', d: 'Определяет "размазывание" сигнала во времени. Увеличение SF на 1 увеличивает дальность связи, но удваивает время передачи (Time on Air). SF6 — самый быстрый, SF12 — самый дальнобойный.' },
              { k: 'Bandwidth (BW)', v: 'Ширина канала', d: 'Обычно 125, 250 или 500 кГц. Чем шире полоса, тем быстрее передача, но ниже чувствительность приемника (меньше дальность).' },
              { k: 'Coding Rate (CR)', v: '4/5 – 4/8', d: 'Помехоустойчивое кодирование (Forward Error Correction). CR 4/5 добавляет 1 бит коррекции на каждые 4 бита данных, 4/8 — удваивает объем данных для максимальной надежности.' },
              { k: 'Low Data Rate Opt. (LDRO)', v: 'Оптимизация', d: 'Обязательна к включению, если время одного символа превышает 16.38 мс (обычно при SF11/SF12 на 125 кГц). Помогает бороться со сдвигом частоты опорного генератора.' },
            ].map((i) => (
              <div key={i.k} className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-900">{i.k}</div>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{i.v}</span>
                </div>
                <div className="text-sm text-slate-600 leading-relaxed">{i.d}</div>
              </div>
            ))}
          </div>
        </section>

      {/* Network specific */}
      <section className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-slate-500" /> Отличия P2P сетей
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <h4 className="font-bold text-amber-900 mb-2">Нет встроенной адресации и шифрования</h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                В отличие от LoRaWAN, где пакет содержит MHDR, DevAddr, счетчики и MIC, в LoRa P2P "из коробки" передается просто массив байт. 
                Если в эфире работают другие P2P устройства на тех же настройках (частота, SF, BW, SyncWord), ваш приемник поймает их пакеты. 
                <strong>Вы должны сами добавлять ID устройства назначения и отправителя в первые байты Payload.</strong>
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-2">Синхро-слово (Sync Word)</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                Полезный аппаратный фильтр. В LoRaWAN используется 0x34. Для P2P сетей рекомендуется использовать 0x12 (или другое кастомное значение). 
                Приемник аппаратно игнорирует преамбулы с чужим Sync Word, что экономит энергию и предотвращает ложные срабатывания.
              </p>
            </div>
          </div>
      </section>
    </div>
  );
}
