export interface CustomBlock {
  id: string;
  label: string;
  bytes: number;
}

export interface LoRaParams {
  sf: number;
  bw: number;
  cr: number;
  preamble: number;
  payload: number; // Base payload
  customBlocks: CustomBlock[];
  dutyCycle: number;
  explicitHeader: boolean;
  crc: boolean;
  lbtEnabled: boolean;   // Listen Before Talk (CCA)
  lbtTccaMs: number;     // Время прослушки канала (CCA), мс
  lbtTboMs: number;      // Окно backoff при занятом канале, мс
}

export interface DeviceProfile {
  id: string;
  name: string;
  params: LoRaParams;
  toaMs: number; // Снимок Time on Air (мс) на момент сохранения
}

export interface LoRaResults {
  toaMs: number;
  preambleMs: number;
  payloadPartMs: number;
  waitTimeMs: number;
  cycleTimeMs: number;
  maxPerHour: number;
  dcFraction: number;
  tSymMs: number;
  payloadSymbNb: number;
  ldro: number;
  ih: number;
  crcVal: number;
  bitRate: number; // Эффективная скорость передачи LoRa, бит/с
  lbtOverheadMs: number; // Ожидаемая задержка доступа LBT = Tcca + 0.5·Tbo (не входит в ToA)
}
