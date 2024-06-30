export default defineNuxtRouteMiddleware((to, from) => {
    if (import.meta.server) return

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
})
