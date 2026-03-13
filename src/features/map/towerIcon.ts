/**
 * Create a colored tower SVG icon
 */
export const createTowerIconSvg = (color: string, selected: boolean): string => {
  const size = selected ? 24 : 18;
  const strokeWidth = selected ? 1.5 : 1;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <!-- Tower base -->
      <rect x="10" y="18" width="4" height="4" fill="${color}" stroke="#f8fafc" stroke-width="${strokeWidth * 0.3}"/>

      <!-- Tower mast -->
      <rect x="11.2" y="6" width="1.6" height="12" fill="${color}" stroke="#f8fafc" stroke-width="${strokeWidth * 0.2}"/>

      <!-- Antenna array (top) -->
      <circle cx="12" cy="4" r="1.5" fill="${color}" stroke="#f8fafc" stroke-width="${strokeWidth * 0.3}"/>
      <line x1="12" y1="2" x2="12" y2="6" stroke="${color}" stroke-width="${strokeWidth * 0.4}" stroke-linecap="round"/>

      <!-- Side antennas -->
      <line x1="8" y1="8" x2="12" y2="10" stroke="${color}" stroke-width="${strokeWidth * 0.3}" stroke-linecap="round"/>
      <line x1="16" y1="8" x2="12" y2="10" stroke="${color}" stroke-width="${strokeWidth * 0.3}" stroke-linecap="round"/>
      <circle cx="8" cy="8" r="0.8" fill="${color}"/>
      <circle cx="16" cy="8" r="0.8" fill="${color}"/>

      <!-- Mid-level sensor array -->
      <rect x="10.5" y="12" width="3" height="1" fill="${color}" stroke="#f8fafc" stroke-width="${strokeWidth * 0.2}"/>
      <line x1="9" y1="12.5" x2="15" y2="12.5" stroke="${color}" stroke-width="${strokeWidth * 0.2}"/>

      <!-- Stabilizing struts -->
      <line x1="10" y1="18" x2="8" y2="15" stroke="${color}" stroke-width="${strokeWidth * 0.3}" stroke-linecap="round"/>
      <line x1="14" y1="18" x2="16" y2="15" stroke="${color}" stroke-width="${strokeWidth * 0.3}" stroke-linecap="round"/>

      <!-- Status indicator light -->
      <circle cx="12" cy="16" r="0.6" fill="#f8fafc"/>

      <!-- Selection highlight -->
      ${selected ? `<circle cx="12" cy="12" r="11" fill="none" stroke="${color}" stroke-width="1" opacity="0.6"/>` : ''}
    </svg>
  `.trim();
};

/**
 * Convert SVG string to data URL for use with OpenLayers Icon
 */
export const svgToDataUrl = (svg: string): string => {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};