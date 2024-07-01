<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="flex justify-center">
                <div class="rounded-2xl p-5 flex grow flex-col gap-2 max-w-[32em]">
                    <div>
                        <h4 class="mb-2">API 端点列表</h4>
                        <div class="flex justify-between" v-for="endpoint in endpointList" :key="endpoint">
                            <span class="py-2">{{ endpoint }}</span>
                            <button role="button" class="px-3 py-0.5 hover:bg-pink-500 hover:text-gray-100 rounded-lg transition-colors" @click="deleteEndpoint(endpoint)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
                                    <path
                                        fill="currentColor"
                                        d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8L4.646 5.354a.5.5 0 0 1 0-.708"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <label for="base-path">API 端点 (不带尾斜杠，示例: http://example.com)</label>
                    <input class="bg-gray-100 dark:bg-black rounded-xl" id="base-path" type="text" name="base_path" v-model="basePath" />
                    <button class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl" @click="saveEndpoint">保存</button>
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>
<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

const store = useMainStore()
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
        if (store.basePath === endpoint) {
            basePath.value = Object.keys(config.value)?.[0] || ''
            saveEndpoint()
        }
    }
}

const saveEndpoint = () => {
    if (basePath.value.endsWith('/')) {
        basePath.value = basePath.value.replace(/\/+$/, '')
    }
    store.updateCache('config_page_login', undefined)
    if (config.value[basePath.value]) {
        localStorage.setItem('tc_base_path', basePath.value)
        store.updateValue('_basePath', basePath.value)
    } else {
        let _config = config.value
        _config[basePath.value] = { authorization: '' }
        config.value = _config
        localStorage.setItem('tc_base_path', basePath.value)
        store.updateValue('_basePath', basePath.value)
    }
}

const basePath = ref<string>('')
</script>
