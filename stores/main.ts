interface MainStoreState {
    now: Date
    dark: boolean
    _basePath: string
    _authorization: string
    admin: boolean
    _cache: { [p in string]: any }
}

export const useMainStore = defineStore('main', {
    state: (): MainStoreState => ({
        now: new Date(),
        dark: false,
        _basePath: 'http://192.168.123.41:1323',
        _authorization: '',
        admin: false,
        _cache: {}
    }),
    getters: {
        rawAuthorization(): string {
            return this.authorization
        },
        authorization(): string {
            return 'Basic ' + this._authorization
        },
        cache(): any {
            return this._cache
        },
        basePath(): string {
            return this._basePath
        },
        pidNameKV(): { [p in string]: string } {
            return Object.fromEntries((this._cache.accounts || []).map((account) => [account.id, account.name]))
        }
    },
    actions: {
        updateNow() {
            this.now = new Date()
        },
        updateDarkMode(dark: boolean) {
            this.dark = dark
        },
        updateValue<T extends keyof MainStoreState>(k: T, v: MainStoreState[T]) {
            this.$state[k] = v
        },
        updateCache(k: string, v: any) {
            this.$state._cache[k] = v
        },
        updateAdminStatus() {
            this.admin = this._cache.accountInfo?.role === 'admin'
        },
        logout() {
            this._authorization = ''
            this.admin = false
            this._cache = {}
        }
    }
})
