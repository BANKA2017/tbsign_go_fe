<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { getPubDate } from '~/share/Time'
import { Notice } from '~/share/Tools'

const store = useMainStore()
const accounts = computed(() => store._cache?.accounts || [])
const pidNameKV = computed(() => store.pidNameKV)
const loading = computed(() => store.loading)

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
                navigateTo('/login')
                return
            }
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
                navigateTo('/login')
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
                navigateTo('/login')
                return
            }
            if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
                Notice(res.message, 'error')
                return
            }
            Notice('已添加 uid:' + selectedPID.value, 'success')
            tasksList.value.push(res.data)
            selectedPID.value = 0
            //console.log(res)
        })
}

const getTasksList = () => {
    store.updateValue('loading', true)

    fetch(store.basePath + '/plugins/growth_tasks/list', {
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
    getTasksList()
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
                navigateTo('/login')
                return
            }
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
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="px-3 py-2">
                <h4 class="text-lg mb-4">设置</h4>

                <div class="my-5">
                    <p class="my-2">默认只做签到任务，选择全部任务将会尝试完成所有日常任务</p>
                    <select v-model="settings.sign_only" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl">
                        <option value="0">仅签到</option>
                        <option value="1">全部任务</option>
                    </select>
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

                <div class="border-4 border-gray-400 dark:border-gray-700 rounded-xl p-5 my-3" v-for="task in tasksList" :key="task.id">
                    <li class="marker:text-sky-500">
                        <span class="font-bold">序号 : </span><span class="font-mono">{{ task.id }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">贴吧账号 : </span><span class="font-sans">{{ pidNameKV[task.pid] }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">上次执行 : </span><span class="font-mono">{{ getPubDate(new Date(task.date * 1000)) }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">状态 : </span>
                        <div v-if="task.status && task.status.startsWith('[')" class="grid grid-cols-6 gap-x-5">
                            <li class="ml-5 col-span-6 md:col-span-3 lg:col-span-2" v-for="taskStatus in JSON.parse(task.status)" :key="task.pid + '_' + taskStatus.name">
                                {{ taskStatus.status ? '✅' : '❌' }} <span class="font-bold">{{ taskStatus.name }}</span>
                            </li>
                        </div>
                        <span v-else class="font-mono">{{ task.status }}</span>
                    </li>
                    <details class="marker:text-sky-500">
                        <summary class="cursor-pointer"><span class="font-bold ml-1">日志</span></summary>
                        <li class="marker:text-sky-500 ml-3 break-all" v-for="(log_, i) in task.log.split('<br/>').filter((x) => x)" :key="task.id + i">{{ log_ }}</li>
                    </details>
                    <hr class="border-gray-400 dark:border-gray-600 my-3" />
                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors" @click="deleteTask(task.id)">删除</button>
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
                @click="getTasksList"
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
