<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

const store = useMainStore()
const isAdmin = computed(() => store.admin)

const serverStatus = ref({})

const serverSettings = ref<{ [p in string]: any }>({})

const settingsGroup = {
    system: {
        name: '系统',
        data: { ann: '公告', system_url: '地址', system_name: '网站名称', system_keywords: '关键词', system_description: '简介' }
    },
    account: {
        name: '帐号',
        data: { enable_reg: '开启注册', yr_reg: '开启邀请制' }
    },
    sign: {
        name: '签到',
        data: { sign_mode: '签到模式', sign_hour: '开始签到时刻', cron_limit: '单次签到贴吧数量', sign_sleep: '签到时间间隔', cron_sign_again: '重签设置', retry_max: '最大重签次数' }
    },
    mail: {
        name: '邮件',
        data: { mail_name: '发件人邮箱', mail_yourname: '发件人名称', mail_host: 'SMTP服务器地址', mail_port: 'SMTP服务器端口', mail_secure: '加密方式', mail_auth: '需要身份验证', mail_smtpname: 'SMTP用户名', mail_smtppw: 'SMTP密码' }
    },
    plugin: {
        name: '插件',
        data: { ver4_ban_limit: '可添加循环封禁帐号上限（循环封禁插件）', ver4_ban_break_check: '跳过吧务权限检查（循环封禁插件）' }
    }
}

const SaveSettings = () => {
    fetch(store.basePath + '/admin/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PUT',
        body: new URLSearchParams(serverSettings.value).toString()
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                console.log(res)
                return
            }
            console.log(res)
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
            if (res.code !== 200) {
                return
            }
            serverStatus.value = res.data
            console.log(res)
        })
    fetch(store.basePath + '/admin/settings', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            serverSettings.value = res.data
            console.log(res)
        })
})

definePageMeta({
    middleware: ['auth', 'init-cache']
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="my-2 rounded-2xl" v-if="isAdmin">
                <div class="px-3 py-2">
                    <span class="text-lg">服务器状态</span>
                </div>
                <div class="p-3">
                    <li class="marker:text-sky-500">
                        <span class="font-bold">Goroutines : </span><span class="font-mono">{{ serverStatus.goroutine }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">Go 版本 : </span><span class="font-mono">{{ serverStatus.goversion }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">Hostname : </span><span class="font-mono">{{ serverStatus.hostname }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">数据库模式 : </span><span class="font-mono">{{ serverStatus.variables?.dbmode }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">测试模式 : </span><span class="font-mono">{{ serverStatus.variables?.testmode }}</span>
                    </li>
                </div>
            </div>
            <div class="my-2 rounded-2xl" v-if="isAdmin">
                <div class="px-3 py-2">
                    <h2 class="text-xl font-bold">服务器设置</h2>
                    <p class="my-2">如果不知道要填什么，请保持原样。请注意，这部分页面短期内都不会有太大的更改</p>
                </div>
                <div class="p-3" v-for="_set in settingsGroup" :key="_set.name">
                    <hr class="mb-3" />
                    <h3 class="text-lg mb-3">{{ _set.name }}</h3>
                    <label class="block my-2" v-for="(name, key) in _set.data" :key="key">
                        <span class="block text-sm font-medium mb-1">{{ name }}</span>
                        <textarea
                            v-if="/log|tpl|description|content/.test(key)"
                            class="border-slate-200 placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full dark:bg-black dark:text-white"
                            rows="8"
                            v-model="serverSettings[key]"
                        />
                        <input v-else class="border-slate-200 placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full dark:bg-black dark:text-white" v-model="serverSettings[key]" />
                    </label>
                </div>
                <button class="text-white text-lg bg-sky-500 rounded ml-3 px-5 py-1" @click="SaveSettings">保存</button>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
