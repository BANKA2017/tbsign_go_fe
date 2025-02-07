interface MainStoreState {
    loading: boolean
    dark: boolean
    config: { [p in string]: any & { base_path: string; authorization: string } }
    _basePath: string
    _cache: { [p in string]: any } & {
        config_page_login?: { [p in string]: string | boolean }
        accountInfo?: {
            uid: number
            name: string
            email: string
            avatar: string
            role: string
            ntfy_topic: string
            bark_key: string
            pushdeer_key: string
            push_type: string
            daily_report: '' | '0' | '1'
            system_settings: { [p in string]: string }
        }
        accounts?: {
            id: number
            uid: number
            bduss: string
            stoken: string
            name: string
            portrait: string
        }[]
        plugin_list?: {
            name: string
            ver: string
            status: boolean
            plugin_name_cn: string
            plugin_name_cn_short: string
            plugin_name_fe: string
            setting_options: {
                option_name: string
                option_name_cn: string
            }[]
        }[]
    }
    size: {
        innerHeight: number
        innerWidth: number
    }
}

export const useMainStore = defineStore('main', {
    state: (): MainStoreState => ({
        loading: true,
        dark: false,
        config: {},
        _basePath: '',
        _cache: {},
        size: {
            innerHeight: 0,
            innerWidth: 0
        }
    }),
    getters: {
        rawAuthorization(): string {
            return this.config[this._basePath]?.authorization || ''
        },
        authorization(): string {
            return this.config[this._basePath]?.authorization || ''
        },
        cache(): any {
            return this._cache
        },
        basePath(): string {
            return this._basePath
        },
        pidNameKV(): { [p in string]: string } {
            return Object.fromEntries((this._cache.accounts || []).map((account) => [account.id, account.name]))
        },
        configLength(): number {
            return Object.keys(this.config).length
        },
        admin(): boolean {
            return this._cache.accountInfo?.role === 'admin'
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
            if (this._basePath && this.config[this._basePath]) {
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
        logout() {
            this.updateAuthorization('')
            this._cache = {
                config_page_login: this._cache?.config_page_login || undefined
            }
        },
        updateSize() {
            if (typeof window === 'undefined') {
                return
            }
            this.size.innerHeight = window.innerHeight
            this.size.innerWidth = window.innerWidth
        }
    }
})
