<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

definePageMeta({
    middleware: ['auth', 'get-accounts']
})

const store = useMainStore()
const accounts = computed(() => store._cache?.accounts)

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
    for (const account of accounts.value) {
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
    fetch(store.basePath + '/plugins/forum_support/switch', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            tasksSwitch.value = res.data
            console.log(res)
        })
}

const saveSettings = () => {
    fetch(store.basePath + '/plugins/forum_support/settings', {
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
            if (res.code !== 200) {
                return
            }
            const addList = Array.isArray(res.data.add) ? res.data.add : []
            const delList = Array.isArray(res.data.del) ? res.data.del.map((x) => x.id).filter((x) => x) : []

            tasksList.value = tasksList.value.filter((x) => !delList.includes(x.id))
            tasksList.value.push(...addList)
            console.log(res)
        })
}

onMounted(() => {
    fetch(store.basePath + '/plugins/forum_support/settings', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            tasksList.value = res.data
            console.log(res)
        })
    fetch(store.basePath + '/plugins/forum_support/switch', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            tasksSwitch.value = res.data
            console.log(res)
        })

    fetch(store.basePath + '/plugins/forum_support/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            list.value = res.data
            console.log(res)
        })
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="px-3 py-2">
                <h4 class="text-lg mb-4">设置</h4>
                <button :class="{ 'bg-sky-500': !tasksSwitch, 'bg-pink-500': tasksSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true }" @click="updateTasksSwitch">{{ tasksSwitch ? '停止助攻' : '开启助攻' }}</button>
            </div>

            <div class="px-3 py-2">
                <h4 class="text-lg">任务列表</h4>

                <details class="marker:text-sky-500 my-5">
                    <summary>编辑</summary>

                    <button :class="{ 'px-3': true, 'py-1': true, 'rounded-lg': true, 'mr-2': true, 'my-2': true, 'bg-sky-500': activePID === account.id }" v-for="account in accounts" :key="account.id" @click="activePID = account.id">
                        {{ account.name }}
                    </button>
                    <div class="grid grid-cols-6" v-if="activePID">
                        <div class="col-span-6 sm:col-span-3 md:col-span-6 lg:col-span-2 my-1" v-for="character in list" :key="character.nid">
                            <input type="checkbox" class="form-checkbox dark:bg-black" v-model="fourmSupportSettingsKV[activePID][character.nid]" :id="'forum_support:character:' + character.nid" /><label
                                class="ml-2"
                                :for="'forum_support:character:' + character.nid"
                                >{{ character.name }} (<a class="font-mono hover:underline underline-offset-1" :href="'https://tieba.baidu.com/f?ie=utf-8&kw=' + character.tieba" target="blank">{{ character.tieba }}吧</a>)</label
                            >
                        </div>
                    </div>

                    <button class="px-3 py-1 rounded-lg my-2 bg-sky-500" @click="saveSettings">保存</button>
                </details>

                <div class="border border-sky-500 rounded-xl p-5 my-3" v-for="task in tasksList" :key="task.id">
                    <li class="marker:text-sky-500">
                        <span class="font-bold">序号 : </span><span class="font-mono">{{ task.id }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">贴吧账号 : </span><span class="font-mono">{{ pidNameKV[task.pid] }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">贴吧 : </span><a class="font-mono hover:underline underline-offset-1" :href="'https://tieba.baidu.com/f?ie=utf-8&kw=' + task.tieba" target="blank">{{ task.tieba }}</a>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">名人 : </span><span class="font-mono">{{ task.name }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">上次执行 : </span><span class="font-mono">{{ new Date(task.date * 1000) }}</span>
                    </li>
                    <details class="marker:text-sky-500 cursor-pointer">
                        <summary><span class="font-bold ml-1">日志</span></summary>
                        <li class="marker:text-sky-500 ml-3 break-all" v-for="(log_, i) in task.log.split('<br/>').filter((x) => x)" :key="task.id + i">{{ log_ }}</li>
                    </details>
                    <!--<hr class="my-3"/>
                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1" @click="() => {}">删除</button>-->
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
