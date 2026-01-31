<script setup lang="ts">
import { DayList, getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const pidNameKV = computed(() => store.pidNameKV)
const loading = computed(() => store.loading)

const settings = ref<{ checkin_only: '0' | '1'; vip_matrix: '0' | '1' }>({ checkin_only: '0', vip_matrix: '0' })

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
const tasksSignDayKV = computed(() =>
    Object.fromEntries(
        tasksList.value.map((task, index) => {
            let signDay = -1
            try {
                signDay = JSON.parse(task.status).find((task) => task.task_id === 1)?.sign_day || 0
            } catch {}
            return [index, signDay]
        })
    )
)

const canSelectPIDList = computed(() => Object.fromEntries(Object.entries(pidNameKV.value).filter((x) => !tasksList.value.find((y) => y.pid.toString() === x[0]))))

const saveSettings = () => {
    Request(store.basePath + '/plugins/kd_wenku_tasks/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PUT',
        body: new URLSearchParams(settings.value).toString()
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
    if (id <= 0) {
        return
    }
    Request(store.basePath + '/plugins/kd_wenku_tasks/list/' + id, {
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

// time.Weekday -> Sunday is 0
const newTaskSettings = reactive<{
    selectedPID: number
    day: number
    autoBreak: boolean
}>({
    selectedPID: 0,
    day: 0,
    autoBreak: true
})

const addTask = () => {
    if (newTaskSettings.selectedPID <= 0) {
        return
    }
    Request(store.basePath + '/plugins/kd_wenku_tasks/list', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PATCH',
        body: new URLSearchParams({
            pid: newTaskSettings.selectedPID.toString(),
            day: (newTaskSettings.day - 1).toString(),
            auto_break: newTaskSettings.autoBreak ? '1' : '0'
        }).toString()
    }).then((res) => {
        if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
            Notice(res.message, 'error')
            return
        }
        Notice('已添加 pid:' + newTaskSettings.selectedPID, 'success')
        tasksList.value.push(res.data)
        newTaskSettings.selectedPID = 0
        newTaskSettings.day = 0
        newTaskSettings.autoBreak = true
        //console.log(res)
    })
}

const loadingTasks = ref<boolean>(false)

const getTasksList = () => {
    loadingTasks.value = true
    Request(store.basePath + '/plugins/kd_wenku_tasks/list', {
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

const claimVIP = (pid: number = 0) => {
    Request(store.basePath + '/plugins/kd_wenku_tasks/claim/' + pid, {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        if (!res.data?.data?.prize?.name) {
            Notice('未知错误', 'error')
            console.error(res.data)
        } else {
            Notice('@' + pidNameKV.value[pid] + '已领取' + res.data.data.prize.name, 'success', 0)
        }

        //console.log(res)
    })
}

const _atob = (s: string = '') => atob(s)

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
    Request(store.basePath + '/plugins/kd_wenku_tasks/settings', {
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
    <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-2">使用此插件可能会导致文库签到功能被封禁，封禁理由为：<span class="font-bold">您的账号因涉嫌刷分作弊而被封禁，不能进行此项操作</span></div>
    <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-5">
        不支持自动领取 VIP，当任务的右上角出现 <span class="inline-block px-2 rounded bg-yellow-500 text-black font-bold">VIP</span> 时，请手动登录对应账号，然后访问
        <a :href="_atob('aHR0cHM6Ly90YW5iaS5iYWlkdS5jb20vaDVhcHB0b3BpYy9icm93c2UvbG90dGVyeXZpcDIwMjIxMQ')" target="_blank" class="underline underline-offset-2">签到7天抽奖</a> 抽取 VIP
    </div>
    <div class="px-3 py-2">
        <h4 class="text-lg mb-4">设置</h4>

        <div class="my-5">
            <p class="my-2">默认只做签到任务，选择全部任务将会尝试完成所有任务</p>
            <select v-model="settings.checkin_only" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl">
                <option value="1">仅签到</option>
                <option value="0">全部任务</option>
            </select>
            <p class="my-2">构建文库 VIP 账号组。账号不足会导致 VIP 无法覆盖每一天，建议至少准备 7 个账号（当前账号数量：{{ tasksList.length }}）</p>
            <select v-model="settings.vip_matrix" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl">
                <option value="1">启用 VIP 账号组</option>
                <option value="0">禁用 VIP 账号组</option>
            </select>
        </div>

        <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded-lg px-3 py-1 text-gray-100 transition-colors" @click="saveSettings">保存</button>
    </div>

    <div class="px-3 py-2">
        <h4 class="text-lg">任务列表</h4>

        <Modal
            class="col-span-6 sm:col-span-3 lg:col-span-1 my-2"
            title="添加文库任务"
            v-if="Object.keys(canSelectPIDList).length"
            @active-callback="
                () => {
                    newTaskSettings.selectedPID = 0
                    newTaskSettings.day = 0
                    newTaskSettings.autoBreak = true
                }
            "
        >
            <template #default>
                <button class="rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="添加添加账号">添加账号</button>
            </template>
            <template #container>
                <div class="my-2">
                    <label for="pid-to-add">选择账号</label>
                    <select id="pid-to-add" v-model="newTaskSettings.selectedPID" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl block w-full my-3">
                        <option v-for="(name, pid) in canSelectPIDList" :key="pid" :value="pid">{{ name }}</option>
                    </select>
                </div>

                <div class="my-2" v-show="settings.vip_matrix === '1'">
                    <label for="select-day">VIP 兑换日</label>
                    <select id="select-day" v-model="newTaskSettings.day" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl block w-full my-3">
                        <option v-for="(day, i) in ['自动选择', ...DayList]" :key="day" :value="i">{{ day }}</option>
                    </select>
                </div>

                <div class="my-2" v-show="newTaskSettings.day !== 0">
                    <input type="checkbox" class="form-checkbox bg-gray-100 dark:bg-gray-900 dark:checked:bg-blue-500" v-model="newTaskSettings.autoBreak" id="auto-break" /><label class="ml-2" for="auto-break"
                        >调整首次签到 （第一次兑换日时暂停一次签到调整周期）</label
                    >
                </div>

                <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 text-gray-100" @click="addTask">保存</button>
            </template>
        </Modal>

        <div v-if="loadingTasks" class="w-full h-32 rounded-xl bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
        <template v-else>
            <div class="border-4 border-gray-400 dark:border-gray-700 rounded-xl p-5 my-3 relative" v-for="(task, index) in tasksList" :key="task.id">
                <span v-if="tasksSignDayKV[index] === 7" class="absolute right-4 top-4 px-2 rounded bg-yellow-500 text-black font-bold">VIP</span>
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
                            <li class="ml-5 col-span-6 md:col-span-3 lg:col-span-2" v-for="taskStatus in JSON.parse(task.status)" :key="task.pid + '_' + taskStatus.name">
                                <SvgCheck v-if="taskStatus.task_status === 3" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" title="完成" />
                                <SvgWarning v-else-if="taskStatus.task_status === 2" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" title="完成未领取" />
                                <SvgCross v-else height="1em" width="1em" class="inline-block -mt-0.5 mr-1" title="未完成" />
                                <span :class="{ 'font-bold': true }">{{ taskStatus.task_name }}{{ taskStatus.sign_day !== undefined ? ` / 第 ${taskStatus.sign_day} 天` : '' }}</span>
                            </li>
                        </ul>
                        <span v-else class="font-mono">{{ task.status }}</span>
                    </li>
                </ul>

                <hr class="border-gray-400 dark:border-gray-600 my-3" />
                <Modal class="inline-block mr-1" :title="'确认删除文库任务: @' + pidNameKV[task.pid] + ' ？'" :aria-label="'确认删除文库任务: @' + pidNameKV[task.pid] + ' ？'">
                    <template #default>
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors">删除</button>
                    </template>
                    <template #container>
                        <button class="bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="deleteTask(task.id)">确认删除</button>
                    </template>
                </Modal>
                <Modal class="mx-1 inline-block" :title="'@' + pidNameKV[task.pid] + ' 文库任务记录'">
                    <template #default>
                        <button class="rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1 text-gray-900 dark:text-gray-100 transition-colors" title="日志">日志</button>
                    </template>
                    <template #container>
                        <div class="rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3" v-for="(log_, i) in parseLogs(task.log)" :key="task.id + i">
                            <h5 class="font-bold text-xl">{{ log_.date }}</h5>
                            <div class="grid grid-cols-6">
                                <span class="col-span-6 md:col-span-3" v-for="(logValue, logKey) in log_" v-show="logKey !== 'date'" :key="task.id + i + logKey">
                                    <SvgCheck v-if="logValue === '3'" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                                    <SvgWarning v-else-if="logValue === '2'" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" title="完成未领取" />
                                    <SvgCross v-else height="1em" width="1em" class="inline-block -mt-0.5 mr-1" title="未完成" />
                                    <span>{{ logKey }}</span>
                                </span>
                            </div>
                        </div>
                    </template>
                </Modal>
                <button v-if="tasksSignDayKV[index] === 7" class="border-2 border-sky-500 hover:bg-sky-500 rounded-lg px-2.5 py-0.5 dark:text-gray-100 hover:text-gray-100 transition-colors mx-1" @click="claimVIP(task.pid)">领取 VIP</button>
            </div>
        </template>
        <hr class="my-10 border-gray-400 dark:border-gray-600" />
        <ul class="marker:text-sky-500 list-disc list-inside gap-3 ml-5">
            <li><a :href="_atob('aHR0cHM6Ly90YW5iaS5iYWlkdS5jb20vaDUtYnVzaW5lc3MvYnJvd3NlL2RhaWx5Y2hlY2tpbj9hcHBfdmVyPTkuMC43MA')" target="_blank" class="underline underline-offset-2">查看任务</a></li>
            <li><a :href="_atob('aHR0cHM6Ly90YW5iaS5iYWlkdS5jb20vaDVhcHB0b3BpYy9icm93c2UvbG90dGVyeXZpcDIwMjIxMQ')" target="_blank" class="underline underline-offset-2">签到7天抽奖</a></li>
        </ul>
    </div>
    <SyncModule :loading="loading" :callback="getTasksList" />
</template>

<style scoped></style>
