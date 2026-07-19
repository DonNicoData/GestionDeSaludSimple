import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.salud.siete.parametros',
  appName: 'Salud 7',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#FAF8F5',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#FAF8F5',
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
