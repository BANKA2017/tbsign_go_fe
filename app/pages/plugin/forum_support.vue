<script setup lang="ts">
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const accounts = computed(() => store.cache?.accounts)
const loading = computed(() => store.loading || loadingSettings.value || claimingItem.value)

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
        fid: number
        name: string
        nid: number
        tieba: string
        portrait: string

        // icon: string
        // icon_name: string
        // icon_title: string
        // icon_props_id: number
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

const forumStatus = reactive<{
    loading: boolean
    data: any
}>({
    loading: false,
    data: []
})

const getForumSupportStatus = (pid: number, fid: number, noLoading = false) => {
    if (!noLoading) {
        forumStatus.loading = true
    }
    Request(store.basePath + '/plugins/ver4_rank/npc/' + pid + '/' + fid + '/items', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            forumStatus.data = res.data
            // console.log(forumStatus.data, res.data)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
        .finally(() => {
            forumStatus.loading = false
        })
}

const forumItemsModalHooker = (active: boolean, fid: number) => {
    if (active) {
        getForumSupportStatus(activePID.value, fid)
    } else {
        forumStatus.data = []
    }
}

const forumItemClaimStatus = (item: any) => {
    if (item.is_unlock == 0) {
        return '待解锁'
    } else if (item.can_get == 0) {
        return '待领取'
    } else if (item.is_used == 0) {
        return '可领取'
    } else if (item.props_category == 200 || item.props_category == 113 || item.props_category == 300) {
        return '已获得'
    } else {
        return '取消使用'
    }
}

const claimingItem = ref<boolean>(false)
const claimForumSupportItem = (pid: number, fid: number, props_id: number, props_title: string) => {
    // console.log(pid, fid, props_id, props_title)

    claimingItem.value = true
    Request(store.basePath + '/plugins/ver4_rank/npc/' + pid + '/' + fid + '/items/' + props_id + '/claim', {
        method: 'POST',
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            Notice('已领取' + props_title, 'success')
            getForumSupportStatus(pid, fid, true)
            // console.log(forumStatus.data, res.data)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
        .finally(() => {
            claimingItem.value = false
        })
}

const dropForumSupportItem = (pid: number, fid: number, props_id: number, props_title: string) => {
    // console.log(pid, fid, props_id, props_title)

    claimingItem.value = true
    Request(store.basePath + '/plugins/ver4_rank/npc/' + pid + '/' + fid + '/items/' + props_id + '/drop', {
        method: 'POST',
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            Notice('已移除' + props_title, 'success')
            getForumSupportStatus(pid, fid, true)
            // console.log(forumStatus.data, res.data)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
        .finally(() => {
            claimingItem.value = false
        })
}

const forumItemClaimRequire = (item: any, userStats: any) => {
    if (item.props_category == 300) {
        return '每天可使用1次，本吧会员使用次数不限'
    } else {
        if (item.limit_sign_level == 0 && item.lock_need_vip == 0) {
            return '无'
        }

        if (item.limit_sign_level > 0) {
            return `连续助攻 ${item.limit_sign_level} 次，还剩 ${item.limit_sign_level - Number(userStats.my_continue_days)} 次`
        }

        if (item.lock_need_vip == 1) {
            return '本吧会员专属'
        }
    }
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
        <h3 class="text-2xl mb-4">设置</h3>
        <button :class="{ 'bg-sky-500': !tasksSwitch, 'bg-pink-500': tasksSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true, 'text-gray-100': true, 'transition-colors': true }" @click="updateTasksSwitch">
            {{ tasksSwitch ? '已开启助攻' : '已停止助攻' }}
        </button>
    </div>

    <div class="px-3 py-2">
        <h4 class="text-xl">任务列表</h4>

        <div class="my-5 grid grid-cols-6 gap-2 max-w-[48em]">
            <Modal class="col-span-6 sm:col-span-3 lg:col-span-1" title="编辑名人堂任务">
                <template #default>
                    <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="编辑名人堂任务">编辑列表</button>
                </template>
                <template #container>
                    <label for="pid-to-add">账号</label>
                    <select id="pid-to-add" v-model="activePID" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl block w-full mt-1 mb-3">
                        <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name || account.portrait }}</option>
                    </select>
                    <div class="" v-if="activePID">
                        <div v-for="character in list" :key="character.nid" class="my-1 flex justify-between">
                            <label class="form-check flex align-items-center gap-2">
                                <input
                                    input
                                    type="checkbox"
                                    class="form-checkbox bg-gray-100 dark:bg-gray-900 dark:checked:bg-blue-500 my-1"
                                    v-model="fourmSupportSettingsKV[activePID][character.nid]"
                                    :id="'ver4_rank:character:' + character.nid"
                                /><!--<img :src="'https://himg.bdimg.com/sys/portraitn/item/' + character.portrait" :alt="character.title" class="w-4 h-4 my-1" />--><span class="ml-1" :for="'ver4_rank:character:' + character.nid"
                                    ><span class="font-bold">{{ character.name }}</span> (<NuxtLink class="hover:underline underline-offset-1" :to="'https://tieba.baidu.com/f?ie=utf-8&kw=' + character.tieba" target="blank"
                                        >{{ character.tieba }}吧</NuxtLink
                                    >)</span
                                ></label
                            >
                            <div>
                                <Modal
                                    :nested_modal="true"
                                    class="col-span-6 sm:col-span-3 lg:col-span-1"
                                    :title="character.tieba + '吧名人堂'"
                                    @active-callback="
                                        (active) => {
                                            forumItemsModalHooker(active, character.fid)
                                        }
                                    "
                                >
                                    <template #default>
                                        <span class="underline cursor-pointer text-sm" title="物品列表">物品</span>
                                    </template>
                                    <template #container>
                                        <div v-if="forumStatus.loading">加载中...</div>
                                        <div v-else-if="forumStatus.data?.length <= 0">加载失败</div>
                                        <div v-else-if="forumStatus.data?.length === 1">
                                            <div v-for="(propsItem, i) in forumStatus.data[0]?.props || []" :key="propsItem.props_id">
                                                <hr v-if="Number(i) > 0" class="border-gray-400 dark:border-gray-600" />
                                                <div
                                                    :class="{
                                                        'flex justify-between py-1 -mx-1 px-1 rounded': true,
                                                        'cursor-not-allowed': !propsItem.can_get,
                                                        'cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600':
                                                            propsItem.can_get && (!propsItem.is_used || propsItem.title.includes('印记') || propsItem.title.includes('边框') || propsItem.title.includes('气泡')) && !propsItem.title.includes('顶帖')
                                                    }"
                                                    @click="
                                                        () => {
                                                            if (propsItem.can_get && (!propsItem.is_used || propsItem.title.includes('印记')) && !propsItem.title.includes('顶帖')) {
                                                                claimForumSupportItem(activePID, character.fid, propsItem.props_id, propsItem.title)
                                                            } else if (propsItem.can_get && propsItem.is_used && (propsItem.title.includes('边框') || propsItem.title.includes('气泡'))) {
                                                                dropForumSupportItem(activePID, character.fid, propsItem.props_id, propsItem.title)
                                                            }
                                                        }
                                                    "
                                                >
                                                    <div class="flex gap-2">
                                                        <img :src="propsItem.logo_picurl" :alt="propsItem.title" class="w-8 h-8 my-1 rounded" />
                                                        <div class="flex flex-col">
                                                            <div>
                                                                <span>{{ propsItem.title }}</span>
                                                            </div>
                                                            <div class="text-xs text-gray-500 block">
                                                                <div class="inline-block">
                                                                    <span
                                                                        v-if="propsItem.can_get"
                                                                        :class="{ 'text-green-500': propsItem.is_used, 'dark:text-gray-300 text-gray-700': !propsItem.is_used }"
                                                                        :title="propsItem.title + forumItemClaimStatus(propsItem)"
                                                                        :aria-label="propsItem.title + forumItemClaimStatus(propsItem)"
                                                                        >{{ forumItemClaimStatus(propsItem) }}</span
                                                                    >
                                                                    <span
                                                                        v-else
                                                                        class="text-pink-500"
                                                                        :title="propsItem.title + '领取条件：' + forumItemClaimRequire(propsItem, forumStatus.data[0].user)"
                                                                        :aria-label="propsItem.title + '领取条件：' + forumItemClaimRequire(propsItem, forumStatus.data[0].user)"
                                                                        >{{ forumItemClaimRequire(propsItem, forumStatus.data[0].user) }}</span
                                                                    >
                                                                </div>
                                                                <div class="inline-block ml-1" v-if="propsItem.can_get">
                                                                    <span class="dark:text-gray-300 text-gray-700" v-if="propsItem.title.includes('印记')">31天有效</span>
                                                                    <span class="dark:text-gray-300 text-gray-700" v-else-if="propsItem.title.includes('边框') || propsItem.title.includes('气泡') || propsItem.title.includes('背景')">自动装备</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </Modal>
                            </div>
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
    <SyncModule :loading="loading" :callback="getForumSupportList" />
</template>

<style scoped></style>
