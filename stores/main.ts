interface MainStoreState {
    loading: boolean
    dark: boolean
    config: { [p in string]: any & { base_path: string; authorization: string } }
    _basePath: string
    admin: boolean
    _cache: { [p in string]: any } & {}
}

export const useMainStore = defineStore('main', {
    state: (): MainStoreState => ({
        loading: true,
        dark: false,
        config: {},
        _basePath: '',
        admin: false,
        _cache: {}
    }),
    getters: {
        rawAuthorization(): string {
            return this.config[this._basePath]?.authorization || ''
        },
        authorization(): string {
            return 'Bearer ' + this.config[this._basePath]?.authorization || ''
        },
        cache(): any {
            return this._cache
        },
        basePath(): string {
            return this._basePath
        },
        pidNameKV(): { [p in string]: string } {
            return Object.fromEntries((this._cache.accounts || []).map((account: { id: string; name: string }) => [account.id, account.name]))
        },
        configLength(): number {
            return Object.keys(this.config).length
        }
    },
    actions: {
        updateDarkMode(dark: boolean) {
            this.dark = dark
        },
        updateValue<T extends keyof MainStoreState>(k: T, v: MainStoreState[T]) {
            this.$state[k] = v
        },
        updateAuthorization(authorization: string) {
            if (this._basePath) {
                if (authorization) {
                    this.config[this._basePath].authorization = authorization
                } else {
                    this.config[this._basePath].authorization = ''
                }
                localStorage.setItem('tc_config', JSON.stringify(this.config))
            }
        },
        updateCache(k: string, v: any) {
            this.$state._cache[k] = v
        },
        updateAdminStatus() {
            this.admin = this._cache.accountInfo?.role === 'admin'
        },
        logout() {
            this.updateAuthorization('')

            this.admin = false
            this._cache = {}
        }
    }
})
