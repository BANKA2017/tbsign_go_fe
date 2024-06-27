// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    ssr: false,
    devServer: {
        host: ''
    },
    runtimeConfig: {
        public: {
            NUXT_BASE_PATH: process.env.NUXT_BASE_PATH,
            NUXT_GA_ID: process.env.NUXT_GA_ID
        }
    },
    modules: [
        'nuxt-lodash',
        '@vueuse/nuxt',
        '@nuxtjs/tailwindcss',
        [
            '@pinia/nuxt',
            {
                autoImports: [
                    // automatically imports `defineStore`
                    'defineStore' // import { defineStore } from 'pinia'
                ]
            }
        ]
    ],
    imports: {
        dirs: ['./stores']
    },
    experimental: {
        appManifest: false,
        payloadExtraction: false
    },
    tailwindcss: {
        cssPath: ['~/assets/css/tailwind.css', { injectPosition: 'first' }],
        configPath: 'tailwind.config',
        exposeConfig: { level: 2 },
        config: {},
        viewer: true
    }
})
