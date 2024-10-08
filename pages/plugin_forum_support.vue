<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { getPubDate } from '~/share/Time'
import { Notice } from '~/share/Tools'

const store = useMainStore()
const accounts = computed(() => store._cache?.accounts)
const loading = computed(() => store.loading)

const pidNameKV = computed(() => store.pidNameKV)

const fourmSupportSettingsKV = ref<{ [p in number]: { [q in number]: boolean } }>({})
const activePID = ref<number>(0)

const tasksList = ref<
    {
        date: number
        fid: number
        id: number
        log: string
        name: string
        nid: string
        pid: number
        tieba: string
        uid: number
    }[]
>([])

const list = ref<
    {
        fid: string
        name: string
        nid: number
        tieba: string
    }[]
>([])

watch([accounts, tasksList, list], () => {
    for (const account of accounts.value || []) {
        if (!fourmSupportSettingsKV.value[account.id]) {
            fourmSupportSettingsKV.value[account.id] = {}
        }
        for (const listItem of list.value) {
            fourmSupportSettingsKV.value[account.id][listItem.nid] = !!(fourmSupportSettingsKV.value[account.id][listItem.nid] || tasksList.value.find((task) => task.nid === listItem.nid.toString() && task.pid === account.id) || false)
        }
    }
    if (Array.isArray(accounts.value) && accounts.value.length > 0 && activePID.value <= 0) {
        activePID.value = accounts.value[0].id
    }
})

const tasksSwitch = ref<boolean>(false)

const updateTasksSwitch = () => {
    fetch(store.basePath + '/plugins/ver4_rank/switch', {
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
            tasksSwitch.value = res.data
            //console.log(res)
        })
}

const saveSettings = () => {
    fetch(store.basePath + '/plugins/ver4_rank/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PUT',
        body:
            `pid=${activePID.value}&` +
            Object.entries(fourmSupportSettingsKV.value[activePID.value])
                .filter((x) => x[1])
                .map((x) => 'nid[]=' + x[0])
                .join('&')
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
                Notice(res.message, 'error')
                return
            }
            Notice('设置已保存', 'success')
            const addList = Array.isArray(res.data.add) ? res.data.add : []
            const delList = Array.isArray(res.data.del) ? res.data.del.map((x) => x.id).filter((x) => x) : []

            tasksList.value = tasksList.value.filter((x) => !delList.includes(x.id))
            tasksList.value.push(...addList)
            //console.log(res)
        })
}

const getForumSupportList = () => {
    store.updateValue('loading', true)
    fetch(store.basePath + '/plugins/ver4_rank/settings', {
        headers: {
            Authorization: store.authorization
        }
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
            tasksList.value = res.data
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
            store.updateValue('loading', false)
        })
}

onMounted(() => {
    getForumSupportList()
    fetch(store.basePath + '/plugins/ver4_rank/settings', {
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
            tasksList.value = res.data
            //console.log(res)
        })
    fetch(store.basePath + '/plugins/ver4_rank/switch', {
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
            tasksSwitch.value = res.data
            //console.log(res)
        })

    fetch(store.basePath + '/plugins/ver4_rank/list', {
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
            list.value = res.data
            //console.log(res)
        })
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="px-3 py-2">
                <h4 class="text-lg mb-4">设置</h4>
                <button :class="{ 'bg-sky-500': !tasksSwitch, 'bg-pink-500': tasksSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true, 'text-gray-100': true, 'transition-colors': true }" @click="updateTasksSwitch">
                    {{ tasksSwitch ? '已开启助攻' : '已停止助攻' }}
                </button>
            </div>

            <div class="px-3 py-2">
                <h4 class="text-lg">任务列表</h4>

                <div class="my-5 grid grid-cols-6 gap-2 max-w-[48em]">
                    <Modal class="col-span-6 sm:col-span-3 lg:col-span-1" title="编辑名人堂任务">
                        <template #default>
                            <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="编辑名人堂任务">编辑列表</button>
                        </template>
                        <template #container>
                            <button
                                :class="{
                                    'px-3': true,
                                    'py-1': true,
                                    'rounded-lg': true,
                                    'mr-2': true,
                                    'my-2': true,
                                    'bg-sky-500': activePID === account.id,
                                    'hover:bg-sky-500': true,
                                    'hover:text-gray-100': true,
                                    'text-gray-100': activePID === account.id,
                                    'transition-colors': true
                                }"
                                v-for="account in accounts"
                                :key="account.id"
                                @click="activePID = account.id"
                            >
                                {{ account.name }}
                            </button>
                            <div class="" v-if="activePID">
                                <div class="my-1" v-for="character in list" :key="character.nid">
                                    <input type="checkbox" class="form-checkbox bg-gray-100 dark:bg-gray-900 dark:checked:bg-blue-500" v-model="fourmSupportSettingsKV[activePID][character.nid]" :id="'ver4_rank:character:' + character.nid" /><label
                                        class="ml-2"
                                        :for="'ver4_rank:character:' + character.nid"
                                        >{{ character.name }} (<NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/f?ie=utf-8&kw=' + character.tieba" target="blank">{{ character.tieba }}吧</NuxtLink>)</label
                                    >
                                </div>
                            </div>

                            <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 transition-colors" @click="saveSettings">保存</button>
                        </template>
                    </Modal>
                </div>

                <div class="border-4 border-gray-400 dark:border-gray-700 rounded-xl p-5 my-3" v-for="task in tasksList" :key="task.id">
                    <ul class="marker:text-sky-500 list-disc list-inside">
                        <li>
                            <span class="font-bold">序号 : </span><span class="font-mono">{{ task.id }}</span>
                        </li>
                        <li>
                            <span class="font-bold">贴吧账号 : </span><span class="font-mono">{{ pidNameKV[task.pid] }}</span>
                        </li>
                        <li>
                            <span class="font-bold">贴吧 : </span><NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/f?ie=utf-8&kw=' + task.tieba" target="blank">{{ task.tieba }}</NuxtLink>
                        </li>
                        <li>
                            <span class="font-bold">名人 : </span><span class="font-mono">{{ task.name }}</span>
                        </li>
                        <li>
                            <span class="font-bold">上次执行 : </span><span class="font-mono">{{ getPubDate(new Date(task.date * 1000)) }}</span>
                        </li>
                    </ul>

                    <details class="marker:text-sky-500">
                        <summary class="cursor-pointer"><span class="font-bold ml-1">日志</span></summary>
                        <ul class="marker:text-sky-500 list-disc list-inside gap-3 ml-5">
                            <li class="break-all" v-for="(log_, i) in task.log.split('<br/>').filter((x) => x)" :key="task.id + i">{{ log_ }}</li>
                        </ul>
                    </details>
                </div>
            </div>
            <div
                :class="{
                    fixed: true,
                    'right-5': true,
                    'bottom-32': true,
                    'px-3': true,
                    'py-2': true,
                    'cursor-pointer': true,
                    'transition-colors': true,
                    'duration-150': true,
                    'select-none': true,
                    'text-gray-100': true,
                    'bg-sky-500': true,
                    'hover:bg-sky-600': true,
                    'dark:hover:bg-sky-400': true,
                    'rounded-md': true
                }"
                style="z-index: 9999"
                @click="getForumSupportList"
            >
                <svg :class="{ 'animate-spin': loading }" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
                    <g fill="currentColor">
                        <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                        <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182a.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z" />
                    </g>
                </svg>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
