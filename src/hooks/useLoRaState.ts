import { useState, useMemo } from 'react';
import { calculateToA } from '../utils/lora';
import { LoRaParams, LoRaResults } from '../types';

export function useLoRaState() {
  const [params, setParams] = useState<LoRaParams>({
    sf: 9,
    bw: 125,
    cr: 1,
    preamble: 8,
    payload: 12,
    customBlocks: [],
    dutyCycle: 1,
    explicitHeader: true,
    crc: true,
    lbtEnabled: false,
    lbtTccaMs: 5,
    lbtTboMs: 5
  });

  const updateParam = <K extends keyof LoRaParams>(key: K, value: LoRaParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const results: LoRaResults = useMemo(() => {
    const { sf, bw, payload, customBlocks, cr, preamble, explicitHeader, crc, dutyCycle, lbtEnabled, lbtTccaMs, lbtTboMs } = params;
    const totalPayload = payload + customBlocks.reduce((acc, block) => acc + block.bytes, 0);
    const res = calculateToA(sf, bw * 1000, totalPayload, cr, preamble, explicitHeader, crc);
    const toaMs = res.toa * 1000;
    const preambleMs = res.tPreamble * 1000;
    const payloadPartMs = res.tPayload * 1000;
    
    const dcFraction = dutyCycle / 100;
    const waitTimeMs = toaMs * ((1 / dcFraction) - 1);
    const cycleTimeMs = toaMs + waitTimeMs;
    const maxPerHour = Math.floor((3600 * 1000) / cycleTimeMs);

    // LoRa data rate: Rb = SF * (BW / 2^SF) * (4 / (4 + CR)), бит/с
    const bitRate = sf * ((bw * 1000) / Math.pow(2, sf)) * (4 / (4 + cr));

    // LBT (CCA): ожидаемая задержка доступа = Tcca + 0.5·Tbo (backoff в среднем половина окна).
    // Это время прослушки (RX), не излучение — в ToA/duty cycle НЕ входит.
    const lbtOverheadMs = lbtEnabled ? (lbtTccaMs + 0.5 * lbtTboMs) : 0;

    return { 
      toaMs, 
      preambleMs, 
      payloadPartMs, 
      waitTimeMs, 
      cycleTimeMs, 
      maxPerHour, 
      dcFraction,
      tSymMs: res.tSym * 1000,
      payloadSymbNb: res.payloadSymbNb,
      ldro: res.ldro,
      ih: res.ih,
      crcVal: res.crcVal,
      bitRate,
      lbtOverheadMs
    };
  }, [params]);

  const chartData = useMemo(() => {
    const { sf, bw, cr, preamble, explicitHeader, crc } = params;
    const data = [];
    for (let p = 1; p <= 128; p += Math.ceil(128 / 30)) {
      const res = calculateToA(sf, bw * 1000, p, cr, preamble, explicitHeader, crc);
      data.push({
        payload: p,
        toaMs: Number((res.toa * 1000).toFixed(1)),
        preambleMs: Number((res.tPreamble * 1000).toFixed(1)),
        overheadPercent: Number(((res.tPreamble / res.toa) * 100).toFixed(1)),
      });
    }
    return data;
  }, [params.sf, params.bw, params.cr, params.preamble, params.explicitHeader, params.crc]);

  return { params, setParams, updateParam, results, chartData };
}
