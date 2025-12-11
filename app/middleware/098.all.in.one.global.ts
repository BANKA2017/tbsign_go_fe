// try to fix an unknown bug
// maybe a loop cause the blank page

import { Request } from '~/share/Tools'

export default defineNuxtRouteMiddleware((to, from) => {
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
            Request(
                store.basePath + '/passport',
                {
                    headers: {
                        Authorization: authorization
                    }
                },
                to.name?.toString() || null
            )
                .then((res) => {
                    store.updateCache('accountInfo', res.data)
                    //console.log(res)

                    if (!store.cache?.accounts) {
                        Request(
                            store.basePath + '/account?array_mode=1',
                            {
                                headers: {
                                    Authorization: authorization
                                }
                            },
                            to.name?.toString() || null
                        ).then((res) => {
                            if (res.code !== 200) {
                                return
                            }
                            store.updateCache(
                                'accounts',
                                (res.data || []).map((account: any[]) => ({
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
                            //console.log(res)
                        })
                    }
                    if (!store.cache?.plugin_list) {
                        Request(
                            store.basePath + '/plugins',
                            {
                                headers: {
                                    Authorization: authorization
                                }
                            },
                            to.name?.toString() || null
                        ).then((res) => {
                            if (res.code !== 200) {
                                return
                            }
                            store.updateCache('plugin_list', res.data)
                            //console.log(res)
                        })
                    }
                })
                .catch((e) => {
                    store.logout()
                    navigateTo('/signin')
                    throw e
                })
        }
    }
})
