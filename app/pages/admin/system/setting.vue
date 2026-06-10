<script setup lang="ts">
import Collapse from '~/components/Collapse.vue'
import SystemPanelTab from '~/components/SystemPanelTab.vue'
import { buffer_to_base64 } from '~/share/crypto'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const isAdmin = computed(() => store.admin)

const serverSettings = ref<{ [p in string]: any }>({})
const serverSettingsSaved = ref<{ [p in string]: any }>({})
const signMode = computed({
    get() {
        return (serverSettings.value['sign_mode'] || '').split(',')
    },
    set(value: string[]) {
        serverSettings.value['sign_mode'] = value.join(',')
    }
})

const settingsGroup = ref<{
    [p in string]: {
        name: string
        data: { [q in string]: string }
    }
}>({
    system: {
        name: '系统',
        data: {
            ann: '公告',
            icp: '备案号',
            system_url: '地址',
            system_name: '网站名称（SEO）',
            system_keywords: '关键词（SEO）',
            system_description: '简介（SEO）',
            footer: '自定义底部信息（支持 HTML）',
            go_favicon: '/favicon.ico',
            go_robots_txt: '/robots.txt'
        }
    },
    account: {
        name: '账号',
        data: { enable_reg: '开启注册', yr_reg: '邀请码 (留空代表无需邀请码)', cktime: 'Session 有效期 (设置后签发的 Token 才生效)' }
    },
    backup: {
        name: '备份',
        data: { go_export_personal_data: '允许导出个人数据', go_import_personal_data: '允许导入个人数据' }
    },
    checkin: {
        name: '签到',
        data: {
            sign_mode: '签到模式',
            sign_hour: '下个整点签到 (-1 为 0 时开始签到，以此类推)',
            cron_limit: '单次单账号签到贴吧数量 (单次签到行为贴吧数量上限为 此值*3)',
            sign_sleep: '签到时间间隔 (ms)',
            sign_multith: '同时签到 Goroutine 数 (默认 10)',
            retry_max: '最大重签次数',
            go_re_check_in_max_interval: '最大重签间隔 (分钟)',
            go_forum_sync_policy: '贴吧同步策略',

            bduss_num: '最大允许用户添加账号数，0为无限，管理员不受限制' //，-1为禁止绑定'
            // "tb_max": '最大关注贴吧数量，0为不限'
        }
    },
    mail: {
        name: '邮件',
        data: { mail_name: '发件人邮箱', mail_yourname: '发件人名称', mail_host: 'SMTP服务器地址', mail_port: 'SMTP服务器端口', mail_secure: '加密方式', mail_auth: '需要身份验证', mail_smtpname: 'SMTP用户名', mail_smtppw: 'SMTP密码（留空不更改）' }
    },
    push: {
        name: '推送',
        data: { go_bark_addr: 'Bark 推送地址', go_ntfy_addr: 'ntfy 推送地址', go_pushdeer_addr: 'PushDeer 推送地址', go_daily_report_hour: '每日签到报告推送时间（填写 0~23 时或 -1 关闭推送）' }
    }
})

const settingKeysEmptyNoChange = ['go_favicon', 'mail_smtppw']

const dragStatus = ref<boolean>(false)

const dragEvent = (e: Event) => {
    e.preventDefault()
    switch (e.type) {
        case 'dragenter':
            dragStatus.value = true
            break
        case 'dragleave':
            //case 'dragend':
            dragStatus.value = false
            break
    }
}

const dropEvent = async (e: DragEvent) => {
    e.preventDefault()
    dragStatus.value = false
    if (e.dataTransfer?.files) {
        handleFiles(e.dataTransfer.files)
    }
}

const handleFiles = async (files: FileList) => {
    let icoStatus = false
    for (const file of files) {
        if (!icoStatus) {
            if (file.size === 0 || file.type !== 'image/x-icon') {
                return Notice('没有符合的 .ico 文件', 'error')
            }

            const reader = new FileReader()
            reader.onload = () => {
                const buffer = reader.result as ArrayBuffer | null

                if (buffer) {
                    serverSettings.value['go_favicon'] = 'data:image/x-icon;base64,' + buffer_to_base64(buffer)
                }

                icoStatus = true
            }

            reader.readAsArrayBuffer(file)
        }

        if (icoStatus) {
            return
        }
    }
}

const lastUpdated = ref<number>(Date.now())

const SaveSettings = (e: Event) => {
    e.preventDefault()

    let diffSettings: { [p in string]: string } = {}
    for (const k in serverSettingsSaved.value) {
        // console.log(k,serverSettingsSaved.value[k] , serverSettings.value[k])
        if (serverSettingsSaved.value[k] !== serverSettings.value[k]) {
            diffSettings[k] = serverSettings.value[k]
        }
    }

    Request(store.basePath + '/admin/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams(diffSettings).toString()
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

        for (const k in res.data) {
            if (settingKeysEmptyNoChange.includes(k)) {
                res.data[k] = ''
                if (k === 'go_favicon') {
                    lastUpdated.value = Date.now()
                }
            } else {
                serverSettingsSaved.value[k] = res.data[k]
            }
        }

        serverSettings.value = JSON.parse(JSON.stringify(serverSettingsSaved.value))
        //console.log(res)
    })
}

const ResetSetting = (name = '') => {
    if (!serverSettings.value[name] && !settingKeysEmptyNoChange.includes(name)) {
        return
    }

    Request(store.basePath + '/admin/settings/' + name + '/reset', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            return Notice(res.message, 'error')
            //console.log(res)
        }
        Notice(name + ' 已重置', 'success')

        for (const k in res.data) {
            if (settingKeysEmptyNoChange.includes(k)) {
                res.data[k] = ''
                if (k === 'go_favicon') {
                    lastUpdated.value = Date.now()
                }
            } else {
                serverSettingsSaved.value[k] = res.data[k]
            }
        }

        serverSettings.value = JSON.parse(JSON.stringify(serverSettingsSaved.value))
        //console.log(res)
    })
}

const sendTestMail = (_type: string = 'email') => {
    Request(store.basePath + '/admin/service/push/mail/test?type=' + _type, {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => {
            if (res.code !== 200) {
                return Notice(res.message, 'error')
            }
            Notice('测试消息已发送', 'success')
            //console.log(res)
        })
        .catch((e) => {
            Notice(e.toString(), 'error')
            console.error(e)
        })
}

const loading = ref<boolean>(false)

const syncSettings = () => {
    loading.value = true
    Request(store.basePath + '/admin/settings', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                return Notice(res.message, 'error')
            }

            for (const key of settingKeysEmptyNoChange) {
                res.data[key] = ''
            }

            serverSettings.value = JSON.parse(JSON.stringify(res.data))
            serverSettingsSaved.value = JSON.parse(JSON.stringify(res.data))
            //console.log(res)
        })
        .finally(() => {
            loading.value = false
        })
}

onMounted(() => {
    syncSettings()
})
</script>

<template>
    <div v-if="isAdmin">
        <div class="my-2 rounded-2xl">
            <SystemPanelTab active-component="setting" />
        </div>

        <div class="my-2 rounded-2xl">
            <div class="px-3 py-2">
                <h2 class="text-xl font-bold">软件设置</h2>
                <p class="text-sm">如果不知道要填什么，请保持原样</p>
            </div>
            <form autocomplete="off">
                <template v-for="(_set, _set_id) in settingsGroup" :key="_set_id">
                    <a :id="_set_id"></a>
                    <Collapse>
                        <template #default>
                            {{ _set.name }}
                        </template>
                        <template #container>
                            <template v-for="(name, key) in _set.data" :key="key">
                                <label :for="'input-' + key" class="block text-sm font-medium mb-1 mt-3">{{ name }}</label>
                                <div v-if="['go_favicon'].includes(key)" class="flex w-full rounded-xl">
                                    <label
                                        :for="'input-' + key"
                                        :class="{
                                            'bg-gray-100 dark:bg-gray-900 grow cursor-pointer select-none rounded-l-xl': true,
                                            'border-gray-400 border-dashed hover:border-dotted border-2': !serverSettings[key],
                                            'border-gray-400 dark:border-gray-600 border-2': serverSettings[key]
                                        }"
                                    >
                                        <div @dragenter="dragEvent" @dragleave="dragEvent" @dragover="dragEvent" @drop="dropEvent">
                                            <div class="pointer-events-none py-1 rounded-lg px-2">
                                                <img alt="当前 favicon" :src="serverSettings[key] ? serverSettings[key] : '/favicon.ico?_=' + lastUpdated" class="w-[32px] h-[32px]" />
                                                <input
                                                    type="file"
                                                    class="sr-only h-0"
                                                    :id="'input-' + key"
                                                    lang="zh"
                                                    @change="
                                                        async (e) => {
                                                            e.preventDefault()
                                                            handleFiles(e.target?.files || [])
                                                            if (e?.target?.value) {
                                                                e.target.value = ''
                                                            }
                                                        }
                                                    "
                                                />
                                            </div>
                                        </div>
                                    </label>
                                    <button
                                        type="button"
                                        class="inline-block px-3 py-1 rounded-r-xl border transition-colors border-gray-500 hover:bg-pink-500 hover:text-gray-100"
                                        @click="
                                            (e) => {
                                                e.preventDefault()
                                                if (serverSettings[key]) {
                                                    serverSettings[key] = ''
                                                } else {
                                                    ResetSetting(key)
                                                }
                                            }
                                        "
                                    >
                                        {{ dragStatus ? '待释放' : serverSettings[key] ? '删除' : '重置' }}
                                    </button>
                                </div>
                                <textarea
                                    :id="'input-' + key"
                                    v-else-if="['system_description', 'ann', 'go_robots_txt', 'footer'].includes(key)"
                                    class="form-textarea placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                    rows="8"
                                    v-model="serverSettings[key]"
                                />
                                <select
                                    :id="'input-' + key"
                                    v-else-if="key === 'sign_mode'"
                                    multiple
                                    class="form-multiselect placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                    v-model="signMode"
                                >
                                    <option value="1">模拟手机客户端签到</option>
                                    <option value="2">手机网页签到</option>
                                    <option value="3">网页签到</option>
                                </select>
                                <select
                                    :id="'input-' + key"
                                    v-else-if="['enable_reg', 'ver4_ban_break_check', 'go_export_personal_data', 'go_import_personal_data'].includes(key)"
                                    class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                    v-model="serverSettings[key]"
                                >
                                    <option value="0">否</option>
                                    <option value="1">是</option>
                                </select>
                                <select
                                    :id="'input-' + key"
                                    v-else-if="['mail_auth'].includes(key)"
                                    class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                    v-model="serverSettings[key]"
                                >
                                    <option value="0">关闭</option>
                                    <option value="1">LOGIN</option>
                                    <option value="2">PLAIN</option>
                                </select>
                                <select
                                    :id="'input-' + key"
                                    v-else-if="['mail_secure'].includes(key)"
                                    class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                    v-model="serverSettings[key]"
                                >
                                    <!--<option value="none">无</option>-->
                                    <!--<option value="ssl">SSL</option>-->
                                    <option value="tls">TLS</option>
                                </select>
                                <select
                                    :id="'input-' + key"
                                    v-else-if="key === 'go_forum_sync_policy'"
                                    class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                    v-model="serverSettings[key]"
                                >
                                    <option value="add_only">[仅新增] 增加新关注的贴吧</option>
                                    <option value="add_delete">[严格同步] 增加新关注的贴吧，删除不再关注的贴吧</option>
                                </select>
                                <input
                                    :id="'input-' + key"
                                    v-else-if="['cron_limit', 'retry_max', 'sign_sleep', 'sign_multith', 'mail_port', 'ver4_ban_limit'].includes(key) || String(key || '').endsWith('_action_limit')"
                                    type="number"
                                    min="0"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else-if="key === 'go_re_check_in_max_interval'"
                                    type="number"
                                    min="1"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else-if="['sign_hour', 'go_daily_report_hour'].includes(key)"
                                    type="number"
                                    min="-1"
                                    max="23"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else-if="key === 'cktime'"
                                    type="number"
                                    min="30"
                                    :max="10 * 24 * 60 * 60"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else-if="['bduss_num'].includes(key)"
                                    type="number"
                                    min="-1"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else-if="key === 'mail_smtppw' && serverSettings[key] !== undefined"
                                    type="text"
                                    :disabled="!['1', '2'].includes(serverSettings['mail_auth'])"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl disabled:cursor-not-allowed"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else-if="key === 'mail_smtpname' && serverSettings[key] !== undefined"
                                    type="text"
                                    :disabled="!['1', '2'].includes(serverSettings['mail_auth'])"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl disabled:cursor-not-allowed"
                                    v-model="serverSettings[key]"
                                />
                                <div v-else-if="['go_bark_addr', 'go_ntfy_addr', 'go_pushdeer_addr'].includes(key)" class="flex w-full">
                                    <input
                                        :id="'input-' + key"
                                        type="text"
                                        class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-l-xl inline-block grow"
                                        v-model="serverSettings[key]"
                                    />
                                    <button
                                        type="button"
                                        class="inline-block px-3 py-1 rounded-r-xl border border-slate-500 hover:bg-gray-300 hover:text-black transition-colors"
                                        @click="
                                            (e) => {
                                                e.preventDefault()
                                                sendTestMail(key.split('_')[1])
                                            }
                                        "
                                    >
                                        测试
                                    </button>
                                </div>
                                <input
                                    :id="'input-' + key"
                                    v-else
                                    type="text"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                    v-model="serverSettings[key]"
                                />
                            </template>
                            <button
                                type="button"
                                v-if="_set.name === '邮件'"
                                class="px-3 py-1 mt-3 rounded-lg border-2 border-gray-300 hover:bg-gray-300 hover:text-black transition-colors"
                                @click="
                                    (e) => {
                                        e.preventDefault()
                                        sendTestMail('email')
                                    }
                                "
                            >
                                发送测试邮件
                            </button>
                        </template>
                    </Collapse>
                </template>
                <input type="submit" role="button" class="text-gray-100 text-lg bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded-xl ml-3 px-5 py-1 transition-colors" @click="SaveSettings" value="保存" />
            </form>
        </div>
        <SyncModule :loading="loading" :callback="syncSettings" />
    </div>
</template>

<style scoped></style>
