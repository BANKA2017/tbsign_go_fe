<script setup lang="ts">
import UpdateSystemItem from '~/components/UpdateSystemItem.vue'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const config = useRuntimeConfig()
const isAdmin = computed(() => store.admin)
const pluginList = computed({
    get: () => store.cache?.plugin_list || {},
    set: (newValue) => {
        store.updateCache('plugin_list', newValue)
    }
})

const serverStatus = ref<
    {
        build: { [key: string]: string }
        variables: { [key: string]: string | boolean }
    } & {
        [key: string]: string | number | boolean | { [key: string]: string | boolean } | { [key: string]: string }
    }
>({
    build: {},
    variables: {}
})

const isSupportVersion = (os = '', arch = '') => {
    // Windows will lock the binary file
    return ['linux', 'darwin'].includes(os) && ['arm64', 'amd64'].includes(arch) // || (os === 'windows' && arch === 'amd64')
}

const serverGoStatus = computed(() => {
    const res = {
        os: '',
        arch: ''
    }
    if (typeof serverStatus.value?.goversion === 'string') {
        const tmpVersion = serverStatus.value?.goversion.split(' ')
        if (tmpVersion.length !== 2) {
            return res
        }
        const [os, arch] = tmpVersion[1].split('/')
        if (os && arch) {
            res.os = os
            res.arch = arch
        }
        return res
    } else {
        return res
    }
})

const fullVersion = computed(() => {
    return (
        serverStatus.value.build.date.slice(0, 10).replaceAll('-', '') +
        '.' +
        (serverStatus.value?.build?.commit_hash && serverStatus.value.build.commit_hash !== 'N/A' ? (serverStatus.value.build.commit_hash || '').slice(0, 7) : '_') +
        '.' +
        (serverStatus.value?.build?.embedded_frontend_commit_hash && serverStatus.value.build.embedded_frontend_commit_hash !== 'N/A' ? (serverStatus.value.build.embedded_frontend_commit_hash || '').slice(0, 7) : '_')
    )
})

const serverSettings = ref<{ [p in string]: any }>({})
const now = ref<number>(Date.now())
setInterval(() => {
    now.value = Date.now()
}, 1000)
const uptime = computed(() => Math.round((now.value - (serverStatus.value?.start_time || now.value)) / 1000 / 60))

const pluginGroup = computed(() => Object.fromEntries(Object.values(pluginList.value).map((plugin) => [plugin.name, plugin.plugin_name_cn])))

const signMode = computed({
    get() {
        return (serverSettings.value['sign_mode'] || '').split(',')
    },
    set(value: string[]) {
        serverSettings.value['sign_mode'] = value.join(',')
    }
})

const resignStatus = computed(() => {
    const tmpStatus = JSON.parse(
        (serverStatus.value?.cron_sign_again || '{"lastdo": "2000-00-00", "num": 0}')
            .replace(/a:\d+:{/, '{')
            .replace(/[A-Za-z]:\d+:([^;]+);(?:s:\d+:([^;]+)|i:(\d+));/g, '$1: $2$3;')
            .replace(';}', '}')
            .replaceAll(';', ',')
    )
    return tmpStatus.lastdo + `/${tmpStatus.num}`
})

const settingsGroup = ref({
    system: {
        name: '系统',
        data: { ann: '公告', system_url: '地址' } //, system_name: '网站名称', system_keywords: '关键词', system_description: '简介' }
    },
    account: {
        name: '账号',
        data: { enable_reg: '开启注册', yr_reg: '邀请码 (留空代表无需邀请码)', cktime: 'JWT 有效期 (设置后签发的 Token 才生效)', go_export_personal_data: '允许备份个人数据' }
    },
    checkin: {
        name: '签到',
        data: {
            sign_mode: '签到模式 (TODO)',
            sign_hour: '下个整点签到 (-1 为 0 时开始签到，以此类推)',
            cron_limit: '单次单账号签到贴吧数量 (单次签到行为贴吧数量上限为 此值*3)',
            sign_sleep: '签到时间间隔 (ms)',
            retry_max: '最大重签次数',
            go_forum_sync_policy: '贴吧同步策略'
        }
    },
    mail: {
        name: '邮件',
        data: { mail_name: '发件人邮箱', mail_yourname: '发件人名称', mail_host: 'SMTP服务器地址', mail_port: 'SMTP服务器端口', mail_secure: '加密方式 (TODO)', mail_auth: '需要身份验证', mail_smtpname: 'SMTP用户名', mail_smtppw: 'SMTP密码' }
    },
    push: {
        name: '推送',
        data: { go_bark_addr: 'Bark 推送地址', go_ntfy_addr: 'ntfy 推送地址' }
    },
    plugin: {
        name: '插件',
        data: {}
    }
})

const initPluginSettingsGroup = () => {
    // String(key || '').endsWith('_action_limit')
    // ver4_ban_break_check: '跳过吧务权限检查（循环封禁）',
    // ver4_ban_limit: '...'

    for (const plugin of Object.values(pluginList.value)) {
        for (const setting_option of plugin?.setting_options || []) settingsGroup.value.plugin.data[setting_option['option_name']] = `${setting_option['option_name_cn']}（${plugin.plugin_name_cn}）`
    }
}

watch(pluginList, () => {
    initPluginSettingsGroup()
})

const SaveSettings = (e: Event) => {
    e.preventDefault()
    Request(store.basePath + '/admin/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams(serverSettings.value).toString()
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }
        Notice('设置已保存', 'success')
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
            Notice(res.message, 'error')
            return
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
            Notice(res.message, 'error')
            return
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

const sendTestMail = (_type: string = 'email') => {
    Request(store.basePath + '/admin/service/push/mail/test?type=' + _type, {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            Notice('测试消息已发送', 'success')
            //console.log(res)
        })
        .catch((e) => {
            Notice(e.toString(), 'error')
            console.error(e)
        })
}

const releaseList = ref<any[]>([])
const tenMinutesDelay = ref<boolean>(true)

const getReleasesList = () => {
    Request('https://api.github.com/repos/banka2017/tbsign_go/releases?per_page=6')
        .then((res) => {
            releaseList.value = res.sort((a, b) => (a.published_at < b.published_at ? 1 : -1)).filter((x) => x.tag_name.startsWith('tbsign_go.'))
            const currentIndex = releaseList.value.map((x) => x.tag_name.replace('tbsign_go.', '')).indexOf(fullVersion.value)
            if (currentIndex > -1) {
                releaseList.value = releaseList.value.filter((_, i) => i <= currentIndex)
            }

            if (releaseList.value.length === 1 && releaseList.value[0].tag_name.replace('tbsign_go.', '') === fullVersion.value) {
                tenMinutesDelay.value = false
            }
        })
        .catch((e) => {
            Notice(e.toString(), 'error')
            console.error(e)
        })
}

onMounted(() => {
    Request(store.basePath + '/admin/server/status', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        serverStatus.value = res.data
        //console.log(res)
    })
    Request(store.basePath + '/admin/settings', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        serverSettings.value = res.data
        //console.log(res)
    })
    initPluginSettingsGroup()
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <div v-if="isAdmin">
            <div class="my-2 rounded-2xl">
                <div class="px-3 py-2">
                    <span class="text-lg">服务器状态</span>
                </div>
                <div class="p-3 grid grid-cols-2 gap-2">
                    <ul class="col-span-2 md:col-span-1 marker:text-sky-500 list-disc list-inside">
                        <li>
                            <span class="font-bold">Goroutines : </span><span class="font-mono">{{ serverStatus.goroutine }}</span>
                        </li>
                        <li>
                            <span class="font-bold">Go 版本 : </span><span class="font-mono">{{ serverStatus.goversion }}</span>
                        </li>
                        <li>
                            <span class="font-bold">运行时长 : </span><span class="font-mono">{{ uptime }} {{ uptime === 1 ? 'min' : 'mins' }}</span>
                        </li>
                        <li>
                            <span class="font-bold">数据库模式 : </span><span class="font-mono">{{ serverStatus.variables?.dbmode }}</span>
                        </li>
                        <li>
                            <span class="font-bold">测试模式 : </span><span class="font-mono">{{ serverStatus.variables?.testmode }}</span>
                        </li>
                        <li>
                            <span class="font-bold">兼容版本 : </span><span class="font-mono">{{ serverStatus.compat }}</span>
                        </li>
                        <li>
                            <span class="font-bold">运行模式 : </span><span class="font-mono">{{ serverStatus.pure_go ? 'pure' : 'compat' }}</span>
                        </li>
                    </ul>
                    <ul class="col-span-2 md:col-span-1 marker:text-indigo-500 list-disc list-inside">
                        <li>
                            <span class="font-bold">构建时间 : </span><span class="font-mono">{{ serverStatus.build.date }}</span>
                        </li>
                        <li>
                            <span class="font-bold">构建系统 : </span><span class="font-mono">{{ serverStatus.build.runtime }}</span>
                        </li>
                        <li>
                            <span class="font-bold">后端版本 : </span>
                            <p class="inline-block font-mono" v-if="serverStatus?.build?.date">
                                <span>{{ serverStatus.build.date.slice(0, 10).replaceAll('-', '') }}.</span>
                                <NuxtLink
                                    v-if="serverStatus?.build?.commit_hash && serverStatus.build.commit_hash !== 'N/A'"
                                    :to="'https://github.com/BANKA2017/tbsign_go/commit/' + serverStatus.build.commit_hash"
                                    class="text-gray-100 bg-gray-500 px-2 rounded-xl"
                                    >{{ (serverStatus.build.commit_hash || '').slice(0, 7) }}</NuxtLink
                                >
                                <span v-else>_</span>
                                <span>.</span>
                                <NuxtLink
                                    v-if="serverStatus?.build?.embedded_frontend_commit_hash && serverStatus.build.embedded_frontend_commit_hash !== 'N/A'"
                                    :to="'https://github.com/BANKA2017/tbsign_go_fe/commit/' + serverStatus.build.embedded_frontend_commit_hash"
                                    class="text-gray-100 bg-gray-500 px-2 rounded-xl"
                                    >{{ (serverStatus.build.embedded_frontend_commit_hash || '').slice(0, 7) }}</NuxtLink
                                >
                                <span v-else>_</span>
                            </p>
                        </li>
                        <li>
                            <span class="font-bold">前端版本 : </span>
                            <NuxtLink v-if="config.public.NUXT_COMMIT_HASH" :to="'https://github.com/BANKA2017/tbsign_go_fe/commit/' + config.public.NUXT_COMMIT_HASH" class="font-mono text-gray-100 bg-gray-500 px-2 rounded-xl">{{
                                (config.public.NUXT_COMMIT_HASH || '').slice(0, 7)
                            }}</NuxtLink>
                            <span v-else class="font-mono">Dev</span>
                        </li>
                    </ul>
                    <ul class="col-span-2 md:col-span-1 marker:text-teal-500 list-disc list-inside">
                        <li>
                            <span class="font-bold">账号总数 : </span><span class="font-mono">{{ serverStatus.uid_count }}</span>
                        </li>
                        <li>
                            <span class="font-bold">绑定总数 : </span><span class="font-mono">{{ serverStatus.pid_count }}</span>
                        </li>
                        <li>
                            <span class="font-bold">贴吧总数 : </span><span class="font-mono">{{ serverStatus.forum_count }}</span>
                        </li>
                        <li>
                            <span class="font-bold">签到情况 : </span>
                            <ul class="col-span-2 md:col-span-1 marker:text-teal-500 list-disc list-inside ml-5">
                                <li v-for="(v, k) in serverStatus.checkin_status || []" :key="k">
                                    <span class="font-bold">{{ k }} : </span><span class="font-mono">{{ v }}</span>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <span class="font-bold">最后执行/重签次数 : </span><span class="font-mono">{{ resignStatus }}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="my-2 rounded-2xl" v-if="isSupportVersion(serverGoStatus.os, serverGoStatus.arch)">
                <div class="px-3 py-2">
                    <span class="text-lg">软件更新</span>
                </div>
                <div v-if="serverStatus.build.runtime === 'Dev'">
                    <p class="px-3">
                        <SvgCross height="1.2em" width="1.2em" class="inline-block mx-0.5" /> 不支持的版本 (开发版)，请参考
                        <a href="https://github.com/BANKA2017/tbsign_go/blob/master/build.sh" target="_blank" class="underline"><code>build.sh</code></a> 自行编译运行
                    </p>
                </div>
                <div v-else-if="releaseList.length == 0">
                    <button class="border-pink-500 hover:bg-pink-500 border-2 rounded-lg ml-3 px-3 py-1 hover:text-gray-100 transition-colors" title="检查更新" aria-label="检查更新" @click="getReleasesList">检查更新</button>
                </div>
                <div v-if="releaseList.length > 0">
                    <ul role="list" class="px-3 my-2 marker:text-sky-500 list-disc list-inside">
                        <li>
                            如果下面列表中没有一项的右上角有<SvgCheck height="1.2em" width="1.2em" class="inline-block mx-0.5" />，说明当前版本过于老旧，或者属于拥有严重 BUG 被撤回的版本，请前往
                            <a href="https://github.com/BANKA2017/tbsign_go/releases" target="_blank" class="underline"><code>Releases</code></a> 下载文件替换更新
                        </li>
                        <li @click="tenMinutesDelay = false" role="button">最后更新会有 10 分钟的延迟</li>
                        <li>不支持自动降级</li>
                    </ul>

                    <div class="p-3 grid grid-cols-2 gap-2">
                        <div class="col-span-2 md:col-span-1" v-for="(release, i) in releaseList.filter((x) => !tenMinutesDelay || Number(new Date(x.published_at)) + 1000 * 60 * 10 < Date.now())" :key="release.tag_name">
                            <UpdateSystemItem
                                :item="release.assets.find((x) => x.name.endsWith(Object.values(serverGoStatus).join('-') + (serverGoStatus.os === 'windows' ? '.exe' : '')))"
                                :url="release.html_url"
                                :current="fullVersion"
                                :os="serverGoStatus.os"
                                :arch="serverGoStatus.arch"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="my-2 rounded-2xl">
                <div class="px-3 py-2">
                    <span class="text-lg">插件总开关</span>
                </div>
                <div class="p-3">
                    <template v-for="(value, pluginName, index) in pluginList" :key="pluginName">
                        <hr v-if="index > 0" class="border-gray-400 dark:border-gray-600 my-1" />
                        <div class="flex justify-between">
                            <div>
                                <span class="font-bold mr-1">{{ pluginGroup[pluginName] || pluginName }}</span> <span class="px-1.5 rounded bg-sky-500 dark:bg-sky-700 text-sm text-gray-100" v-if="value?.ver">v{{ value.ver }}</span>
                            </div>
                            <div class="inline-block">
                                <button :class="{ 'px-3': true, 'py-1': true, 'bg-sky-500': value.status, 'bg-pink-500': !value.status, 'text-gray-100': true, 'transition-colors': true }" @click="pluginSwitch(pluginName)">
                                    {{ value.status ? '已开启' : value.ver === '-1' ? '未安装' : '已关闭' }}
                                </button>
                                <Modal class="inline-block" :title="'确认卸载插件: ' + (pluginGroup[pluginName] || pluginName) + '?'" :aria-label="'确认卸载插件: ' + (pluginGroup[pluginName] || pluginName) + '?'" v-if="value.ver !== '-1'">
                                    <template #default>
                                        <button class="px-3 py-1 bg-pink-500 text-gray-100 transition-colors">卸载</button>
                                    </template>
                                    <template #container>
                                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="pluginDelete(pluginName)">
                                            确认卸载 {{ pluginGroup[pluginName] }} ({{ pluginName }})
                                        </button>
                                    </template>
                                </Modal>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <div class="my-2 rounded-2xl">
                <div class="px-3 py-2">
                    <h2 class="text-xl font-bold">服务器设置</h2>
                    <p class="my-2">如果不知道要填什么，请保持原样</p>
                </div>
                <form autocomplete="off">
                    <div class="p-3" v-for="_set in settingsGroup" :key="_set.name">
                        <hr class="border-gray-400 dark:border-gray-600 mb-3" />
                        <h3 class="text-lg mb-3 py-2 px-2 -mx-2 sticky top-0 bg-gray-100 dark:bg-gray-900">{{ _set.name }}</h3>
                        <template v-for="(name, key) in _set.data" :key="key">
                            <label :for="'input-' + key" class="block text-sm font-medium mb-1 mt-3">{{ name }}</label>
                            <textarea
                                :id="'input-' + key"
                                v-if="['system_description', 'ann'].includes(key)"
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
                                v-else-if="['enable_reg', 'ver4_ban_break_check', 'go_export_personal_data'].includes(key)"
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
                                <option value="1">开启</option>
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
                                v-else-if="['cron_limit', 'retry_max', 'sign_sleep', 'mail_port', 'ver4_ban_limit'].includes(key) || String(key || '').endsWith('_action_limit')"
                                type="number"
                                min="0"
                                class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                v-model="serverSettings[key]"
                            />
                            <input
                                :id="'input-' + key"
                                v-else-if="key === 'sign_hour'"
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
                                v-else-if="key === 'mail_smtppw' && serverSettings[key] !== undefined"
                                type="password"
                                class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                v-model="serverSettings[key]"
                            />
                            <input
                                :id="'input-' + key"
                                v-else-if="key === 'mail_smtpname' && serverSettings[key] !== undefined"
                                type="text"
                                class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                v-model="serverSettings[key]"
                            />
                            <div v-else-if="['go_bark_addr', 'go_ntfy_addr'].includes(key)" class="flex w-full">
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
                    </div>
                    <input type="submit" role="button" class="text-gray-100 text-lg bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded-xl ml-3 px-5 py-1 transition-colors" @click="SaveSettings" value="保存" />
                </form>
            </div>
        </div>
    </NuxtLayout>
</template>

<style scoped></style>
