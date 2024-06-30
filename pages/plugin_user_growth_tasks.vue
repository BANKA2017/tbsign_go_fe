<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { getPubDate } from '~/share/Time'
import { Notice } from '~/share/Tools'

const store = useMainStore()
const accounts = computed(() => store._cache?.accounts || [])
const pidNameKV = computed(() => store.pidNameKV)

const settings = ref<{ sign_only: '0' | '1' }>({ sign_only: '0' })
const selectedPID = ref<number>(0)

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

const canSelectPIDList = computed(() => Object.fromEntries(Object.entries(pidNameKV.value).filter((x) => !tasksList.value.find((y) => y.pid.toString() === x[0]))))

const saveSettings = () => {
    fetch(store.basePath + '/plugins/growth_tasks/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PUT',
        body: new URLSearchParams(settings.value).toString()
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('login')
                return
            }
            if (res.code !== 200) {
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
    fetch(store.basePath + '/plugins/growth_tasks/list/' + id, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('login')
                return
            }
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

const addTask = () => {
    if (selectedPID.value <= 0) {
        return
    }
    fetch(store.basePath + '/plugins/growth_tasks/list', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PATCH',
        body: new URLSearchParams({ pid: selectedPID.value.toString() }).toString()
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            Notice('已添加 uid:' + selectedPID.value, 'success')
            tasksList.value.push(res.data)
            selectedPID.value = 0
            //console.log(res)
        })
}

onMounted(() => {
    fetch(store.basePath + '/plugins/growth_tasks/settings', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            settings.value = res.data
            //console.log(res)
        })

    fetch(store.basePath + '/plugins/growth_tasks/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            tasksList.value = res.data
            //console.log(res)
        })
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="px-3 py-2">
                <h4 class="text-lg mb-4">设置</h4>

                <div class="my-5">
                    <p class="my-2">默认只做签到任务，选择全部任务将会尝试完成所有日常任务</p>
                    <select v-model="settings.sign_only" class="dark:bg-black dark:text-white form-select">
                        <option value="0">仅签到</option>
                        <option value="1">全部任务</option>
                    </select>
                </div>

                <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded-lg px-3 py-1 text-white transition-colors" @click="saveSettings">保存</button>
            </div>

            <div class="px-3 py-2">
                <h4 class="text-lg">任务列表</h4>

                <div class="marker:text-sky-500 my-5" v-if="Object.keys(canSelectPIDList).length">
                    <label for="pid-to-add">添加</label>
                    <select id="pid-to-add" v-model="selectedPID" class="dark:bg-black dark:text-white form-select block w-full my-3">
                        <option v-for="(name, pid) in canSelectPIDList" :key="pid" :value="pid">{{ name }}</option>
                    </select>

                    <button class="px-3 py-1 rounded-lg my-2 bg-sky-500" @click="addTask">保存</button>
                </div>

                <div class="border border-sky-500 rounded-xl p-5 my-3" v-for="task in tasksList" :key="task.id">
                    <li class="marker:text-sky-500">
                        <span class="font-bold">序号 : </span><span class="font-mono">{{ task.id }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">贴吧账号 : </span><span class="font-mono">{{ pidNameKV[task.pid] }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">上次执行 : </span><span class="font-mono">{{ getPubDate(new Date(task.date * 1000)) }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">状态 : </span>
                        <template v-if="task.status && task.status.startsWith('[')">
                            <li class="ml-5" v-for="taskStatus in JSON.parse(task.status)" :key="task.pid + '_' + taskStatus.name">
                                <span class="font-bold">{{ taskStatus.name }} : </span>{{ taskStatus.status ? '✅' : '❌' }}
                            </li>
                        </template>

                        <span v-else class="font-mono">{{ task.status }}</span>
                    </li>
                    <details class="marker:text-sky-500">
                        <summary class="cursor-pointer"><span class="font-bold ml-1">日志</span></summary>
                        <li class="marker:text-sky-500 ml-3 break-all" v-for="(log_, i) in task.log.split('<br/>').filter((x) => x)" :key="task.id + i">{{ log_ }}</li>
                    </details>
                    <hr class="my-3" />
                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-white transition-colors" @click="deleteTask(task.id)">删除</button>
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
