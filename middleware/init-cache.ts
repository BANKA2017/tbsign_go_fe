export default defineNuxtRouteMiddleware(() => {
    const store = useMainStore()

    const authorization = store.authorization

    if (!authorization.startsWith('Basic ') || authorization === 'Basic ') {
        return
    }

    if (!store._cache?.accountInfo) {
        fetch(store.basePath + '/passport', {
            headers: {
                Authorization: authorization
            }
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.code !== 200) {
                    return
                }
                store.updateCache('accountInfo', res.data)
                store.updateAdminStatus()
                console.log(res)
            })
    }
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
})
