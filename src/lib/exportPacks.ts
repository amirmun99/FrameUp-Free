export interface ExportSize {
  label: string
  width: number
  height: number
  filename: string
  deviceId?: string
}

export interface ExportPack {
  id: string
  name: string
  description: string
  sizes: ExportSize[]
}

export const exportPacks: ExportPack[] = [
  {
    id: 'app-store',
    name: 'App Store',
    description: 'iPhone screenshots for App Store',
    sizes: [
      { label: 'iPhone 17 Pro Max', width: 1320, height: 2868, filename: 'app-store-6.9', deviceId: 'iphone-17-pro-max' },
      { label: 'iPhone 16 Pro Max', width: 1320, height: 2868, filename: 'app-store-6.7', deviceId: 'iphone-16-pro-max' },
      { label: 'iPhone 15 Pro', width: 1179, height: 2556, filename: 'app-store-6.1', deviceId: 'iphone-15-pro' },
      { label: 'iPhone 8 Plus', width: 1242, height: 2208, filename: 'app-store-5.5', deviceId: 'iphone-8-plus-space-grey' }
    ]
  },
  {
    id: 'play-store',
    name: 'Play Store',
    description: 'Android screenshots for Google Play',
    sizes: [
      { label: 'Galaxy S9', width: 1440, height: 2960, filename: 'play-store-phone', deviceId: 'galaxy-s9-midnight-black' },
      { label: 'Galaxy S8', width: 1440, height: 2960, filename: 'play-store-galaxy-s8', deviceId: 'galaxy-s8-midnight-black' },
      { label: 'Nexus 9 Tablet', width: 1536, height: 2048, filename: 'play-store-tablet', deviceId: 'nexus-9' },
      { label: 'Feature Graphic', width: 1024, height: 500, filename: 'play-store-feature' }
    ]
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Common social media sizes',
    sizes: [
      { label: 'Instagram Square', width: 1080, height: 1080, filename: 'social-instagram-square' },
      { label: 'Instagram Story', width: 1080, height: 1920, filename: 'social-instagram-story' },
      { label: 'Twitter / X Post', width: 1200, height: 675, filename: 'social-twitter-post' },
      { label: 'Facebook Post', width: 1200, height: 628, filename: 'social-facebook-post' },
      { label: 'LinkedIn Post', width: 1200, height: 627, filename: 'social-linkedin-post' },
      { label: 'OG Image', width: 1200, height: 630, filename: 'social-og-image' }
    ]
  },
  {
    id: 'mac-app-store',
    name: 'Mac App Store',
    description: 'Mac screenshots for App Store',
    sizes: [
      { label: 'MacBook Pro 15"', width: 2880, height: 1800, filename: 'mac-app-store-15', deviceId: 'macbook-pro-15-space-grey' },
      { label: 'MacBook Air 13"', width: 2560, height: 1600, filename: 'mac-app-store-13', deviceId: 'macbook-air-13-silver' }
    ]
  },
  {
    id: 'ipad',
    name: 'iPad App Store',
    description: 'iPad screenshots for App Store',
    sizes: [
      { label: 'iPad Pro 13"', width: 2048, height: 2732, filename: 'ipad-pro-13', deviceId: 'ipad-pro-13-space-gray-portrait' },
      { label: 'iPad Gold', width: 1536, height: 2048, filename: 'ipad-gold', deviceId: 'ipad-gold' }
    ]
  }
]
