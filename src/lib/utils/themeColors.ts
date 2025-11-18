/**
 * Utility to get computed theme colors for use in SVG/charts
 * Since SVG elements need actual color values, we compute them from CSS variables
 */

export function getThemeColor(variableName: string): string {
  if (typeof window === 'undefined') {
    // SSR fallback - return a default color
    return '#000000'
  }
  
  const computed = getComputedStyle(document.documentElement)
  return computed.getPropertyValue(variableName).trim() || '#000000'
}

/**
 * Get chart colors from theme
 */
export function getChartColors() {
  return {
    chart1: getThemeColor('--chart-1'),
    chart2: getThemeColor('--chart-2'),
    chart3: getThemeColor('--chart-3'),
    chart4: getThemeColor('--chart-4'),
    chart5: getThemeColor('--chart-5'),
    secondary: getThemeColor('--secondary'),
    destructive: getThemeColor('--destructive'),
    primary: getThemeColor('--primary'),
  }
}

/**
 * Get array of chart colors for use in charts
 */
export function getChartColorArray(): string[] {
  const colors = getChartColors()
  return [
    colors.chart1,
    colors.chart2,
    colors.chart3,
    colors.chart4,
    colors.chart5,
    colors.primary,
  ]
}

