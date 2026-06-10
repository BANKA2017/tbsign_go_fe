<script setup lang="ts">
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const config = useRuntimeConfig()
const isAdmin = computed(() => store.admin)

const serverStatus = ref<
    {
        build: { [key: string]: string }
        upgrade: { [key: string]: string | boolean }
        variables: { [key: string]: string | boolean }
    } & {
        [key: string]: string | number | boolean | { [key: string]: string | boolean } | { [key: string]: string }
    }
>({
    build: {},
    variables: {},
    upgrade: {}
})

const now = ref<number>(Date.now())

let nowIntervalHandle: any = null
const uptime = computed(() => Math.round((now.value - Number(serverStatus.value?.start_time || now.value)) / 1000 / 60))

const resignStatus = computed(() => {
    const tmpStatus = JSON.parse(
        (serverStatus.value?.cron_sign_again || '{"lastdo": "2000-00-00", "num": 0}')
            .toString()
            .replace(/a:\d+:{/, '{')
            .replace(/[A-Za-z]:\d+:([^;]+);(?:s:\d+:([^;]+)|i:(\d+));/g, '$1: $2$3;')
            .replace(';}', '}')
            .replaceAll(';', ',')
    )
    return tmpStatus.lastdo + `/${tmpStatus.num}`
})

const loading = ref<boolean>(false)

const syncStatus = () => {
    loading.value = true
    Request(store.basePath + '/admin/server/status', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            serverStatus.value = res.data
            //console.log(res)
        })
        .finally(() => {
            loading.value = false
        })
}

onMounted(() => {
    syncStatus()
    nowIntervalHandle = setInterval(() => {
        now.value = Date.now()
    }, 500)
})

onBeforeUnmount(() => {
    if (nowIntervalHandle) {
        clearInterval(nowIntervalHandle)
    }
})
</script>

<template>
    <div v-if="isAdmin">
        <div class="my-2 rounded-2xl">
            <SystemPanelTab active-component="status" />
        </div>
        <div class="my-2 rounded-2xl">
            <div class="px-3 py-2">
                <h2 class="text-xl font-bold">运行状态</h2>
            </div>
            <svg class="animate-spin h-5 w-5 dark:text-gray-100 text-sky-500 ml-3" v-if="serverStatus?.goversion === undefined" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="p-3 grid grid-cols-2 gap-2" v-else>
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
                        <span class="font-bold">数据库模式 : </span
                        ><span class="font-mono">{{ serverStatus.variables?.dbmode + (serverStatus.variables?.tlsdb && (serverStatus.variables?.dbmode || '').toString().toLowerCase() === 'mysql' ? ' (tls)' : '') }}</span>
                    </li>
                    <li>
                        <span class="font-bold">数据库版本 : </span><span class="font-mono">{{ serverStatus.variables?.dbversion }}</span>
                    </li>
                    <li>
                        <span class="font-bold">测试模式 : </span><span class="font-mono">{{ serverStatus.variables?.testmode }}</span>
                    </li>
                    <li>
                        <span class="font-bold">加密数据 : </span><span class="font-mono">{{ serverStatus?.encrypt }}</span>
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
                    <li>
                        <span class="font-bold">发布类型 : </span><span class="font-mono">{{ serverStatus.build.publish_type }}</span>
                    </li>
                    <li>
                        <span class="font-bold"><abbr :title="serverStatus.build['vcs.modified'] === '1' ? '构建此版本时，源码有本地修改未提交' : '构建时源码无本地修改'">源码状态</abbr> : </span
                        ><span class="font-mono">{{ serverStatus.build['vcs.modified'] === '1' ? 'dirty' : 'clean' }}</span>
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
        <SyncModule :loading="loading" :callback="syncStatus" />
    </div>
</template>

<style scoped></style>
