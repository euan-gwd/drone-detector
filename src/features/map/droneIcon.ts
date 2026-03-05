/**
 * Create a colored drone SVG icon
 */
export const createDroneIconSvg = (color: string, selected: boolean): string => {
  const size = selected ? 24 : 18;
  const strokeWidth = selected ? 1.5 : 1;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <!-- Drone body -->
      <circle cx="12" cy="12" r="3" fill="${color}" stroke="#f8fafc" stroke-width="${strokeWidth * 0.3}"/>

      <!-- Arms -->
      <line x1="12" y1="12" x2="6" y2="6" stroke="${color}" stroke-width="${strokeWidth * 0.5}" stroke-linecap="round"/>
      <line x1="12" y1="12" x2="18" y2="6" stroke="${color}" stroke-width="${strokeWidth * 0.5}" stroke-linecap="round"/>
      <line x1="12" y1="12" x2="6" y2="18" stroke="${color}" stroke-width="${strokeWidth * 0.5}" stroke-linecap="round"/>
      <line x1="12" y1="12" x2="18" y2="18" stroke="${color}" stroke-width="${strokeWidth * 0.5}" stroke-linecap="round"/>

      <!-- Propellers -->
      <circle cx="6" cy="6" r="2.5" fill="${color}" stroke="#f8fafc" stroke-width="${strokeWidth * 0.3}"/>
      <circle cx="18" cy="6" r="2.5" fill="${color}" stroke="#f8fafc" stroke-width="${strokeWidth * 0.3}"/>
      <circle cx="6" cy="18" r="2.5" fill="${color}" stroke="#f8fafc" stroke-width="${strokeWidth * 0.3}"/>
      <circle cx="18" cy="18" r="2.5" fill="${color}" stroke="#f8fafc" stroke-width="${strokeWidth * 0.3}"/>

      <!-- Propeller blades (small lines for detail) -->
      <line x1="5" y1="6" x2="7" y2="6" stroke="#f8fafc" stroke-width="${strokeWidth * 0.2}" stroke-linecap="round"/>
      <line x1="17" y1="6" x2="19" y2="6" stroke="#f8fafc" stroke-width="${strokeWidth * 0.2}" stroke-linecap="round"/>
      <line x1="5" y1="18" x2="7" y2="18" stroke="#f8fafc" stroke-width="${strokeWidth * 0.2}" stroke-linecap="round"/>
      <line x1="17" y1="18" x2="19" y2="18" stroke="#f8fafc" stroke-width="${strokeWidth * 0.2}" stroke-linecap="round"/>

      <!-- Direction indicator (front) -->
      <circle cx="12" cy="9" r="0.8" fill="#f8fafc"/>
    </svg>
  `.trim();
};

/**
 * Convert SVG string to data URL for use with OpenLayers Icon
 */
export const svgToDataUrl = (svg: string): string => {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};
