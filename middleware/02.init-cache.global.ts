export default defineNuxtRouteMiddleware((to, from) => {
    const store = useMainStore()

    const authorization = store.authorization

    if (!authorization.startsWith('Basic ') || authorization === 'Basic ') {
        if (!store._cache?.config_page_login) {
            fetch(store.basePath + '/config/page/login')
                .then((res) => res.json())
                .then((res) => {
                    if (res.code !== 200) {
                        return
                    }
                    store.updateCache('config_page_login', res.data)
                    console.log(res)
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
                    if (res.code !== 200) {
                        store.logout()

                        if (['login', 'signup', 'reset'].includes(to.name as string)) {
                            return navigateTo(to.name || 'login')
                        } else {
                            return navigateTo('login')
                        }
                    }
                    store.updateCache('accountInfo', res.data)
                    store.updateAdminStatus()
                    console.log(res)

                    if (!store._cache?.accounts) {
                        fetch(store.basePath + '/account', {
                            headers: {
                                Authorization: authorization
                            }
                        })
                            .then((res) => res.json())
                            .then((res) => {
                                if (res.code !== 200) {
                                    return
                                }
                                store.updateCache('accounts', res.data)
                                console.log(res)
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
                                if (res.code !== 200) {
                                    return
                                }
                                store.updateCache('plugin_list', res.data)
                                console.log(res)
                            })
                    }
                })
        }
    }
})
