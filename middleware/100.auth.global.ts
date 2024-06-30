export default defineNuxtRouteMiddleware((to, from) => {
    if (import.meta.server) return

    // check status
    const store = useMainStore()

    const authorization = store.authorization

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
})
