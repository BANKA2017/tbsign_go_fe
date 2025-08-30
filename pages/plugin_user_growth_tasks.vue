<script setup lang="ts">
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const pidNameKV = computed(() => store.pidNameKV)
const loading = computed(() => store.loading)

const settings = ref<{ sign_only: '0' | '1' | '2'; break_icon_tasks: '0' | '1' | '2'; ext_tasks: { [p in string]: string } }>({ sign_only: '0', break_icon_tasks: '0', ext_tasks: {} })
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

const tasksStatus = <{ [p in string]: any }>ref({})

const canSelectPIDList = computed(() => Object.fromEntries(Object.entries(pidNameKV.value).filter((x) => !tasksList.value.find((y) => y.pid.toString() === x[0]))))

const saveSettings = () => {
    Request(store.basePath + '/plugins/kd_growth/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PUT',
        body: new URLSearchParams({
            sign_only: settings.value.sign_only,
            break_icon_tasks: settings.value.break_icon_tasks,
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
        tasksStatus.value[id] = (res.data?.level_info || []).find((levelInfo) => levelInfo.is_current === 1)
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
                ...Object.fromEntries(
                    log
                        .slice(12)
                        .split(',')
                        .map((kv) => kv.split(':'))
                )
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
        //console.log(res)
    })
})
</script>

<template>
    <div class="px-3 py-2">
        <h4 class="text-lg mb-4">设置</h4>

        <div class="my-5">
            <p class="my-2">默认只做签到任务，选择全部任务将会尝试完成所有日常任务</p>
            <select v-model="settings.sign_only" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl">
                <option value="0">仅签到</option>
                <option value="1">全部任务</option>
                <option value="2">全部任务+自定义任务</option>
            </select>

            <p class="my-2">印记任务开关，完成印记任务可能会导致账号的 IP 归属地更变为签到服务的服务器所在地</p>
            <select v-model="settings.break_icon_tasks" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl">
                <option value="0">不跳过印记任务</option>
                <option value="1">跳过印记任务</option>
            </select>

            <p class="my-2">自定义任务</p>
            <Modal class="inline-block mr-1" title="编辑自定义任务" aria-label="编辑自定义任务">
                <template #default>
                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors">编辑任务</button>
                </template>
                <template #container>
                    <div v-if="Object.keys(settings.ext_tasks).length > 0">
                        <div v-for="(v, act_type) in settings.ext_tasks" :key="act_type" class="rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3">
                            <label :for="'act-type-name-' + act_type" class="mb-2 font-mono">ActType: {{ act_type }}</label>
                            <p class="w-full mb-2">
                                <span class="font-mono">Name: </span><input :id="'act-type-name-' + act_type" class="form-input bg-gray-200 dark:bg-gray-900 rounded-xl text-sm" type="text" v-model="settings.ext_tasks[act_type]" placeholder="Name" />
                            </p>
                            <button
                                class="bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg transition-colors text-gray-100"
                                @click="
                                    () => {
                                        delete settings.ext_tasks[act_type]
                                    }
                                "
                            >
                                删除
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
                <div v-if="tasksStatus[task.pid]?.level" class="absolute right-4 top-4 group">
                    <span class="px-2 rounded group-hover:rounded-r-none border-2 border-yellow-500 bg-yellow-500 text-black font-bold">LV{{ tasksStatus[task.pid]?.level }}</span>
                    <span class="px-2 rounded-r border-2 hidden group-hover:inline border-yellow-500 text-black dark:text-gray-100">{{ tasksStatus[task.pid]?.growth_value }}/{{ tasksStatus[task.pid]?.next_level_value }}</span>
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
                            <li class="ml-5 col-span-6 md:col-span-3 lg:col-span-2" v-for="taskStatus in JSON.parse(task.status).sort((a, b) => (a?.act_type > b?.act_type ? 1 : -1))" :key="task.pid + '_' + taskStatus.name">
                                <SvgCheck v-if="taskStatus.status" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
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
                                <span class="col-span-6 md:col-span-3" v-for="(logValue, logKey) in log_" v-show="logKey !== 'date'" :key="task.id + i + logKey">
                                    <SvgCheck v-if="logValue === '1'" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                    <SvgCross v-else height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                    <span>{{ getTaskStatusName(logKey) }}</span>
                                </span>
                            </div>
                        </div>
                    </template>
                </Modal>
                <button v-show="!tasksStatus[task.pid]" class="border-2 border-sky-500 hover:bg-sky-500 rounded-lg mx-1 px-2.5 py-0.5 dark:text-gray-100 hover:text-gray-100 transition-colors" @click="getStatus(task.pid)">状态</button>
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
        @click="getTasksList"
    >
        <uno-icon :class="{ 'i-bi:arrow-clockwise': true, 'animate-spin': loading }" />
    </div>
</template>

<style scoped></style>
