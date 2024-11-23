import Noty from 'noty'

export const Notice = (text: string = '', type: Noty.Type = 'success', timeout: number = 1500) => {
    new Noty({
        text,
        type,
        timeout,
        theme: 'nest',
        layout: 'topRight',
        progressBar: true,
        closeWith: ['click']
    }).show()
}

export const Request = async (input: string | URL | globalThis.Request, init?: RequestInit, routeName?: string | null): Promise<any> => {
    const store = useMainStore()
    if (routeName === undefined) {
        const route = useRoute()
        routeName = route.name?.toString()
    }
    store.updateValue('loading', true)
    return fetch(input, init)
        .then((res) => {
            store.updateValue('loading', false)
            return res.json()
        })
        .then((res) => {
            if (init?.headers?.Authorization !== '' && res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                if (['signin', 'signup', 'reset_password', 'add_base_path'].includes(routeName || '')) {
                    navigateTo(routeName)
                } else {
                    navigateTo('/signin')
                }
            }
            return res
        })
        .catch((e) => {
            store.updateValue('loading', false)
            throw e
        })
}
