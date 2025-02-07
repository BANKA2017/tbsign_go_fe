import { defineConfig } from 'unocss'
import presetIcons from '@unocss/preset-icons'

const safelist: string[] = []

export default defineConfig({
    presets: [
        presetIcons({
            collections: {
                // key as the collection name
                'fluent-emoji-flat': () => import('@iconify-json/fluent-emoji-flat/icons.json', { with: { type: 'json' } }).then((i) => i.default),
                bi: () => import('@iconify-json/bi/icons.json', { with: { type: 'json' } }).then((i) => i.default),
                'skill-icons': () => import('@iconify-json/skill-icons/icons.json', { with: { type: 'json' } }).then((i) => i.default)
            },
            extraProperties: {
                'vertical-align': 'middle'
            }
        })
    ],
    safelist
})
