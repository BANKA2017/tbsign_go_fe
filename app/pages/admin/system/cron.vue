<script setup lang="ts">
import SystemPanelTab from '~/components/SystemPanelTab.vue'
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const isAdmin = computed(() => store.admin)
const pluginList = computed({
    get: () => store.cache?.plugin_list || {},
    set: (newValue) => {
        store.updateCache('plugin_list', newValue)
    }
})

const loading = ref<boolean>(false)

const cronJobs = ref<
    {
        id: string
        name: string
        tags: string[]
        last_start_at: number
        last_completed_at: number
        next_time: number
        running: boolean
    }[]
>([])

const activeCronJobs = computed(() =>
    cronJobs.value.filter((job) => {
        if (job.tags.length === 1) {
            return true
        } else if (job.tags.length >= 2 && job.tags[0] === 'plugin' && pluginList.value[job.tags[1]?.replace('plugin:', '') || '']) {
            return pluginList.value[job.tags[1]?.replace('plugin:', '') || '']?.status
        }
        return true
    })
)

const syncCron = () => {
    loading.value = true
    Request(store.basePath + '/admin/server/cron', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            cronJobs.value = res.data
            //console.log(res)
        })
        .finally(() => {
            loading.value = false
        })
}

const doCronJob = (id: string) => {
    const job = cronJobs.value.find((job) => job.id === id)
    if (!job) {
        return Notice('任务不存在', 'error')
    }

    loading.value = true
    Request(store.basePath + '/admin/server/cron/' + id + '/run', {
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
            Notice('已完成：' + job.name, 'success')
            setTimeout(syncCron, 2000)
            //console.log(res)
        })
        .finally(() => {
            loading.value = false
        })
}

onMounted(() => {
    syncCron()
})
</script>

<template>
    <div v-if="isAdmin">
        <div class="my-2 rounded-2xl">
            <SystemPanelTab active-component="cron" />
        </div>

        <div class="my-2 rounded-2xl">
            <div class="px-3 py-2">
                <h2 class="text-xl font-bold">计划任务</h2>
            </div>
            <div class="">
                <div class="bg-gray-200 dark:bg-gray-800 col-span-12 rounded-2xl mb-3" v-for="job in activeCronJobs" :key="job.id">
                    <div :class="{ flex: true, 'flex-col sm:flex-row': true, 'justify-between': true, 'bg-gray-200': true, 'dark:bg-gray-800': true, 'z-10': true, 'px-3': true, 'pt-2': true, ' rounded-2xl': true }">
                        <div :class="{ 'max-w-40': true, 'xs:max-w-40': true, flex: true, 'flex-col': true }">
                            <span
                                :class="{
                                    'overflow-hidden': true,
                                    truncate: true,
                                    'whitespace-nowrap': true,
                                    'inline-block': true
                                }"
                            >
                                {{ job.name }}</span
                            >
                            <div class="text-xs font-mono my-1 dark:text-gray-100">
                                <span class="mr-1 border border-gray-500 px-2 py-0.5 rounded-xl" v-for="tag in job.tags" :key="tag?.[1] || tag[0]">tag:{{ tag }}</span>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <div :class="{ 'max-w-40': true, 'xs:max-w-40': true, flex: true, 'flex-col': true, 'gap-1': true }">
                                <div class="overflow-hidden truncate whitespace-nowrap inline-block text-sm">
                                    <div v-if="job.running" class="text-white-500 inline-block">
                                        <uno-icon class="i-bi:hourglass-split" style="width: 0.75rem; height: 0.75rem" />
                                    </div>
                                    <div v-else-if="job.last_completed_at === -1" class="text-orange-500 inline-block">
                                        <uno-icon class="i-bi:hourglass-top" style="width: 0.75rem; height: 0.75rem" />
                                    </div>
                                    <div v-else-if="job.last_completed_at" class="text-green-500 inline-block">
                                        <uno-icon class="i-bi:check-circle-fill" style="width: 0.75rem; height: 0.75rem" />
                                    </div>
                                    <span class="ml-1">{{ job.running ? '正在运行' : job.last_start_at >= 0 ? getPubDate(new Date(job.last_start_at * 1000)) : '从未运行' }}</span>
                                </div>
                                <div class="overflow-hidden truncate whitespace-nowrap inline-block text-sm">
                                    <div class="text-orange-500 inline-block">
                                        <uno-icon class="i-bi:alarm-fill" style="width: 0.75rem; height: 0.75rem" />
                                    </div>
                                    <span class="ml-1">{{ getPubDate(new Date(job.next_time * 1000)) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="px-3 py-3">
                        <Modal class="inline-block mr-1" :title="'立即执行: ' + job.name + ' ？'" :aria-label="'立即执行: ' + job.name + ' ？'">
                            <template #default>
                                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors text-sm">立即运行</button>
                            </template>
                            <template #container>
                                <button class="bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="doCronJob(job.id)">确认</button>
                            </template>
                        </Modal>
                    </div>
                </div>
            </div>
        </div>

        <SyncModule :loading="loading" :callback="syncCron" />
    </div>
</template>

<style scoped></style>
