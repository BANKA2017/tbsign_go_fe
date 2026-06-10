// try to fix an unknown bug
// maybe a loop cause the blank page

import { Request } from '~/share/Tools'
import { Notice } from '~/share/Tools.js'

export default defineNuxtRouteMiddleware(async (to, from) => {
    if (import.meta.server) return

    // endpoint

    const importEndpoint = (from.query?.endpoint || '').toString()

    // check status
    const store = useMainStore()
    const runtimeConfig = useRuntimeConfig()
    const privateSite = !!runtimeConfig.public.NUXT_BASE_PATH

    if (!store.basePath) {
        try {
            let tmpBasePath = runtimeConfig.public.NUXT_BASE_PATH || importEndpoint || localStorage.getItem('tc_base_path') || ''
            if (tmpBasePath.endsWith('/')) {
                tmpBasePath = tmpBasePath.replace(/\/+$/, '')
            }

            store.updateValue('_basePath', tmpBasePath)
        } catch (e) {
            console.error(e)
        }

        let config: { [p in string]: any } = {}
        if (store.configLength === 0) {
            try {
                config = JSON.parse(localStorage.getItem('tc_config') || '{}')
            } catch (e) {
                console.error(e)
            }
        }
        try {
            delete config['']
            if (!config[store.basePath]) {
                config[store.basePath] = { authorization: '' }
            }
            store.updateValue('config', config)
            if (store.config[store.basePath]?.authorization) {
                store.updateAuthorization(store.config[store.basePath]?.authorization)
            }
            localStorage.setItem('tc_config', JSON.stringify(store.config))
        } catch (e) {
            console.error(e)
        }

        let validPath = false
        try {
            new URL(store.basePath)
            validPath = true
        } catch {}

        if ((!store.basePath || (!privateSite && !validPath)) && !['add-base-path'].includes(to.name as string)) {
            return navigateTo('/add-base-path')
        }
    }

    // auth
    let authorization = store.authorization

    const useCookieToken = privateSite && runtimeConfig.public.NUXT_USE_COOKIE_TOKEN && authorization === 'cookie-token'

    if (!useCookieToken && (authorization || '').split(':').length !== 3) {
        if (!['signin', 'signup', 'reset-password', 'add-base-path'].includes(to.name as string)) {
            return navigateTo('/signin')
        }
    } else if (['signin', 'signup', 'reset-password'].includes(to.name as string)) {
        return navigateTo('/')
    }

    // console.log(to, from)
    // In a real app you would probably not redirect every route to `/`
    // however it is important to check `to.path` before redirecting or you
    // might get an infinite redirect loop
    //if (to.path !== '/') {
    //  return navigateTo('/signin')
    //}

    // init-cache

    if (to.name === 'add-base-path') {
        return
    }

    if (!store.basePath) {
        return navigateTo('/add-base-path')
    }

    if (!useCookieToken && (authorization || '').split(':').length !== 3) {
        if (!store.cache?.config_page_login) {
            Request(store.basePath + '/config/page/login', {}, to.name?.toString() || null).then((res) => {
                if (res.code !== 200) {
                    return
                }
                store.updateCache('config_page_login', res.data)
                //console.log(res)
            })
        }
    } else {
        if (!store.cache?.accountInfo) {
            try {
                const accountInfo = await Request(
                    store.basePath + '/passport',
                    {
                        headers: {
                            Authorization: authorization
                        }
                    },
                    to.name?.toString() || null
                )
                store.updateCache('accountInfo', accountInfo.data)
                //console.log(res)

                if (!store.cache?.accounts) {
                    const accounts = await Request(
                        store.basePath + '/account?array_mode=1',
                        {
                            headers: {
                                Authorization: authorization
                            }
                        },
                        to.name?.toString() || null
                    )

                    if (accounts.code === 200) {
                        store.updateCache(
                            'accounts',
                            (accounts.data || []).map((account: any[]) => ({
                                id: account[0],
                                uid: account[1],
                                name: account[2],
                                portrait: account[3],
                                page: 0,
                                more: false,
                                filter: 'all',
                                search: ''
                            }))
                        )
                    }
                }
                if (!store.cache?.plugin_list) {
                    const plugins = await Request(
                        store.basePath + '/plugins',
                        {
                            headers: {
                                Authorization: authorization
                            }
                        },
                        to.name?.toString() || null
                    )
                    if (plugins.code === 200) {
                        store.updateCache('plugin_list', plugins.data)
                    }
                }
            } catch (e) {
                store.logout()
                navigateTo('/signin')
                throw e
            }
        }

        // admin && plugin
        const routeName = to.name?.toString() || ''
        if (routeName.startsWith('admin') && !store.admin) {
            Notice('无效用户组', 'error')
            return navigateTo('/')
        } else if (routeName.startsWith('plugin-')) {
            const pluginNameFE = routeName.replace(/^plugin\-/, '')
            const plugin = Object.values(store?._cache?.plugin_list || {}).find((plugin) => plugin.plugin_name_fe === pluginNameFE)

            if (!plugin?.status) {
                Notice('插件不可用', 'error')
                return navigateTo('/')
            }
        }
    }
})
