// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
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
    },
    routeRules: {
        '/login': { ssr: false },
        '/reset_password': { ssr: false },
        '/signup': { ssr: false },
        '/add_base_path': { prerender: true },
        //'/tools': { prerender: true },
        '/': { ssr: false },
        '/settings': { ssr: false },
        '/accounts': { ssr: false },
        '/user_admin': { ssr: false },
        '/system_admin': { ssr: false },
        '/plugin_user_growth_tasks': { ssr: false },
        '/plugin_loop_ban': { ssr: false },
        '/plugin_forum_support': { ssr: false }
    }
})
