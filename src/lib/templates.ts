import type { CanvasConfig } from '../types'
import { gradientPresets } from './presets'

export interface Template {
  id: string
  name: string
  description: string
  icon: string
  config: Omit<CanvasConfig, 'zoom'>
}

export const templates: Template[] = [
  {
    id: 'app-store-screenshot',
    name: 'App Store Screenshot',
    description: 'iPhone mockup with headline text',
    icon: '📱',
    config: {
      deviceId: 'iphone-17-pro-max',
      deviceVariant: 'light',
      background: gradientPresets[0], // Purple Haze
      overlays: [
        {
          id: 'template-text-1',
          type: 'text',
          x: 80,
          y: 30,
          width: 300,
          height: 40,
          rotation: 0,
          text: 'Your App Headline',
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'Inter, system-ui, sans-serif',
          fill: '#FFFFFF',
          align: 'center'
        }
      ]
    }
  },
  {
    id: 'social-media-post',
    name: 'Social Media Post',
    description: 'Browser frame for social sharing',
    icon: '🌐',
    config: {
      deviceId: 'browser-chrome',
      deviceVariant: 'light',
      background: gradientPresets[20], // Rainbow
      overlays: []
    }
  },
  {
    id: 'website-hero',
    name: 'Website Hero',
    description: 'MacBook mockup for landing pages',
    icon: '💻',
    config: {
      deviceId: 'macbook-pro-15-space-grey',
      deviceVariant: 'light',
      background: gradientPresets[16], // Slate
      overlays: []
    }
  },
  {
    id: 'play-store-feature',
    name: 'Play Store Feature',
    description: 'Android phone for Play Store listing',
    icon: '🤖',
    config: {
      deviceId: 'galaxy-s9-midnight-black',
      deviceVariant: 'light',
      background: gradientPresets[3], // Ocean Blue
      overlays: []
    }
  },
  {
    id: 'ipad-showcase',
    name: 'iPad Showcase',
    description: 'iPad mockup for tablet apps',
    icon: '📱',
    config: {
      deviceId: 'ipad-pro-13-space-gray-portrait',
      deviceVariant: 'light',
      background: gradientPresets[12], // Emerald
      overlays: []
    }
  },
  {
    id: 'dark-minimal',
    name: 'Dark Minimal',
    description: 'Clean dark background for screenshots',
    icon: '🌑',
    config: {
      deviceId: 'iphone-xs-space-grey',
      deviceVariant: 'light',
      background: gradientPresets[17], // Charcoal
      overlays: []
    }
  }
]
