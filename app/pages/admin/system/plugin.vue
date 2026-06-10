<script setup lang="ts">
import SystemPanelTab from '~/components/SystemPanelTab.vue'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const isAdmin = computed(() => store.admin)
const pluginList = computed({
    get: () => store.cache?.plugin_list || {},
    set: (newValue) => {
        store.updateCache('plugin_list', newValue)
    }
})

const pluginGroup = computed(() => Object.fromEntries(Object.values(pluginList.value).map((plugin) => [plugin.name, plugin.plugin_name_cn])))

// String(key || '').endsWith('_action_limit')
// ver4_ban_break_check: '跳过吧务权限检查（循环封禁）',
// ver4_ban_limit: '...'
const pluginSettings = ref<{
    [p in string]: {
        [q in string]: {
            option_name: string
            option_name_cn: string
            value: string
        }
    }
}>({})

const activePluginSettingsModal = ref<string>('')
const GetPluginSettings = () => {
    Request(store.basePath + '/admin/plugin/' + activePluginSettingsModal.value + '/settings', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            return Notice(res.message, 'error')
        }
        pluginSettings.value[activePluginSettingsModal.value] = res.data
        //console.log(res)
    })
}

const SavePluginSettings = (e: Event) => {
    e.preventDefault()
    Request(store.basePath + '/admin/plugin/' + activePluginSettingsModal.value + '/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams(Object.fromEntries(Object.entries(pluginSettings.value?.[activePluginSettingsModal.value] || {}).map((setting) => [setting[0], setting[1].value]))).toString()
    }).then((res) => {
        if (res.code !== 200) {
            return Notice(res.message, 'error')
            //console.log(res)
        }

        if (res.message !== 'OK') {
            const savedKeys = Object.keys(res.data)
            Notice((savedKeys.length ? '部分设置已保存:<br />' + savedKeys.join(', ') + '<br /><br />' : '') + '以下设置未保存:<br />' + res.message.split('\n').join('<br /><br />'), 'error', 5000)
            console.error(res.message)
        } else {
            Notice('设置已保存', 'success')
        }
        //console.log(res)
    })
}

const pluginSwitch = (pluginName = '') => {
    const pluginNameList = Object.keys(pluginList.value)
    if (!pluginNameList.includes(pluginName)) {
        return
    }
    Request(store.basePath + '/admin/plugin/' + pluginName + '/switch', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            return Notice(res.message, 'error')
        }
        if (res.data?.exists) {
            let tmpPluginList = JSON.parse(JSON.stringify(pluginList.value))
            tmpPluginList[pluginName].status = res.data?.status || false
            tmpPluginList[pluginName].ver = res.data?.version || -1
            pluginList.value = tmpPluginList
        }
        //console.log(res)
    })
}

const pluginDelete = (pluginName = '') => {
    const pluginNameList = Object.keys(pluginList.value)
    if (!pluginNameList.includes(pluginName)) {
        return
    }
    Request(store.basePath + '/admin/plugin/' + pluginName, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            return Notice(res.message, 'error')
        }
        if (res.data?.version === -1) {
            let tmpPluginList = JSON.parse(JSON.stringify(pluginList.value))
            tmpPluginList[pluginName].ver = '-1'
            tmpPluginList[pluginName].status = res.data?.status || false
            pluginList.value = tmpPluginList
        }
        //console.log(res)
    })
}
</script>

<template>
    <div v-if="isAdmin">
        <div class="my-2 rounded-2xl">
            <SystemPanelTab active-component="plugin" />
        </div>

        <div class="my-2 rounded-2xl">
            <div class="px-3 py-2">
                <h2 class="text-xl font-bold">插件</h2>
            </div>
            <div class="p-3 bg-gray-200 dark:bg-gray-800 rounded-xl">
                <template v-for="(value, pluginName, index) in pluginList" :key="pluginName">
                    <hr v-if="index > 0" class="border-gray-400 dark:border-gray-600 my-2" />
                    <div class="grid grid-cols-2 gap-3">
                        <div class="col-span-2 xs:col-span-1 xs:py-1.5">
                            <span class="px-1.5 rounded bg-sky-500 dark:bg-sky-700 text-sm text-gray-100 mr-2">{{ value?.ver ? (value?.ver !== '-1' ? value.ver : 'und') : 'dev' }}</span>
                            <span class="font-bold">{{ pluginGroup[pluginName] || pluginName }}</span>
                        </div>
                        <div class="col-span-2 xs:col-span-1 xs:text-end">
                            <button
                                :class="{
                                    'px-3': true,
                                    'py-1': true,
                                    'bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400': value.status,
                                    'bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400': !value.status,
                                    'text-gray-100': true,
                                    'transition-colors': true,
                                    rounded: true,
                                    'inline-block': true,
                                    'm-0.5': true
                                }"
                                @click="pluginSwitch(pluginName)"
                            >
                                {{ value.status ? '已开启' : value.ver === '-1' ? '未安装' : '已关闭' }}
                            </button>
                            <Modal class="inline-block text-start" :title="'确认卸载插件: ' + (pluginGroup[pluginName] || pluginName) + ' ？'" :aria-label="'确认卸载插件: ' + (pluginGroup[pluginName] || pluginName) + ' ？'" v-if="value.ver !== '-1'">
                                <template #default>
                                    <button class="m-0.5 px-3 py-1 bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 text-gray-100 transition-colors rounded">卸载</button>
                                </template>
                                <template #container>
                                    <button class="bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="pluginDelete(pluginName)">确认卸载 {{ pluginGroup[pluginName] }} ({{ pluginName }})</button>
                                </template>
                            </Modal>
                            <Modal
                                class="inline-block text-start"
                                :title="pluginGroup[pluginName] || pluginName"
                                :aria-label="'设置' + (pluginGroup[pluginName] || pluginName)"
                                v-if="value.ver !== '-1'"
                                @active-callback="
                                    (c) => {
                                        if (!c) {
                                            activePluginSettingsModal = ''
                                        }
                                    }
                                "
                            >
                                <template #default>
                                    <button
                                        class="m-0.5 px-3 py-1 text-gray-100 transition-colors rounded bg-gray-500 hover:bg-gray-600 dark:hover:bg-gray-400 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
                                        :disabled="(pluginList[pluginName]?.setting_options || []).length === 0 || !pluginList[pluginName]?.status"
                                        @click="
                                            () => {
                                                activePluginSettingsModal = pluginName
                                                GetPluginSettings()
                                            }
                                        "
                                    >
                                        设置
                                    </button>
                                </template>
                                <template #container>
                                    <form autocomplete="off">
                                        <template v-for="(pluginSetting, index) in pluginSettings?.[pluginName] || []" :key="pluginSetting.option_name">
                                            <label :for="'input-' + pluginSetting.option_name" class="block text-sm font-medium mb-1 mt-3">{{ pluginSetting.option_name_cn }}</label>
                                            <input
                                                :id="'input-' + pluginSetting.option_name"
                                                v-if="
                                                    ['ver4_ban_limit', 'ver4_ref_interval', 'kd_forum_like_forum_limit_each_pid', 'kd_forum_like_cooldown_time_pid', 'kd_forum_like_cooldown_time_fname'].includes(pluginSetting.option_name) ||
                                                    String(pluginSetting.option_name || '').endsWith('_action_limit')
                                                "
                                                type="number"
                                                min="0"
                                                class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                                v-model="pluginSettings[pluginName][index].value"
                                            />
                                            <select
                                                :id="'input-' + pluginSetting.option_name"
                                                v-else-if="pluginSetting.option_name === 'ver4_ban_break_check'"
                                                class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                                v-model="pluginSettings[pluginName][index].value"
                                            >
                                                <option value="0">否</option>
                                                <option value="1">是</option>
                                            </select>
                                            <input
                                                :id="'input-' + pluginSetting.option_name"
                                                v-else
                                                type="text"
                                                class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                                v-model="pluginSettings[pluginName][index].value"
                                            />
                                        </template>

                                        <input type="submit" role="button" class="text-gray-100 text-lg bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded mt-5 px-5 py-1 transition-colors" @click="SavePluginSettings" value="保存" />
                                    </form>
                                </template>
                            </Modal>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
