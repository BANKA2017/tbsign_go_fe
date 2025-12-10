// https://nuxt.com/docs/api/configuration/nuxt-config

const proxyPath = process.env.NUXT_DEV_API_PROXY_BASE_PATH || ''
let nuxtRouteRules: { [p in string]: any } = {}
if (proxyPath) {
    nuxtRouteRules['/api/**'] = { proxy: proxyPath + '/**' }
}

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
            NUXT_COMMIT_HASH: process.env.NUXT_COMMIT_HASH,
            NUXT_USE_COOKIE_TOKEN: !!process.env.NUXT_USE_COOKIE_TOKEN,
            NUXT_ACCOUNT_FORUM_LIST_ONE_PAGE_COUNT: parseInt(process.env.NUXT_ACCOUNT_FORUM_LIST_ONE_PAGE_COUNT || '100', 10)
        }
    },

    modules: [
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
        dirs: ['./app/stores']
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
        '/': { ssr: false },
        '/settings': { ssr: false },
        '/accounts': { ssr: false },
        '/user_admin': { ssr: false },
        '/system_admin': { ssr: false }
    },

    app: {
        head: {
            htmlAttrs: {
                lang: 'zh'
            },
            title: '贴吧云签到',
            script: [
                {
                    innerHTML: `d=localStorage.darkMode||'0';dc=document;m=dc.createElement('meta');m.name='color-scheme';c=dc.documentElement.classList;v=c.value==='';if((d==='0'&&matchMedia('(prefers-color-scheme:dark)').matches&&v)||(d==='2'&&v)){c.add('dark');m.content='dark';dc.head.appendChild(m)}else{m.content='light';dc.head.appendChild(m)}`
                }
            ]
        }
    },

    routeRules: nuxtRouteRules,

    compatibilityDate: '2024-11-10'
})
