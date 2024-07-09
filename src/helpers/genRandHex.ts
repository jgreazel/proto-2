function stringToHash(str: string) {
  // A simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function hashToColor(hash: number) {
  // Convert hash to an RGB color
  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;

  // Convert to pastel color
  const pastelFactor = 0.7;
  const pastelR = Math.round((r + 255 * pastelFactor) / (1 + pastelFactor));
  const pastelG = Math.round((g + 255 * pastelFactor) / (1 + pastelFactor));
  const pastelB = Math.round((b + 255 * pastelFactor) / (1 + pastelFactor));

  // Convert to hex string
  return `#${((1 << 24) + (pastelR << 16) + (pastelG << 8) + pastelB)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}

function generateRandomHexColor(id: string) {
  const hash = stringToHash(id);
  return hashToColor(hash);
}

export default generateRandomHexColor;
