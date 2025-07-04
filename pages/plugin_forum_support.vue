<script setup lang="ts">
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const accounts = computed(() => store.cache?.accounts)
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
    Request(store.basePath + '/plugins/ver4_rank/switch', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        tasksSwitch.value = res.data
        //console.log(res)
    })
}

const saveSettings = () => {
    Request(store.basePath + '/plugins/ver4_rank/settings', {
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
    }).then((res) => {
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

const loadingSettings = ref<boolean>(false)

const getForumSupportList = () => {
    loadingSettings.value = true
    Request(store.basePath + '/plugins/ver4_rank/settings', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
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
        })
        .finally(() => {
            loadingSettings.value = false
        })
}

function getLines(text, line: number = 0, split: string = '\n') {
    let count = 0
    let pos = 0
    const splitLength = split.length

    while (count < line) {
        let next = text.indexOf(split, pos)
        if (next === -1) {
            return text
        }
        pos = next + splitLength
        count++
    }

    return text.substring(0, pos)
}

const parseLogs = (log_: string = '') => {
    if (!log_) {
        return []
    }
    return getLines(log_, 30, '<br/>')
        .split('<br/>')
        .map((log) => {
            if (!log || log?.length < 11) {
                return null
            }
            const [code, msg] = log.slice(11).split(',')
            return {
                date: log.slice(0, 10),
                code: code.replace('#', ''),
                msg
            }
        })
        .filter((x) => x)
}

onMounted(() => {
    getForumSupportList()
    Request(store.basePath + '/plugins/ver4_rank/switch', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        tasksSwitch.value = res.data
        //console.log(res)
    })

    Request(store.basePath + '/plugins/ver4_rank/list', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
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
                    <label for="pid-to-add">账号</label>
                    <select id="pid-to-add" v-model="activePID" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl block w-full my-3">
                        <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
                    </select>
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

        <div v-if="loadingSettings" class="w-full h-32 rounded-xl bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
        <template v-else>
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

                <hr class="border-gray-400 dark:border-gray-600 my-2" />

                <Modal class="mr-1 inline-block" :title="'@' + pidNameKV[task.pid] + ' 名人堂助攻 ' + task.name + ' 记录'">
                    <template #default>
                        <button class="rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1 text-gray-900 dark:text-gray-100 transition-colors" title="日志">日志</button>
                    </template>
                    <template #container>
                        <div class="rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3" v-for="(log_, i) in parseLogs(task.log)" :key="task.id + i">
                            <h5 class="font-bold text-xl">{{ log_.date }}</h5>
                            <SvgCheck v-if="log_.code === '0'" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                            <SvgCross v-else height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                            <span>{{ log_.msg }}</span>
                        </div>
                    </template>
                </Modal>
            </div>
        </template>
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
        <uno-icon :class="{ 'i-bi:arrow-clockwise': true, 'animate-spin': loading }" />
    </div>
</template>

<style scoped></style>
