// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },

    // https://github.com/nuxt/nuxt/discussions/27779#discussioncomment-9952440
    // to fix the weird websocket errors
    // `client:732 GET http://localhost:24678/_nuxt/ net::ERR_CONNECTION_REFUSED`
    vite: {
        server: {
            hmr: {
                clientPort: 3000
            }
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern' // or "modern"
                }
            }
        }
    },

    devServer: {
        host: ''
    },

    runtimeConfig: {
        public: {
            NUXT_BASE_PATH: process.env.NUXT_BASE_PATH,
            NUXT_COMMIT_HASH: process.env.NUXT_COMMIT_HASH
        }
    },

    modules: [
        'nuxt-lodash',
        '@vueuse/nuxt',
        '@nuxtjs/tailwindcss',
        '@unocss/nuxt',
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
    },

    routeRules: {
        '/signin': { ssr: true },
        '/reset_password': { ssr: true },
        '/signup': { ssr: true },
        '/add_base_path': { prerender: true },
        //'/tools': { prerender: true },
        '/': { ssr: false },
        '/settings': { ssr: false },
        '/accounts': { ssr: false },
        '/user_admin': { ssr: false },
        '/system_admin': { ssr: false }
    },

    compatibilityDate: '2024-11-10'
})
