/**
 * Calculates LoRa Time on Air (ToA) according to Semtech formulas.
 */
export function calculateToA(
  sf: number,
  bw: number, // in Hz (e.g., 125000)
  payload: number, // in bytes
  cr: number, // 1 for 4/5, 2 for 4/6, 3 for 4/7, 4 for 4/8
  preambleLen: number = 8,
  explicitHeader: boolean = true,
  crc: boolean = true
) {
  // Symbol duration in seconds
  const tSym = Math.pow(2, sf) / bw;

  // Preamble duration in seconds
  const tPreamble = (preambleLen + 4.25) * tSym;

  // Low Data Rate Optimization is required if symbol duration > 16.38ms
  const ldro = tSym > 0.01638 ? 1 : 0;
  
  const ih = explicitHeader ? 0 : 1;
  const crcVal = crc ? 1 : 0;

  // Number of payload symbols
  const payloadSymbNb =
    8 +
    Math.max(
      Math.ceil(
        (8 * payload - 4 * sf + 28 + 16 * crcVal - 20 * ih) / (4 * (sf - 2 * ldro))
      ) * (cr + 4),
      0
    );

  const tPayload = payloadSymbNb * tSym;
  const toa = tPreamble + tPayload;

  return {
    tSym,
    tPreamble,
    tPayload,
    toa,
    payloadSymbNb,
    ldro,
    ih,
    crcVal
  };
}
