// try to fix an unknown bug
// maybe a loop cause the blank page

export default defineNuxtRouteMiddleware((to, from) => {
    if (import.meta.server) return

    // endpoint

    const importEndpoint = (from.query?.endpoint || '').toString()

    // check status
    const store = useMainStore()

    if (store.basePath) {
        return
    }

    if (!store.basePath) {
        try {
            let tmpBasePath = importEndpoint || localStorage.getItem('tc_base_path') || ''
            if (tmpBasePath.endsWith('/')) {
                tmpBasePath = tmpBasePath.replace(/\/+$/, '')
            }

            store.updateValue('_basePath', tmpBasePath)
        } catch (e) {
            console.error(e)
        }
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

    if ((!store.basePath || !validPath) && !['add_base_path'].includes(to.name as string)) {
        return navigateTo('add_base_path')
    }

    // auth

    let authorization = store.authorization

    if (!authorization.startsWith('Bearer ') || authorization === 'Bearer ') {
        if (['login', 'signup', 'reset_password', 'add_base_path'].includes(to.name as string)) {
            return
        }
        return navigateTo('login')
    } else if (['login', 'signup', 'reset_password'].includes(to.name as string)) {
        return navigateTo('/')
    }

    // console.log(to, from)
    // In a real app you would probably not redirect every route to `/`
    // however it is important to check `to.path` before redirecting or you
    // might get an infinite redirect loop
    //if (to.path !== '/') {
    //  return navigateTo('/login')
    //}

    // init-cache

    if (to.name === 'add_base_path') {
        return
    }

    authorization = store.authorization
    if (!store.basePath) {
        return navigateTo('add_base_path')
    }

    if (!authorization.startsWith('Bearer ') || authorization === 'Bearer ') {
        if (!store._cache?.config_page_login) {
            fetch(store.basePath + '/config/page/login')
                .then((res) => res.json())
                .then((res) => {
                    if (res.code !== 200) {
                        return
                    }
                    store.updateCache('config_page_login', res.data)
                    //console.log(res)
                })
        }
    } else {
        if (!store._cache?.accountInfo) {
            fetch(store.basePath + '/passport', {
                headers: {
                    Authorization: authorization
                }
            })
                .then((res) => res.json())
                .then((res) => {
                    if (res.code === 401) {
                        store.logout()
                        if (['login', 'signup', 'reset_password', 'add_base_path'].includes(to.name as string)) {
                            return navigateTo(to.name as string)
                        } else {
                            return navigateTo('login')
                        }
                    }
                    store.updateCache('accountInfo', res.data)
                    store.updateAdminStatus()
                    //console.log(res)

                    if (!store._cache?.accounts) {
                        fetch(store.basePath + '/account', {
                            headers: {
                                Authorization: authorization
                            }
                        })
                            .then((res) => res.json())
                            .then((res) => {
                                if (res.code === 401) {
                                    store.logout()
                                    if (['login', 'signup', 'reset_password', 'add_base_path'].includes(to.name as string)) {
                                        return navigateTo(to.name as string)
                                    } else {
                                        return navigateTo('login')
                                    }
                                }
                                if (res.code !== 200) {
                                    return
                                }
                                store.updateCache('accounts', res.data)
                                //console.log(res)
                            })
                    }
                    if (!store._cache?.plugin_list) {
                        fetch(store.basePath + '/plugins', {
                            headers: {
                                Authorization: store.authorization
                            }
                        })
                            .then((res) => res.json())
                            .then((res) => {
                                if (res.code === 401) {
                                    store.logout()
                                    if (['login', 'signup', 'reset_password', 'add_base_path'].includes(to.name as string)) {
                                        return navigateTo(to.name as string)
                                    } else {
                                        return navigateTo('login')
                                    }
                                }
                                if (res.code !== 200) {
                                    return
                                }
                                store.updateCache('plugin_list', res.data)
                                //console.log(res)
                            })
                    }
                })
        }
    }
})
