/**
 * Utility: Google Encoded Polyline Algorithm Decoder
 *
 * Mathematically unpacks a Google Encoded Polyline string into an array of { latitude, longitude } pairs.
 *
 * === HOW THE GOOGLE ENCODED POLYLINE ALGORITHM WORKS ===
 * 1. Coordinates are serialized as delta values (differences from the previous point) multiplied by 1e5
 *    to preserve 5 decimal places of precision (~1.1 meter accuracy).
 * 2. Binary representation of delta values uses two's complement. If the value is negative,
 *    it is bitwise-inverted and left-shifted by 1; positive values are left-shifted by 1:
 *      binary = (delta < 0) ? ~(delta << 1) : (delta << 1)
 * 3. The binary number is split into 5-bit chunks from least significant to most significant bit.
 * 4. Each 5-bit chunk (except the last one in a coordinate) has its 6th bit set (OR with 0x20)
 *    as a continuation flag indicating that more chunks follow.
 * 5. Each 5-bit chunk is offset by ASCII 63 ('?') so characters fall in printable ASCII range [63..126].
 *
 * === DECODING PROCESS (INVERTED) ===
 * 1. Loop through each character in the encoded string.
 * 2. Subtract ASCII 63 ('?') from each char code.
 * 3. Extract the lowest 5 bits (`byte & 0x1f`) and shift them into the accumulator at position `shift`.
 * 4. Repeat until a byte with value < 0x20 is encountered (meaning bit 5 was 0, so no continuation flag).
 * 5. If bit 0 of the accumulator is 1, the original delta was negative:
 *      delta = ~(accumulator >> 1)
 *    otherwise:
 *      delta = accumulator >> 1
 * 6. Accumulate delta to running latitude / longitude sum.
 * 7. Divide by 1e5 to restore actual floating-point degrees.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Decodes an encoded polyline string into an array of coordinate objects.
 *
 * @param encoded - Google encoded polyline string (e.g. "gfo}EtohhV_@wAx...")
 * @returns Array of { latitude, longitude }
 */
export function decodePolyline(encoded: string): LatLng[] {
  if (!encoded || typeof encoded !== 'string') {
    return [];
  }

  const poly: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    // --- Decode Latitude Delta ---
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    // Invert sign if least-significant bit was 1
    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    // --- Decode Longitude Delta ---
    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    // Scale back down by 10^5 to obtain precise decimal degrees
    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
}
