import type { Background } from '../types'

// ── Gradient presets ──
export const gradientPresets: Background[] = [
  // Purples & Blues
  { type: 'gradient', name: 'Purple Haze', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', colors: ['#667eea', '#764ba2'] },
  { type: 'gradient', name: 'Violet Dream', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', colors: ['#a18cd1', '#fbc2eb'] },
  { type: 'gradient', name: 'Deep Indigo', value: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)', colors: ['#4338ca', '#6d28d9'] },
  { type: 'gradient', name: 'Ocean Blue', value: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', colors: ['#0ea5e9', '#2563eb'] },
  { type: 'gradient', name: 'Sky Light', value: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', colors: ['#89f7fe', '#66a6ff'] },
  { type: 'gradient', name: 'Royal Navy', value: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)', colors: ['#1e3a5f', '#0f172a'] },

  // Warm tones
  { type: 'gradient', name: 'Warm Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', colors: ['#f093fb', '#f5576c'] },
  { type: 'gradient', name: 'Peach Glow', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', colors: ['#ffecd2', '#fcb69f'] },
  { type: 'gradient', name: 'Golden Hour', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', colors: ['#f6d365', '#fda085'] },
  { type: 'gradient', name: 'Coral Reef', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', colors: ['#ff9a9e', '#fecfef'] },
  { type: 'gradient', name: 'Sunrise', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', colors: ['#fa709a', '#fee140'] },
  { type: 'gradient', name: 'Mango', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', colors: ['#f7971e', '#ffd200'] },

  // Greens
  { type: 'gradient', name: 'Emerald', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', colors: ['#11998e', '#38ef7d'] },
  { type: 'gradient', name: 'Forest', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', colors: ['#134e5e', '#71b280'] },
  { type: 'gradient', name: 'Mint', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', colors: ['#a8edea', '#fed6e3'] },

  // Darks & Neutrals
  { type: 'gradient', name: 'Cool Grey', value: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)', colors: ['#e0e0e0', '#bdbdbd'] },
  { type: 'gradient', name: 'Slate', value: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', colors: ['#334155', '#1e293b'] },
  { type: 'gradient', name: 'Charcoal', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)', colors: ['#232526', '#414345'] },
  { type: 'gradient', name: 'Midnight', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', colors: ['#0f0c29', '#24243e'] },
  { type: 'gradient', name: 'Dark Ember', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', colors: ['#1a1a2e', '#16213e'] },

  // Multi-color
  { type: 'gradient', name: 'Rainbow', value: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 25%, #06b6d4 50%, #10b981 75%, #eab308 100%)', colors: ['#a855f7', '#eab308'] },
  { type: 'gradient', name: 'Aurora', value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 50%, #7c3aed 100%)', colors: ['#00c6ff', '#7c3aed'] },
  { type: 'gradient', name: 'Cotton Candy', value: 'linear-gradient(135deg, #f0abfc 0%, #818cf8 50%, #34d399 100%)', colors: ['#f0abfc', '#34d399'] },
  { type: 'gradient', name: 'Neon', value: 'linear-gradient(135deg, #00ff87 0%, #60efff 100%)', colors: ['#00ff87', '#60efff'] },
  { type: 'gradient', name: 'Synthwave', value: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)', colors: ['#fc466b', '#3f5efb'] },

  // Angled variants
  { type: 'gradient', name: 'Blush Top', value: 'linear-gradient(180deg, #fbc2eb 0%, #a6c1ee 100%)', colors: ['#fbc2eb', '#a6c1ee'] },
  { type: 'gradient', name: 'Twilight', value: 'linear-gradient(180deg, #0c0a3e 0%, #7b2ff7 50%, #c084fc 100%)', colors: ['#0c0a3e', '#c084fc'] },
  { type: 'gradient', name: 'Dawn', value: 'linear-gradient(180deg, #fde68a 0%, #f472b6 50%, #7c3aed 100%)', colors: ['#fde68a', '#7c3aed'] },
  { type: 'gradient', name: 'Ice', value: 'linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 50%, #93c5fd 100%)', colors: ['#e0f2fe', '#93c5fd'] },
  { type: 'gradient', name: 'Lavender', value: 'linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 100%)', colors: ['#e9d5ff', '#c4b5fd'] },
]

// ── Solid color presets ──
export const solidPresets: Background[] = [
  { type: 'solid', name: 'White', value: '#FFFFFF', colors: ['#FFFFFF', '#FFFFFF'] },
  { type: 'solid', name: 'Snow', value: '#F8FAFC', colors: ['#F8FAFC', '#F8FAFC'] },
  { type: 'solid', name: 'Light Gray', value: '#F1F5F9', colors: ['#F1F5F9', '#F1F5F9'] },
  { type: 'solid', name: 'Zinc', value: '#71717A', colors: ['#71717A', '#71717A'] },
  { type: 'solid', name: 'Black', value: '#000000', colors: ['#000000', '#000000'] },
  { type: 'solid', name: 'Slate', value: '#1E293B', colors: ['#1E293B', '#1E293B'] },
  { type: 'solid', name: 'Blue', value: '#3B82F6', colors: ['#3B82F6', '#3B82F6'] },
  { type: 'solid', name: 'Indigo', value: '#6366F1', colors: ['#6366F1', '#6366F1'] },
  { type: 'solid', name: 'Purple', value: '#8B5CF6', colors: ['#8B5CF6', '#8B5CF6'] },
  { type: 'solid', name: 'Pink', value: '#EC4899', colors: ['#EC4899', '#EC4899'] },
  { type: 'solid', name: 'Red', value: '#EF4444', colors: ['#EF4444', '#EF4444'] },
  { type: 'solid', name: 'Orange', value: '#F97316', colors: ['#F97316', '#F97316'] },
  { type: 'solid', name: 'Green', value: '#22C55E', colors: ['#22C55E', '#22C55E'] },
  { type: 'solid', name: 'Teal', value: '#14B8A6', colors: ['#14B8A6', '#14B8A6'] },
]

// ── Mesh gradient presets (multi-stop) ──
export const meshPresets: Background[] = [
  { type: 'mesh', name: 'Cosmos', value: 'radial-gradient(at 20% 80%, #7c3aed 0%, transparent 50%), radial-gradient(at 80% 20%, #2563eb 0%, transparent 50%), radial-gradient(at 50% 50%, #0c0a3e 0%, #1e1b4b 100%)', colors: ['#7c3aed', '#0c0a3e'] },
  { type: 'mesh', name: 'Nebula', value: 'radial-gradient(at 30% 70%, #f472b6 0%, transparent 50%), radial-gradient(at 70% 30%, #818cf8 0%, transparent 50%), radial-gradient(at 50% 50%, #1e1b4b 0%, #0f172a 100%)', colors: ['#f472b6', '#0f172a'] },
  { type: 'mesh', name: 'Aqua', value: 'radial-gradient(at 20% 20%, #22d3ee 0%, transparent 50%), radial-gradient(at 80% 80%, #3b82f6 0%, transparent 50%), radial-gradient(at 50% 50%, #0c4a6e 0%, #1e3a5f 100%)', colors: ['#22d3ee', '#1e3a5f'] },
  { type: 'mesh', name: 'Lava', value: 'radial-gradient(at 25% 75%, #f97316 0%, transparent 50%), radial-gradient(at 75% 25%, #ef4444 0%, transparent 50%), radial-gradient(at 50% 50%, #7f1d1d 0%, #450a0a 100%)', colors: ['#f97316', '#450a0a'] },
  { type: 'mesh', name: 'Garden', value: 'radial-gradient(at 30% 30%, #34d399 0%, transparent 50%), radial-gradient(at 70% 70%, #06b6d4 0%, transparent 50%), radial-gradient(at 50% 50%, #064e3b 0%, #0f172a 100%)', colors: ['#34d399', '#0f172a'] },
]

// ── Transparent preset ──
export const transparentPreset: Background = {
  type: 'transparent',
  name: 'Transparent',
  value: 'transparent',
  colors: ['transparent', 'transparent']
}

// All presets grouped by category
export const backgroundCategories = [
  { id: 'gradient', label: 'Gradients', presets: gradientPresets },
  { id: 'solid', label: 'Solids', presets: solidPresets },
  { id: 'mesh', label: 'Mesh', presets: meshPresets },
  { id: 'transparent', label: 'None', presets: [transparentPreset] },
] as const

// Alias used by useCanvasStore for default background
export const backgroundPresets: Background[] = gradientPresets
