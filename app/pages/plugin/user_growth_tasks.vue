<script setup lang="ts">
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const pidNameKV = computed(() => store.pidNameKV)
const loading = computed(() => store.loading)

type flagKeys = 'sign' | 'daily' | 'icon' | 'special' | 'custom'

const settings = ref<{
    tasks_flag_value: { [p in flagKeys]?: number }
    tasks_flag: number
    ext_tasks: { [p in string]: string }
}>({
    tasks_flag_value: {},
    tasks_flag: 0,
    ext_tasks: {}
})

const initFlagSetting = (flagValue: number) => {
    if (flagValue === 0) {
        return
    }

    for (const key in flagsSetting) {
        flagsSetting[key].value = (flagValue & settings.value.tasks_flag_value[key] || 0) !== 0
    }
}

const flagsSetting = reactive<{
    [p in flagKeys]: { name: string; value: boolean }
}>({
    sign: { name: '签到任务', value: false },
    daily: { name: '日常任务', value: false },
    icon: { name: '印记任务', value: false },
    special: { name: '特殊任务', value: false },
    custom: { name: '自定义任务', value: false }
})

watch(
    flagsSetting,
    () => {
        let newValue = 0
        for (const key in flagsSetting) {
            newValue |= flagsSetting[key]?.value ? settings.value.tasks_flag_value[key] : 0
            if (key === 'daily' && flagsSetting.daily?.value && !flagsSetting.sign?.value) {
                flagsSetting.sign.value = true
                return
            }
        }
        settings.value.tasks_flag = newValue
    },
    { deep: true }
)

const selectedPID = ref<number>(0)
const extTaskActType = ref<string>('')

const tasksList = ref<
    {
        date: number
        id: number
        log: string
        pid: number
        status: string
        uid: number
    }[]
>([])

const tasksStatus = ref<{ [p in string]: { level_info: any; tmoney: number } }>({})

const canSelectPIDList = computed(() => Object.fromEntries(Object.entries(pidNameKV.value).filter((x) => !tasksList.value.find((y) => y.pid.toString() === x[0]))))

const saveSettings = () => {
    Request(store.basePath + '/plugins/kd_growth/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PUT',
        body: new URLSearchParams({
            tasks_flag: settings.value.tasks_flag.toString(),
            ext_tasks: JSON.stringify(
                ((v) => {
                    settings.value.ext_tasks = Object.fromEntries(Object.entries(v).filter((x) => x[0] && x[1]))
                    return settings.value.ext_tasks
                })(settings.value.ext_tasks)
            )
        }).toString()
    }).then((res) => {
        if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
            Notice(res.message, 'error')
            return
        }
        Notice('设置已保存', 'success')

        initFlagSetting(res.data.tasks_flag)
        settings.value.tasks_flag = res.data.tasks_flag
        settings.value.ext_tasks = res.data.ext_tasks

        //console.log(res)
    })
}

const deleteTask = (id = 0) => {
    if (id <= 0 || !tasksList.value.find((x) => x.id === id)) {
        return
    }
    Request(store.basePath + '/plugins/kd_growth/list/' + id, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        if (res.data.success) {
            Notice('已删除任务 ' + id, 'success')
            tasksList.value = tasksList.value.filter((x) => x.id.toString() !== res.data.id)
        } else {
            Notice(res.message, 'error')
        }
        //console.log(res)
    })
}

const growthValueToLevel: number[] = [1, 50, 200, 450, 900, 1500, 2500, 4000, 10000, 20000, 4294967295]

const getStatus = (id = 0) => {
    if (id <= 0 || !pidNameKV.value[id]) {
        return
    }
    Request(store.basePath + '/plugins/kd_growth/status/' + id, {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        tasksStatus.value[id] = {
            level_info: (() => {
                const growth_value = res.data?.user_info?.growth_value || 0

                if (growth_value <= 0) {
                    return { level: 0, next_level_value: 1, growth_value }
                }

                for (const index in growthValueToLevel) {
                    if (growthValueToLevel[index] > growth_value) {
                        const i = Number(index)

                        return { level: i, next_level_value: growthValueToLevel[i], growth_value }
                    }
                }

                return { level: 11, next_level_value: Infinity, growth_value }
            })(),
            tmoney: res.data?.user_info?.tmoney_value || 0
        }
        //console.log(res)
    })
}

const addTask = () => {
    if (selectedPID.value <= 0) {
        return
    }
    Request(store.basePath + '/plugins/kd_growth/list', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PATCH',
        body: new URLSearchParams({ pid: selectedPID.value.toString() }).toString()
    }).then((res) => {
        if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
            Notice(res.message, 'error')
            return
        }
        Notice('已添加 pid:' + selectedPID.value, 'success')
        tasksList.value.push(res.data)
        selectedPID.value = 0
        //console.log(res)
    })
}

const loadingTasks = ref<boolean>(false)

const getTasksList = () => {
    loadingTasks.value = true
    Request(store.basePath + '/plugins/kd_growth/list', {
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
            loadingTasks.value = false
        })
}
const taskStatusName = computed(() => {
    return (
        tasksList.value
            .map((task) => {
                try {
                    const status = JSON.parse(task.status)
                    return Object.fromEntries(status.map((status_item) => [status_item.act_type, status_item.name]))
                } catch {
                    return null
                }
            })
            .filter((x) => x)
            .reduce((a, b) => ({ ...a, ...b }), {}) || {}
    )
})

const getTaskStatusName = (act_type: string = '') => {
    return taskStatusName.value[act_type] || act_type
}

const parseLogs = (log_: string = '') => {
    if (!log_) {
        return []
    }
    return log_
        .split('<br/>')
        .map((log) => {
            if (!log || log?.length < 12) {
                return null
            }
            return {
                date: log.slice(0, 10),
                tasks: log
                    .slice(12)
                    .split(',')
                    .map((kvStr) => {
                        const kv = kvStr.split(':')
                        if (kv.length === 2) {
                            return { act_type: kv[0], status: kv[1] }
                        } else if (kv.length === 4) {
                            return { task_id: Number(kv[0]), name: kv[1], act_type: kv[2], status: kv[3] }
                        } else {
                            return null
                        }
                    })
                    .filter((kv) => kv)
                    .sort((a, b) => (a?.task_id === 0) - (b?.task_id === 0) || (a?.act_type > b?.act_type ? 1 : -1))
            }
        })
        .filter((x) => x)
}

onMounted(() => {
    getTasksList()
    Request(store.basePath + '/plugins/kd_growth/settings', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        settings.value = res.data
        initFlagSetting(res.data.tasks_flag)
        //console.log(res)
    })
})
</script>

<template>
    <div class="px-3 py-2">
        <h3 class="text-2xl mb-4">设置</h3>

        <div class="my-5">
            <h4 class="my-2 text-xl">任务类型</h4>
            <ul class="my-2 text-sm col-span-2 md:col-span-1 marker:text-pink-500 list-disc list-inside">
                <li>默认只做签到任务，选中日常任务时必须选中签到任务</li>
                <li>完成印记任务有可能会导致账号的 IP 归属地变为签到服务器所在地</li>
                <li>完成特殊任务后可能会被风控系统禁止参加某些活动</li>
                <li>自定义任务不会确认是否完成，任务列表中的同名任务会覆盖自定义任务</li>
            </ul>

            <div class="space-y-2 mb-4">
                <div v-for="(_, key) in flagsSetting" :key="key">
                    <label class="flex items-center gap-2" :for="'flags-' + key">
                        <input type="checkbox" :id="'flags-' + key" :disabled="key === 'sign' && flagsSetting.daily?.value" class="form-checkbox bg-gray-100 dark:bg-gray-800 dark:checked:bg-blue-500" v-model="flagsSetting[key].value" />
                        <span>
                            {{ flagsSetting[key].name }}
                            <SvgPushPin v-if="key === 'icon'" height="1.2em" width="1.2em" class="inline-block -mt-0.5" />
                            <SvgPencil v-else-if="key === 'custom'" height="1.2em" width="1.2em" class="inline-block -mt-0.5" />
                        </span>
                    </label>
                </div>
            </div>

            <Modal class="inline-block mr-1 mb-3" title="编辑自定义任务" aria-label="编辑自定义任务">
                <template #default>
                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors text-sm">编辑自定义任务</button>
                </template>
                <template #container>
                    <div v-if="Object.keys(settings.ext_tasks).length > 0">
                        <div v-for="(v, act_type) in settings.ext_tasks" :key="act_type" class="rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3 relative">
                            <label :for="'act-type-name-' + act_type" class="mb-2 font-mono">ActType: {{ act_type }}</label>
                            <p class="w-full mb-2">
                                <span class="font-mono">Name: </span><input :id="'act-type-name-' + act_type" class="form-input bg-gray-200 dark:bg-gray-900 rounded-xl text-sm" type="text" v-model="settings.ext_tasks[act_type]" placeholder="Name" />
                            </p>
                            <button
                                class="text-pink-500 hover:text-pink-600 absolute right-3 top-3 rounded-full transition-colors"
                                @click="
                                    () => {
                                        delete settings.ext_tasks[act_type]
                                    }
                                "
                            >
                                <uno-icon class="i-bi:x-circle-fill" style="width: 1.5em; height: 1.5em" />
                            </button>
                        </div>

                        <hr class="border-gray-400 dark:border-gray-600 my-3" />
                    </div>

                    <div class="flex w-full rounded-xl mb-3">
                        <input type="text" class="form-input bg-gray-200 dark:bg-gray-900 grow rounded-l-xl" v-model="extTaskActType" placeholder="ActType" />
                        <button
                            class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 px-3 py-1 transition-colors rounded-r-xl"
                            @click="
                                () => {
                                    settings.ext_tasks[extTaskActType] = ''
                                    extTaskActType = ''
                                }
                            "
                        >
                            添加
                        </button>
                    </div>

                    <ul class="mt-2 col-span-2 md:col-span-1 marker:text-pink-500 list-disc list-inside">
                        <li>
                            <span class="break-all font-mono mr-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">ActType</span>和<span class="break-all font-mono mx-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">Name</span
                            >请自行查找，空白键值会被清理
                        </li>
                    </ul>
                </template>
            </Modal>
        </div>

        <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded-lg px-3 py-1 text-gray-100 transition-colors" @click="saveSettings">保存</button>
    </div>

    <div class="px-3 py-2">
        <h4 class="text-lg">任务列表</h4>

        <div class="marker:text-sky-500 my-5" v-if="Object.keys(canSelectPIDList).length">
            <label for="pid-to-add">添加</label>
            <select id="pid-to-add" v-model="selectedPID" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl block w-full my-3">
                <option v-for="(name, pid) in canSelectPIDList" :key="pid" :value="pid">{{ name }}</option>
            </select>

            <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 text-gray-100" @click="addTask">保存</button>
        </div>

        <div v-if="loadingTasks" class="w-full h-32 rounded-xl bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
        <template v-else>
            <div class="border-4 border-gray-400 dark:border-gray-700 rounded-xl p-5 my-3 relative" v-for="task in tasksList" :key="task.id">
                <div class="2xs:absolute right-4 top-4">
                    <div v-if="tasksStatus[task.pid]?.level_info?.level" class="inline-block group bg-gray-100 dark:bg-gray-900" :title="'贴贝 ' + tasksStatus[task.pid]?.tmoney" :aria-label="'贴贝 ' + tasksStatus[task.pid]?.tmoney">
                        <span class="px-2 rounded group-hover:rounded-r-none font-bold"><uno-icon class="i-fluent-emoji-flat:coin inline-block -mt-0.5" /> {{ tasksStatus[task.pid]?.tmoney }}</span>
                    </div>
                    <div
                        v-if="tasksStatus[task.pid]?.level_info?.level"
                        class="inline-block group mr-2"
                        :title="'等级 ' + tasksStatus[task.pid]?.level_info?.level + '，经验 ' + tasksStatus[task.pid]?.level_info?.growth_value"
                        :aria-label="'等级 ' + tasksStatus[task.pid]?.level_info?.level + '，经验 ' + tasksStatus[task.pid]?.level_info?.growth_value"
                    >
                        <span class="px-2 rounded group-hover:rounded-r-none border-2 border-yellow-500 bg-yellow-500 text-black font-bold">LV{{ tasksStatus[task.pid]?.level_info?.level }}</span>
                        <span class="px-2 rounded-r border-2 hidden group-hover:inline border-yellow-500 text-black dark:text-gray-100 bg-gray-100 dark:bg-gray-900"
                            >{{ tasksStatus[task.pid]?.level_info?.growth_value }}/{{ tasksStatus[task.pid]?.level_info?.next_level_value }}</span
                        >
                    </div>
                </div>
                <ul class="marker:text-sky-500 list-disc list-inside">
                    <li>
                        <span class="font-bold">序号 : </span><span class="font-mono">{{ task.id }}</span>
                    </li>
                    <li>
                        <span class="font-bold">贴吧账号 : </span><span class="font-sans">{{ pidNameKV[task.pid] }}</span>
                    </li>
                    <li>
                        <span class="font-bold">上次执行 : </span><span class="font-mono">{{ getPubDate(new Date(task.date * 1000)) }}</span>
                    </li>
                    <li>
                        <span class="font-bold">状态 : </span>
                        <ul v-if="task.status && task.status.startsWith('[')" class="grid grid-cols-6 gap-x-5 marker:text-sky-500 list-disc list-inside">
                            <li
                                class="ml-5 col-span-6 md:col-span-3 lg:col-span-2"
                                v-for="taskStatus in JSON.parse(task.status).sort((a, b) => (a?.task_id === 0) - (b?.task_id === 0) || (a?.act_type > b?.act_type ? 1 : -1))"
                                :key="task.pid + '_' + taskStatus.name"
                            >
                                <SvgPencil v-if="settings.ext_tasks[taskStatus.act_type] && taskStatus.status" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                <SvgPushPin v-else-if="taskStatus.act_type === 'active' && taskStatus.status" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                <SvgCheck v-else-if="taskStatus.status" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                <SvgCross v-else height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                <span class="font-bold">{{ taskStatus.name }}</span>
                            </li>
                        </ul>
                        <span v-else class="font-mono">{{ task.status }}</span>
                    </li>
                </ul>
                <hr class="border-gray-400 dark:border-gray-600 my-3" />
                <Modal class="inline-block mr-1" :title="'确认删除成长任务: @' + pidNameKV[task.pid] + ' ？'" :aria-label="'确认删除成长任务: @' + pidNameKV[task.pid] + ' ？'">
                    <template #default>
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors">删除</button>
                    </template>
                    <template #container>
                        <button class="bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="deleteTask(task.id)">确认删除</button>
                    </template>
                </Modal>
                <Modal class="mx-1 inline-block" :title="'@' + pidNameKV[task.pid] + ' 成长任务记录'">
                    <template #default>
                        <button class="rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1 text-gray-900 dark:text-gray-100 transition-colors" title="日志">日志</button>
                    </template>
                    <template #container>
                        <div class="rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3" v-for="(log_, i) in parseLogs(task.log)" :key="task.id + i">
                            <h5 class="font-bold text-xl">{{ log_.date }}</h5>
                            <div class="grid grid-cols-6">
                                <span class="col-span-6 md:col-span-3" v-for="logValue in log_.tasks" :key="task.id + i + logValue.task_id || logValue.act_type">
                                    <SvgPencil v-if="settings.ext_tasks[logValue.act_type] && logValue.status === '1'" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                    <SvgPushPin v-else-if="logValue.act_type === 'active' && logValue.status === '1'" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                    <SvgCheck v-else-if="logValue.status === '1'" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                    <SvgCross v-else height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                    <span>{{ logValue.name || getTaskStatusName(logValue.act_type) }}</span>
                                </span>
                            </div>
                        </div>
                    </template>
                </Modal>
                <button v-show="!tasksStatus[task.pid]" class="border-2 border-sky-500 hover:bg-sky-500 rounded-lg mx-1 px-2.5 py-0.5 dark:text-gray-100 hover:text-gray-100 transition-colors" @click="getStatus(task.pid)">状态</button>
            </div>
        </template>
    </div>
    <SyncModule :loading="loading" :callback="getTasksList" />
</template>

<style scoped></style>
