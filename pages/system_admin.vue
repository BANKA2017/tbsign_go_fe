<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { Notice } from '~/share/Tools'

const store = useMainStore()
const isAdmin = computed(() => store.admin)

const serverStatus = ref({})

const serverSettings = ref<{ [p in string]: any }>({})

const pluginList = ref<{ [p in string]: { name: string; status: boolean; ver: string; options: string } }>({})

const pluginGroup: { [p in string]: string } = {
    kd_growth: '用户成长任务',
    ver4_ban: '循环封禁',
    ver4_rank: '贴吧名人堂助攻',
    ver4_ref: '自动同步贴吧列表'
}

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
    return tmpStatus.lastdo + ` / ${tmpStatus.num}`
})

const settingsGroup = {
    system: {
        name: '系统',
        data: { ann: '公告', system_url: '地址', system_name: '网站名称', system_keywords: '关键词', system_description: '简介', stop_reg: '关闭注册公告 (已废弃)' }
    },
    account: {
        name: '帐号',
        data: { enable_reg: '开启注册', yr_reg: '邀请码 (留空代表无需邀请码)', cktime: 'JWT 有效期 (设置后签发的 Token 才生效)' }
    },
    sign: {
        name: '签到',
        data: { sign_mode: '签到模式 (TODO)', sign_hour: '下个整点签到', cron_limit: '单次签到贴吧数量', sign_sleep: '签到时间间隔 (ms) (TODO)', retry_max: '最大重签次数' }
    },
    mail: {
        name: '邮件',
        data: { mail_name: '发件人邮箱', mail_yourname: '发件人名称', mail_host: 'SMTP服务器地址', mail_port: 'SMTP服务器端口', mail_secure: '加密方式 (TODO)', mail_auth: '需要身份验证', mail_smtpname: 'SMTP用户名', mail_smtppw: 'SMTP密码' }
    },
    plugin: {
        name: '插件',
        data: { ver4_ban_limit: '可添加循环封禁帐号上限（循环封禁插件）', ver4_ban_break_check: '跳过吧务权限检查（循环封禁插件）' }
    }
}

const SaveSettings = (e: Event) => {
    e.preventDefault()
    fetch(store.basePath + '/admin/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams(serverSettings.value).toString()
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
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
    fetch(store.basePath + '/admin/plugin/' + pluginName + '/switch', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            if (res.data?.exists) {
                pluginList.value[pluginName].status = res.data?.status || false
                store.updateCache('plugin_list', pluginList.value)
            }
            //console.log(res)
        })
}

const sendTestMail = (e: Event) => {
    e.preventDefault()
    store.updateValue('loading', true)
    fetch(store.basePath + '/admin/service/push/mail/test', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => res.json())
        .then((res) => {
            store.updateValue('loading', false)
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            Notice('测试邮件已发送', 'success')
            //console.log(res)
        })
        .catch((e) => {
            store.updateValue('loading', false)
            Notice(e.toString(), 'error')
            console.error(e)
        })
}

onMounted(() => {
    fetch(store.basePath + '/admin/server/status', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            serverStatus.value = res.data
            //console.log(res)
        })
    fetch(store.basePath + '/plugins', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            pluginList.value = res.data
            store.updateCache('plugin_list', res.data)
            //console.log(res)
        })
    fetch(store.basePath + '/admin/settings', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            serverSettings.value = res.data
            //console.log(res)
        })
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div v-if="isAdmin">
                <div class="my-2 rounded-2xl">
                    <div class="px-3 py-2">
                        <span class="text-lg">服务器状态</span>
                    </div>
                    <div class="p-3 grid grid-cols-2 gap-2">
                        <div class="col-span-2 md:col-span-1">
                            <li class="marker:text-sky-500">
                                <span class="font-bold">Goroutines : </span><span class="font-mono">{{ serverStatus.goroutine }}</span>
                            </li>
                            <li class="marker:text-sky-500">
                                <span class="font-bold">Go 版本 : </span><span class="font-mono">{{ serverStatus.goversion }}</span>
                            </li>
                            <li class="marker:text-sky-500">
                                <span class="font-bold">数据库模式 : </span><span class="font-mono">{{ serverStatus.variables?.dbmode }}</span>
                            </li>
                            <li class="marker:text-sky-500">
                                <span class="font-bold">测试模式 : </span><span class="font-mono">{{ serverStatus.variables?.testmode }}</span>
                            </li>
                            <li class="marker:text-sky-500">
                                <span class="font-bold">兼容版本 : </span><span class="font-mono">{{ serverStatus.compat }}</span>
                            </li>
                            <li class="marker:text-sky-500">
                                <span class="font-bold">运行模式 : </span><span class="font-mono">{{ serverStatus.pure_go ? 'pure' : 'compat' }}</span>
                            </li>
                        </div>
                        <div class="col-span-2 md:col-span-1">
                            <li class="marker:text-teal-500">
                                <span class="font-bold">帐号总数 : </span><span class="font-mono">{{ serverStatus.uid_count }}</span>
                            </li>
                            <li class="marker:text-teal-500">
                                <span class="font-bold">绑定总数 : </span><span class="font-mono">{{ serverStatus.pid_count }}</span>
                            </li>
                            <li class="marker:text-teal-500">
                                <span class="font-bold">贴吧总数 : </span><span class="font-mono">{{ serverStatus.forum_count }}</span>
                            </li>
                            <li class="marker:text-teal-500">
                                <span class="font-bold">最后签到/重签次数 : </span><span class="font-mono">{{ resignStatus }}</span>
                            </li>
                        </div>
                    </div>
                </div>
                <div class="my-2 rounded-2xl">
                    <div class="px-3 py-2">
                        <span class="text-lg">插件总开关</span>
                    </div>
                    <div class="p-3">
                        <div class="flex justify-between my-1" v-for="(value, pluginName) in pluginList" :key="pluginName">
                            <span class="font-bold">{{ pluginGroup[pluginName] }}</span>
                            <button :class="{ 'px-3': true, 'py-1': true, 'bg-sky-500': value.status, 'bg-pink-500': !value.status, 'text-gray-100': true, 'transition-colors': true }" @click="pluginSwitch(pluginName)">
                                {{ value.status ? '已开启' : '已关闭' }}
                            </button>
                        </div>
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
                            <h3 class="text-lg mb-3">{{ _set.name }}</h3>
                            <template v-for="(name, key) in _set.data" :key="key">
                                <label :for="'input-' + key" class="block text-sm font-medium mb-1 mt-3">{{ name }}</label>
                                <textarea
                                    :id="'input-' + key"
                                    v-if="key === 'system_description'"
                                    class="form-textarea placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                                    rows="8"
                                    v-model="serverSettings[key]"
                                />
                                <select
                                    :id="'input-' + key"
                                    v-else-if="key === 'sign_mode'"
                                    multiple
                                    class="form-multiselect placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                                    v-model="signMode"
                                >
                                    <option value="1">模拟手机客户端签到</option>
                                    <option value="2">手机网页签到</option>
                                    <option value="3">网页签到</option>
                                </select>
                                <select
                                    :id="'input-' + key"
                                    v-else-if="['enable_reg', 'ver4_ban_break_check'].includes(key)"
                                    class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                                    v-model="serverSettings[key]"
                                >
                                    <option value="0">否</option>
                                    <option value="1">是</option>
                                </select>
                                <select
                                    :id="'input-' + key"
                                    v-else-if="['mail_auth'].includes(key)"
                                    class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                                    v-model="serverSettings[key]"
                                >
                                    <option value="0">关闭</option>
                                    <option value="1">开启</option>
                                </select>
                                <select
                                    :id="'input-' + key"
                                    v-else-if="['mail_secure'].includes(key)"
                                    class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                                    v-model="serverSettings[key]"
                                >
                                    <!--<option value="none">无</option>-->
                                    <!--<option value="ssl">SSL</option>-->
                                    <option value="tls">TLS</option>
                                </select>
                                <input
                                    :id="'input-' + key"
                                    v-else-if="['cron_limit', 'retry_max', 'sign_sleep', 'ver4_ban_limit', 'mail_port'].includes(key)"
                                    type="number"
                                    min="0"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100 dark:[color-scheme:dark]"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else-if="key === 'sign_hour'"
                                    type="number"
                                    min="-1"
                                    max="23"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100 dark:[color-scheme:dark]"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else-if="key === 'cktime'"
                                    type="number"
                                    min="30"
                                    :max="10 * 24 * 60 * 60"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100 dark:[color-scheme:dark]"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else-if="key === 'mail_smtppw'"
                                    type="password"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100 dark:[color-scheme:dark]"
                                    v-model="serverSettings[key]"
                                />
                                <input
                                    :id="'input-' + key"
                                    v-else
                                    type="text"
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                                    v-model="serverSettings[key]"
                                />
                            </template>
                            <button type="button" v-if="_set.name === '邮件'" class="px-3 py-1 mt-3 rounded-lg border-2 hover:bg-[#e5e7eb] hover:text-black transition-colors" @click="sendTestMail">发送测试邮件</button>
                        </div>
                        <input type="submit" role="button" class="text-gray-100 text-lg bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded ml-3 px-5 py-1 transition-colors" @click="SaveSettings" value="保存" />
                    </form>
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
