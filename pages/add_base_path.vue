<template>
    <div class="flex justify-center">
        <div class="rounded-2xl p-5 flex grow flex-col gap-2 max-w-[32em]">
            <div v-if="runtimeConfig.public.NUXT_BASE_PATH">
                <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-2">不允许修改专有实例的端点</div>
            </div>
            <div v-else>
                <h4 class="mb-2">站点列表</h4>
                <div
                    role="button"
                    @click="saveEndpoint(endpoint)"
                    :class="'flex justify-between rounded-lg transition-colors hover:bg-sky-500 hover:text-gray-100 pl-2 ' + (endpoint === storeBasePath ? 'bg-sky-500 text-gray-100' : '')"
                    v-for="endpoint in endpointList"
                    :key="endpoint"
                >
                    <span class="py-2">{{ endpoint }}</span>
                    <button
                        role="button"
                        class="px-3 py-0.5 hover:bg-pink-500 hover:text-gray-100 rounded-lg transition-colors"
                        @click="
                            (e) => {
                                e.stopPropagation()
                                deleteEndpoint(endpoint)
                            }
                        "
                    >
                        <uno-icon class="i-bi:x" />
                    </button>
                </div>
                <form class="mt-5 w-full">
                    <label for="base-path" class="mt-5">API 端点 (不带尾斜杠，示例: http://example.com)</label>
                    <input class="bg-gray-100 dark:bg-gray-900 rounded-xl w-full my-2" id="base-path" type="text" name="base_path" v-model="basePath" />
                    <input
                        type="submit"
                        role="button"
                        class="text-gray-100 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600"
                        @click="
                            (e) => {
                                e.preventDefault()
                                saveEndpoint(basePath)
                            }
                        "
                        value="保存"
                    />
                </form>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
const store = useMainStore()
const runtimeConfig = useRuntimeConfig()
const storeBasePath = computed(() => store.basePath)
const config = computed({
    get() {
        return Object.fromEntries(Object.entries(store.config).filter((c) => c[0]))
    },
    set(value) {
        store.updateValue('config', value)
        localStorage.setItem('tc_config', JSON.stringify(value))
    }
})
const endpointList = computed(() => Object.keys(config.value))

const deleteEndpoint = (endpoint = '') => {
    if (endpoint && config.value[endpoint]) {
        let _config = config.value
        delete _config[endpoint]
        config.value = _config
        saveEndpoint('')
    }
}

const saveEndpoint = (endpoint: string = '') => {
    if (endpoint.endsWith('/')) {
        endpoint = endpoint.replace(/\/+$/, '')
    }
    basePath.value = endpoint
    store.updateCache('config_page_login', undefined)

    if (endpoint && !config.value[endpoint]) {
        let _config = config.value
        _config[endpoint] = { authorization: '' }
        config.value = _config
    }

    localStorage.setItem('tc_base_path', endpoint)
    store.updateValue('_basePath', endpoint)
}

const basePath = ref<string>('')
</script>
