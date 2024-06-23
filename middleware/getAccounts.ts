export default defineNuxtRouteMiddleware(() => {
    const store = useMainStore()

    const authorization = store.authorization

    if (!authorization.startsWith('Basic ') || authorization === 'Basic ') {
        return
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
