export default defineNuxtRouteMiddleware((to, from) => {
    if (['login', 'signup', 'reset'].includes(to.name as string)) {
        return
    }

    // check status
    const store = useMainStore()
    const authorization = store.authorization

    if (!authorization.startsWith('Basic ') || authorization === 'Basic ') {
        return navigateTo('login')
    }

    console.log(to, from)
    // In a real app you would probably not redirect every route to `/`
    // however it is important to check `to.path` before redirecting or you
    // might get an infinite redirect loop
    //if (to.path !== '/') {
    //  return navigateTo('/login')
    //}
})
