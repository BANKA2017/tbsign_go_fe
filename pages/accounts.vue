<script setup lang="ts">
import Modal from '~/components/Modal.vue'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const loading = computed(() => store.loading)
const accountInfo = computed(() => store.cache?.accountInfo)
const pluginList = computed(() => store.cache?.plugin_list)
const isAdmin = computed(() => store.admin)

const route = useRoute()
const router = useRouter()

const forumListKeys = ['id', 'uid', 'pid', 'fid', 'tieba', 'no', 'status', 'latest', 'last_error']

const runtimeConfig = useRuntimeConfig()
const onePageItemsCount = runtimeConfig.public.NUXT_ACCOUNT_FORUM_LIST_ONE_PAGE_COUNT || 100

interface ForumListItem {
    fid: number
    id: number
    last_error: string
    latest: number
    no: boolean
    pid: number
    status: number
    tieba: string
    uid: number

    index: number
}

const ForumListArr2Obj: ForumListItem[] = (list = []) =>
    list.map((forum, index) => {
        let fl = Object.fromEntries(forum.map((v, i) => [forumListKeys[i], v]))
        fl.index = index
        return fl
    })

const list = ref<ForumListItem[]>([])
const accounts = computed(() => store.cache?.accounts)
const pidNameKV = computed(() => store.pidNameKV)

const editMode = ref<boolean>(false)

const batchList = ref<{ [p in number]: Set<number> }>({})

const batchSize = computed(() => {
    return Object.values(batchList.value).reduce((p, c) => p + c.size, 0)
})

const batchPid = computed(() => {
    return Number(Object.keys(batchList.value)?.[0] || 0)
})

const batchAdd = (pid: number, fid: number) => {
    if (!batchList.value[pid]) {
        batchList.value[pid] = new Set<number>()
    }
    if (batchList.value[pid].has(fid)) {
        return
    }
    batchList.value[pid].add(fid)
}
const batchDel = (pid: number, fid: number) => {
    if (!batchList.value[pid]) {
        return
    }
    batchList.value[pid].delete(fid)
    if (batchList.value[pid].size === 0) {
        delete batchList.value[pid]
    }
}

const batchHas = (pid: number, fid: number) => {
    if (!batchList.value[pid]) {
        return false
    }
    return batchList.value[pid].has(fid)
}

const batchModify = (listIndex: number) => {
    if (!editMode.value) {
        return
    }
    const pid = list.value[listIndex]?.pid || 0
    const fid = list.value[listIndex]?.fid || 0
    if (batchList.value[pid] && batchList.value[pid].has(fid)) {
        batchDel(pid, fid)
    } else {
        batchAdd(pid, fid)
    }
}

const batchSelectAllInPage = (pid: number) => {
    const accountIndex = accounts.value?.findIndex((acc) => acc.id === pid)
    if (accountIndex <= -1) {
        return
    }

    for (const tiebaItem of accountListFilterWrapper(accounts.value[accountIndex].id, accountIndex).slice(
        onePageItemsCount * (accounts.value[accountIndex].page || 0),
        onePageItemsCount + onePageItemsCount * (accounts.value[accountIndex].page || 0)
    )) {
        batchAdd(pid, tiebaItem.fid)
    }
}

watch(editMode, () => {
    batchList.value = {}
})

const checkAccountStatus = async () => {
    if (!accounts.value) {
        return
    }
    for (const accountIndex in accounts.value) {
        Request(store.basePath + '/account/' + accounts.value[accountIndex].id + '/status', {
            headers: {
                Authorization: store.authorization
            }
        }).then((res) => {
            if (res.code !== 200) {
                return
            }
            accounts.value[accountIndex].status = res.data
            //console.log(res)
        })
    }
}

const deleteAccount = async (id: string) => {
    Request(store.basePath + '/account/' + id, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        Notice('已删除 pid:' + id, 'success')
        store.updateCache(
            'accounts',
            accounts.value.filter((item) => item.id !== res.data.pid)
        )
        //console.log(res)
    })
}

const cleanTiebaList = async () => {
    Request(store.basePath + '/list', {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        Notice('已清空账号', 'success')
        list.value = []
        //console.log(res)
    })
}

const tbList = computed(() => {
    if (!list.value || !accounts.value) {
        return {}
    }
    let _list: { [p in string]: any } = {}
    for (const index in list.value) {
        const item = list.value[index]
        if (!_list[item.pid]) {
            _list[item.pid] = []
        }
        item.index = Number(index)
        _list[item.pid].push(item)
    }
    return _list
})

const tblistFilter = computed(() => {
    if (Object.keys(tbList.value).length === 0) {
        return {}
    }
    let _list: { [p in string]: any } = {}
    for (const pid in tbList.value) {
        _list[pid] = {
            success: tbList.value[pid].filter((item) => !item.no && item.status === 0 && new Date().getDate() === item.latest).length,
            failed: tbList.value[pid].filter((item) => !item.no && item.status !== 0 && new Date().getDate() === item.latest).length,
            pending: tbList.value[pid].filter((item) => !item.no && new Date().getDate() !== item.latest).length,
            ignore: tbList.value[pid].filter((item) => item.no).length
        }
    }
    return _list
})

const tbStatus = computed(() => {
    const tmpData = Object.values(tblistFilter.value)
    const successCount = tmpData.reduce((p, c) => p + c.success, 0)
    const failedCount = tmpData.reduce((p, c) => p + c.failed, 0)
    const pendingCount = tmpData.reduce((p, c) => p + c.pending, 0)
    const ignoreCount = tmpData.reduce((p, c) => p + c.ignore, 0)

    return {
        accountCount: tmpData.length,
        success: successCount,
        failed: failedCount,
        pending: pendingCount,
        ignore: ignoreCount,
        forumCount: list.value?.length || 0
    }
})

const syncList = ref<boolean>(false)

const syncTiebaList = async () => {
    if (syncList.value) {
        Notice('已有一个进行中的同步任务', 'error')
        return
    }
    syncList.value = true
    Request(store.basePath + '/list/sync?array_mode=1', {
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
            Notice('列表已同步', 'success')
            list.value = ForumListArr2Obj(res.data)
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
        .finally(() => {
            syncList.value = false
        })
}

const updateIgnoreForum = (pid = 0, fid: number | number[] = 0, forumIndex = -1, ignore = null) => {
    let fidList = []
    let batchMode = false
    let forumInfo

    if (Array.isArray(fid)) {
        fidList = fid.filter((f) => {
            const fIndex = list.value.findIndex((forum) => forum.pid === pid && forum.fid === f)
            return fIndex > -1 && /\d+/.test(f.toString()) && f > 0
        })
        if (fidList.length === 0) {
            Notice('无有效 fid', 'error')
            return
        }
        batchMode = true
    } else if (forumIndex <= -1) {
        Notice('pid:' + pid + '/fid:' + fid + ' 不存在')
        return
    } else {
        forumInfo = list.value[forumIndex]
        fidList = [fid]
    }

    Request(store.basePath + '/list/' + pid + '/' + fidList.join(',') + '/ignore', {
        headers: {
            Authorization: store.authorization
        },
        method: (!batchMode && typeof ignore !== 'boolean' && forumInfo?.no) || ignore ? 'DELETE' : 'PATCH'
    })
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            if (batchMode) {
                let count = res.data.fid.valid_fid.length
                if (count > 0) {
                    list.value
                        .filter((l) => l.pid === pid && res.data.fid.valid_fid.includes(l.fid))
                        .forEach((l) => {
                            l.no = res.data.no
                        })
                }
                Notice((res.data.no ? '已忽略 ' : '已恢复 ') + pidNameKV.value[pid] + '的' + count + '个贴吧', 'success')
            } else {
                Notice((res.data.no ? '已忽略 ' : '已恢复 ') + pidNameKV.value[pid] + '/' + list.value[forumIndex]?.tieba || 'fid:' + list.value[forumIndex]?.fid, 'success')
                list.value[forumIndex].no = res.data.no
            }
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
        .finally(() => {
            batchList.value = {}
        })
}

const loadingList = ref<boolean>(false)

const getForumList = () => {
    loadingList.value = true
    Request(store.basePath + '/list?array_mode=1', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            list.value = ForumListArr2Obj(res.data)
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
        .finally(() => {
            loadingList.value = false
        })
}

const deleteForum = (pid = 0, fid = 0, forumIndex = -1) => {
    let fidList = []
    let batchMode = false
    let forumInfo

    if (Array.isArray(fid)) {
        fidList = fid.filter((f) => {
            const fIndex = list.value.findIndex((forum) => forum.pid === pid && forum.fid === f)
            return fIndex > -1 && /\d+/.test(f.toString()) && f > 0
        })
        if (fidList.length === 0) {
            Notice('无有效 fid', 'error')
            return
        }
        batchMode = true
    } else if (forumIndex <= -1) {
        Notice('pid:' + pid + '/fid:' + fid + ' 不存在')
        return
    } else {
        forumInfo = list.value[forumIndex]
        fidList = [fid]
    }

    Request(store.basePath + '/list/' + pid + '/' + fidList.join(','), {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            if (batchMode) {
                let count = res.data.valid_fid.length
                if (count > 0) {
                    list.value = list.value.filter((l) => !(l.pid === pid && res.data.valid_fid.includes(l.fid)))
                }
                Notice('已删除 ' + pidNameKV.value[pid] + '的' + count + '个贴吧', 'success')
            } else {
                Notice('已删除 ' + pidNameKV.value[pid] + '/' + list.value[forumIndex]?.tieba || 'fid:' + list.value[forumIndex]?.fid, 'success')
                list.value = list.value.slice(0, forumIndex).concat(list.value.slice(forumIndex + 1))
            }
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
        .finally(() => {
            batchList.value = {}
        })
}

const resetForum = (pid = 0, fid = 0, forumIndex = -1) => {
    let fidList = []
    let batchMode = false
    let forumInfo

    if (Array.isArray(fid)) {
        fidList = fid.filter((f) => {
            const fIndex = list.value.findIndex((forum) => forum.pid === pid && forum.fid === f)
            return fIndex > -1 && /\d+/.test(f.toString()) && f > 0
        })
        if (fidList.length === 0) {
            Notice('无有效 fid', 'error')
            return
        }
        batchMode = true
    } else if (forumIndex <= -1) {
        Notice('pid:' + pid + '/fid:' + fid + ' 不存在')
        return
    } else {
        forumInfo = list.value[forumIndex]
        fidList = [fid]
    }
    Request(store.basePath + '/list/' + pid + '/' + fidList.join(',') + '/reset', {
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
            if (batchMode) {
                let count = res.data.valid_fid.length
                if (count > 0) {
                    list.value
                        .filter((l) => l.pid === pid && res.data.valid_fid.includes(l.fid))
                        .forEach((l) => {
                            l.latest = 0
                        })
                }
                Notice('已重置 ' + pidNameKV.value[pid] + '的' + count + '个贴吧', 'success')
            } else {
                Notice('已重置 ' + pidNameKV.value[pid] + '/' + list.value[forumIndex]?.tieba || 'fid:' + list.value[forumIndex]?.fid + ' 的签到状态', 'success')
                list.value[forumIndex].latest = 0
            }
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
        .finally(() => {
            batchList.value = {}
        })
}

const addForumValue = reactive<{
    pid: number
    fname: string
}>({
    pid: 0,
    fname: ''
})

const addForum = () => {
    if (addForumValue.pid <= 0 || addForumValue.fname === '') {
        return
    }

    let forumIndex = (list.value || []).map((forumData) => `${forumData?.pid || -1},${forumData?.tieba || ''}`).indexOf(`${addForumValue.pid},${addForumValue.fname}`)

    if (forumIndex !== -1) {
        Notice('pid:' + addForumValue.pid + '/fid:' + addForumValue.fname + ' 已存在')
        return
    }
    Request(store.basePath + '/list', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            pid: addForumValue.pid.toString(),
            fname: addForumValue.fname
        }).toString(),
        method: 'PATCH'
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            Notice('已添加 ' + pidNameKV.value[addForumValue.pid] + '/' + res.data?.tieba || 'fid:' + res.data?.fid, 'success')
            list.value.push(res.data)
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
}

const addAccountForm = reactive<{
    bduss: string
    stoken: string
}>({
    bduss: '',
    stoken: ''
})

const addAccount = (bduss = '', stoken = '') => {
    if (!bduss || !stoken) {
        Notice('BDUSS 或 Stoken 不可为空!', 'error')
        return
    }
    Request(store.basePath + '/account', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PATCH',
        body: new URLSearchParams({
            bduss,
            stoken
        })
    }).then((res) => {
        //console.log(res)
        router.replace({ query: {} })
        if (res.code === 201) {
            Notice('已添加 @' + res.data?.name || res.data?.portrait, 'success')
            accounts.value.push(res.data)
            return
        } else if (res.code === 200) {
            for (const accountIndex in accounts.value) {
                if (accounts.value[accountIndex].portrait === res.data.portrait) {
                    Notice('更新 BDUSS 信息成功 @' + res.data.name || res.data.portrait, 'success')
                    accounts.value[accountIndex] = res.data
                    //console.log('find', accountIndex)
                    return
                }
            }
        } else {
            Notice(res.message, 'error')
        }
    })
}

const updateAccoutList = () => {
    Request(store.basePath + '/account?array_mode=1', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            store.updateCache(
                'accounts',
                (res.data || []).map((account) => ({
                    id: account[0],
                    uid: account[1],
                    name: account[2],
                    portrait: account[3],
                    page: 0,
                    more: false,
                    filter: 'all',
                    search: ''
                }))
            )
            //console.log(res)
        })
        .catch((e) => {
            Notice(e.toString(), 'error')
        })
}

const qrLoginData = reactive<{
    sign: string
    imgurl: string
    done: boolean
}>({
    sign: '',
    imgurl: '',
    done: false
})

const getQRCode = () => {
    qrLoginData.sign = ''
    qrLoginData.imgurl = ''
    qrLoginData.done = false
    Request(store.basePath + '/account/qrcode', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                qrLoginData.done = true
                return
            }
            qrLoginData.sign = res.data?.sign
            qrLoginData.imgurl = res.data?.imgurl
            //console.log(res)
        })
        .catch((e) => {
            qrLoginData.done = true
        })
}

const submitQRLogin = () => {
    Request(store.basePath + '/account/qrlogin', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams({
            sign: qrLoginData.sign
        })
    })
        .then((res) => {
            qrLoginData.done = true
            //console.log(res)
            if (res.code === 201) {
                Notice('已添加 @' + res.data?.name || res.data?.portrait, 'success')
                accounts.value.push(res.data)
                if (!(pluginList.value?.['ver4_ref']?.status || false)) {
                    Notice('注意：当前站点未开启自动同步贴吧列表插件，请手动同步贴吧列表', 'info', 0)
                }
                return
            } else if (res.code === 200) {
                for (const accountIndex in accounts.value) {
                    if (accounts.value[accountIndex].portrait === res.data.portrait) {
                        Notice('更新 BDUSS 信息成功 @' + res.data.name || res.data.portrait, 'success')
                        accounts.value[accountIndex] = res.data
                        if (!(pluginList.value?.['ver4_ref']?.status || false)) {
                            Notice('注意：当前站点未开启自动同步贴吧列表插件，请手动同步贴吧列表', 'info', 0)
                        }
                        //console.log('find', accountIndex)
                        return
                    }
                }
            } else {
                Notice(res.message, 'error')
            }
        })
        .catch((e) => {
            qrLoginData.done = true
        })
}

const accountListFilterWrapper = (id: number, accountIndex: number) => {
    const tmpList = (tbList.value[id] || [])
        .filter((tiebaItem) => {
            switch (accounts.value[accountIndex].filter) {
                case 'ignore':
                    return !!tiebaItem.no
                case 'wait':
                    return !tiebaItem.no && new Date().getDate() !== tiebaItem.latest
                case 'fail':
                    return !tiebaItem.no && tiebaItem.status !== 0
                case 'success':
                    return !tiebaItem.no && tiebaItem.status === 0 && new Date().getDate() === tiebaItem.latest
                default:
                    return true
            }
        })
        .filter((tiebaItem) => {
            if (!accounts.value[accountIndex].search) {
                return true
            }
            return tiebaItem.tieba.toString().includes(accounts.value[accountIndex].search)
        })
    // effect
    if (tmpList.length / onePageItemsCount < accounts.value[accountIndex].page) {
        accounts.value[accountIndex].page = tmpList.length > 0 ? Math.ceil(tmpList.length / onePageItemsCount) - 1 : 0
    }
    return tmpList
}

onMounted(() => {
    if (route.hash.length > 2) {
        try {
            store.updateValue('loading', true)
            const hashParams = Object.fromEntries(new URLSearchParams((route.hash || '').slice(2)).entries())
            const csrfToken = localStorage.getItem('tc_csrf_token') || ''
            if (hashParams.bduss && hashParams.stoken) {
                if (csrfToken === hashParams.csrf) {
                    if (store.authorization) {
                        addAccount(hashParams.bduss, hashParams.stoken)
                    } else {
                        Notice('未登录', 'error')
                    }
                } else {
                    Notice('csrf 检查失败', 'error')
                }
                window.location.hash = ''
            }
            localStorage.removeItem('tc_csrf_token')
            store.updateValue('loading', false)
        } catch (e) {
            console.error(e)
            store.updateValue('loading', false)
            // Notice(e.toString(), 'error')
        }
    }
    getForumList()
})
</script>

<template>
    <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-5">
        共有 {{ tbStatus.accountCount }} 个账号，当前已列出 {{ tbStatus.forumCount }} 个贴吧。已签到 <span class="text-green-500">{{ tbStatus.success }}</span> 个贴吧，失败 <span class="text-pink-500">{{ tbStatus.failed }}</span> 个，忽略
        <span class="text-gray-600 dark:text-gray-400">{{ tbStatus.ignore }}</span> 个，还有 <span class="text-orange-500">{{ tbStatus.pending }}</span> 个贴吧等待签到
    </div>
    <div class="my-5 grid grid-cols-6 gap-2 max-w-[48em]">
        <Modal class="col-span-3 md:col-span-1" title="添加贴吧账号" aria-label="添加贴吧账号">
            <template #default>
                <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="扫码登录并更新或添加贴吧账号" aria-label="扫码登录并更新或添加贴吧账号" @click="getQRCode">
                    添加账号
                </button>
            </template>
            <template #container>
                <div>
                    <template v-if="!isAdmin && accountInfo?.system_settings?.bduss_num !== '0' && Number(accountInfo?.system_settings?.bduss_num || -1) > Object.keys(pidNameKV).length"> 无法添加更多账号，请删除一些账号再试</template>
                    <template v-else>
                        <div v-if="qrLoginData.done" class="w-full">
                            <button @click="getQRCode" class="col-span-2 md:col-span-1 px-2 py-1 my-1 w-full rounded-xl border-4 border-sky-500 bg-sky-500 text-gray-100">再次添加</button>
                        </div>
                        <div v-else-if="qrLoginData.sign && qrLoginData.imgurl">
                            <div class="flex justify-center mb-5">
                                <img class="max-w-36 max-h-36 aspect-square w-full h-full border-4" v-if="qrLoginData.imgurl" :src="'//' + qrLoginData.imgurl" :alt="'登录二维码#https://wappass.baidu.com/wp/?qrlogin=&sign=' + qrLoginData.sign" />
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <button @click="submitQRLogin" class="col-span-2 md:col-span-1 px-2 py-1 my-1 rounded-xl border-4 border-sky-500 hover:bg-sky-500 dark:text-gray-100 hover:text-gray-100 transition-colors">确认</button>
                                <NuxtLink
                                    role="button"
                                    class="col-span-2 md:col-span-1 px-2 py-1 my-1 rounded-xl border-4 border-sky-500 bg-sky-500 text-gray-100 block text-center"
                                    v-if="qrLoginData.sign"
                                    :href="'https://wappass.baidu.com/wp/?qrlogin=&sign=' + qrLoginData.sign"
                                    target="_blank"
                                >
                                    网页授权
                                </NuxtLink>
                            </div>
                        </div>

                        <div v-else>
                            <div class="flex justify-center mb-5">
                                <div class="max-w-36 max-h-36 w-full animate-pulse bg-slate-300 dark:bg-slate-500">
                                    <div class="w-[300px] h-[300px]"></div>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="col-span-2 md:col-span-1 px-2 py-1 my-1 h-[2.5em] rounded-xl animate-pulse bg-slate-300 dark:bg-slate-500"></div>
                                <div class="col-span-2 md:col-span-1 px-2 py-1 my-1 h-[2.5em] rounded-xl animate-pulse bg-slate-300 dark:bg-slate-500"></div>
                            </div>
                        </div>

                        <p class="text-sm mt-2">* 使用任意百度系应用的客户端扫码确认后点击 “确认” 按钮</p>
                        <p class="text-sm">** 或通过移动设备（手机）打开 “网页授权” 页确认后，返回点击 “确认” 按钮</p>
                        <!--<hr class="border-gray-400 dark:border-gray-600 my-3" />
                            <button @click="newTiebaAccount" class="w-full px-2 py-1 text-xl rounded-xl bg-sky-500 text-gray-100">自动导入</button>-->
                        <div class="flex gap-3 my-3 border-gray-400 dark:border-gray-600">
                            <hr class="grow my-3" />
                            <span>或</span>
                            <hr class="grow my-3" />
                        </div>

                        <form>
                            <label for="add-bduss">BDUSS</label>
                            <input autocomplete="off" id="add-bduss" type="text" v-model="addAccountForm.bduss" class="block w-full bg-gray-200 dark:bg-gray-900 rounded-xl" />
                            <label for="add-stoken">Stoken</label>
                            <input autocomplete="off" id="add-stoken" type="text" v-model="addAccountForm.stoken" class="block w-full bg-gray-200 dark:bg-gray-900 rounded-xl" />
                            <input
                                @click="
                                    (e) => {
                                        e.preventDefault()
                                        addAccount(addAccountForm.bduss, addAccountForm.stoken)
                                    }
                                "
                                role="button"
                                type="submit"
                                class="bg-sky-500 px-2 py-1 rounded-lg my-3 text-gray-100"
                                value="提交"
                            />
                        </form>
                    </template>
                </div>
            </template>
        </Modal>

        <Modal class="col-span-3 md:col-span-1" title="同步列表" aria-label="同步列表">
            <template #default>
                <button class="w-full rounded-2xl border-2 px-4 py-1 border-gray-300 hover:bg-gray-300 hover:text-black transition-colors" title="从贴吧拉取列表，更新数据库" aria-label="从贴吧拉取列表，更新数据库">同步列表</button>
            </template>
            <template #container>
                <p class="mb-3">注意：同步贴吧列表可能需要较长时间，请等到右上角圈圈消失并弹出“列表已同步”消息后再关闭本窗口！</p>
                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="syncTiebaList">确认同步</button>
            </template>
        </Modal>
        <Modal class="col-span-3 md:col-span-1" title="清空贴吧列表" aria-label="清空贴吧列表">
            <template #default>
                <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="清空贴吧列表" aria-label="清空贴吧列表">清空列表</button>
            </template>
            <template #container>
                <p class="mb-3">注意：确认后将会清空贴吧列表！</p>
                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="cleanTiebaList">确认清空</button>
            </template>
        </Modal>
        <button @click="checkAccountStatus" class="col-span-3 md:col-span-1 rounded-2xl border-2 px-4 py-1 border-gray-300 hover:bg-gray-300 hover:text-black transition-colors" title="检查账号状态" aria-label="检查贴吧账号状态">检查状态</button>
        <button
            @click="editMode = !editMode"
            :class="'col-span-3 md:col-span-1 rounded-2xl border-2 px-4 py-1 border-gray-300 hover:bg-gray-300 hover:text-black transition-colors ' + (editMode ? 'bg-gray-300 text-black' : '')"
            title="编辑贴吧列表"
            aria-label="编辑贴吧列表"
        >
            编辑列表
        </button>
        <Modal class="col-span-3 md:col-span-1" title="手动添加贴吧" aria-label="手动添加贴吧">
            <template #default>
                <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="手动添加贴吧" aria-label="手动添加贴吧">添加贴吧</button>
            </template>
            <template #container>
                <div class="rounded-2xl border-4 border-pink-500 p-5 mb-5" v-if="accountInfo?.system_settings?.forum_sync_policy === 'add_delete' && (pluginList?.['ver4_ref']?.status || false)">
                    注意：本站的贴吧同步策略处于 [严格模式]。全部手动添加的贴吧，都将会在下次同步贴吧列表时被移除
                </div>

                <div class="my-2">
                    <label for="pid-to-add">选择账号</label>
                    <select id="pid-to-add" v-model="addForumValue.pid" class="bg-gray-200 dark:bg-gray-900 dark:text-gray-100 form-select block w-full my-3 rounded-xl">
                        <option v-for="(name, pid) in pidNameKV" :key="pid" :value="pid">{{ name }}</option>
                    </select>
                </div>

                <div class="my-2">
                    <label for="add-fname">贴吧名称</label>
                    <input id="add-fname" class="form-input bg-gray-200 dark:bg-gray-900 w-full rounded-xl" type="text" v-model="addForumValue.fname" placeholder="贴吧名字（不带末尾吧字）" />
                </div>
                <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 transition-colors" @click="addForum">保存</button>
            </template>
        </Modal>
    </div>

    <div class="grid grid-cols-12 gap-2 mt-2 mb-12">
        <div v-for="(account, index) in accounts" :key="account.id" class="bg-gray-200 dark:bg-gray-800 col-span-12 rounded-2xl">
            <div
                :class="{ flex: true, 'justify-between': true, 'cursor-pointer': true, sticky: true, 'top-0': true, 'bg-gray-200': true, 'dark:bg-gray-800': true, 'z-10': true, 'px-3': true, 'pt-2': true, ' rounded-2xl': true }"
                @click="accounts[index].more = !accounts[index].more"
            >
                <div class="flex gap-3">
                    <div :class="{ relative: true, hidden: true, '2xs:block': !(editMode || accounts[index].more), 'xs:block': true }">
                        <img :alt="`baidu-avatar-` + account.portrait" :src="`https://himg.bdimg.com/sys/portrait/item/${account.portrait}`" class="w-10 h-10 rounded-full my-1 bg-gray-300 dark:bg-gray-700" />
                        <div
                            :class="`h-2 w-2 absolute right-1 bottom-1 rounded-full border ` + (account.status === undefined ? 'bg-gray-500 border-gray-500' : account.status ? 'bg-green-500 border-green-500' : 'bg-pink-500 border-pink-500')"
                            :style="{
                                background: account.status === false ? 'repeating-linear-gradient(to right bottom,#fff9,#fff9 .05rem,rgb(236 72 153) .05rem,rgb(236 72 153) .11rem)' : '',
                                'background-color': account.status === false ? 'rgb(236 72 153)' : ''
                            }"
                        ></div>
                    </div>
                    <div :class="{ 'max-w-20': accounts[index].more, 'max-w-40': !accounts[index].more, 'xs:max-w-40': true, flex: true, 'flex-col': true }">
                        <NuxtLink
                            :class="{
                                'overflow-hidden': true,
                                truncate: true,
                                'whitespace-nowrap': true,
                                'inline-block': true,
                                'hover:underline': true,
                                'underline-offset-2': true
                            }"
                            :title="account.portrait"
                            :to="`https://tieba.baidu.com/home/main?id=${account.portrait}`"
                            target="blank"
                        >
                            {{ account.name || account.portrait }}</NuxtLink
                        >
                        <div
                            :class="{ 'text-sm': true, flex: true, 'flex-col': accounts[index].more, 'flex-row': !accounts[index].more, 'xs:flex-row': true }"
                            :title="(tblistFilter[account.id]?.success || 0) + '成功，' + (tblistFilter[account.id]?.pending || 0) + '等待，' + (tblistFilter[account.id]?.failed || 0) + '失败，' + (tblistFilter[account.id]?.ignore || 0) + '忽略'"
                            :aria-label="
                                (tblistFilter[account.id]?.success || 0) + '成功，' + (tblistFilter[account.id]?.pending || 0) + '等待，' + (tblistFilter[account.id]?.failed || 0) + '失败，' + (tblistFilter[account.id]?.ignore || 0) + '忽略'
                            "
                        >
                            <div v-if="loadingList" class="w-20 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
                            <template v-else>
                                <div>
                                    <span class="text-green-500">{{ tblistFilter[account.id]?.success || 0 }}</span
                                    ><span class="mx-0.5">/</span><span class="text-orange-500">{{ tblistFilter[account.id]?.pending || 0 }}</span
                                    ><span class="mx-0.5">/</span>
                                </div>
                                <div>
                                    <span class="text-pink-500">{{ tblistFilter[account.id]?.failed || 0 }}</span
                                    ><span class="mx-0.5">/</span><span class="text-gray-600 dark:text-gray-400">{{ tblistFilter[account.id]?.ignore || 0 }}</span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
                <div
                    class="flex gap-2"
                    @click="
                        (e) => {
                            e.stopPropagation()
                        }
                    "
                >
                    <div v-show="accounts[index].more" class="flex">
                        <select
                            title="页码"
                            :aria-label="accounts[index].name + '贴吧列表的页码'"
                            v-model="accounts[index].page"
                            class="rounded-xl bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select block w-24 mx-1 my-1 text-sm h-10"
                            placeholder="页码"
                            v-show="new Array(Math.ceil((accountListFilterWrapper(account.id, index) || []).length / onePageItemsCount)).length > 0"
                        >
                            <option :value="i" v-for="i in Object.keys(new Array(Math.ceil((accountListFilterWrapper(account.id, index) || []).length / onePageItemsCount)).fill(null))">第{{ Number(i) + 1 }}页</option>
                        </select>
                        <select
                            title="筛选"
                            :aria-label="accounts[index].name + '贴吧列表的筛选类型'"
                            v-model="accounts[index].filter"
                            class="rounded-xl bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select w-22 mx-1 my-1 text-sm h-10"
                            placeholder="筛选"
                        >
                            <option value="all">全部</option>
                            <option value="success">成功</option>
                            <option value="fail">失败</option>
                            <option value="wait">待签</option>
                            <option value="ignore">忽略</option>
                        </select>
                    </div>
                    <button v-show="editMode" @click="deleteAccount(account.id)" class="rounded-full h-10 text-pink-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors my-1" title="删除贴吧账号" aria-label="删除贴吧账号">
                        <uno-icon class="i-bi:x-circle-fill" style="width: 1.5em; height: 1.5em" />
                    </button>
                    <button @click="accounts[index].more = !accounts[index].more" class="rounded-full h-10 text-gray-900 dark:text-gray-100 transition-colors my-1" title="展开贴吧列表" aria-label="展开贴吧列表">
                        <uno-icon v-if="accounts[index].more" class="i-bi:arrows-collapse" style="width: 1.5em; height: 1.5em" />
                        <uno-icon v-else class="i-bi:arrows-expand" style="width: 1.5em; height: 1.5em" />
                    </button>
                </div>
            </div>
            <div
                :class="{ 'list-in': accounts[index].more, 'list-out': !accounts[index].more, 'z-0': true, 'px-3': true, 'pb-2': true, ' rounded-b-2xl': true }"
                :style="{
                    'max-height': accounts[index].more
                        ? (accountListFilterWrapper(account.id, index).slice(onePageItemsCount * (accounts[index].page || 0), onePageItemsCount + onePageItemsCount * (accounts[index].page || 0)).length * 3 + 8) * 2 + 'rem'
                        : 0
                }"
            >
                <input type="text" placeholder="搜索贴吧列表" v-model="accounts[index].search" class="block w-full bg-gray-200 dark:bg-gray-900 rounded-xl my-3" />

                <div v-for="(tiebaItem, i) in accountListFilterWrapper(account.id, index).slice(onePageItemsCount * (accounts[index].page || 0), onePageItemsCount + onePageItemsCount * (accounts[index].page || 0))" :key="account.id + '_' + i">
                    <hr v-if="i > 0" class="border-gray-400 dark:border-gray-600" />
                    <div
                        :class="{
                            flex: true,
                            'justify-between': true,
                            'py-1': true,
                            'bg-gray-300': batchHas(tiebaItem.pid, tiebaItem.fid),
                            'dark:bg-gray-700': batchHas(tiebaItem.pid, tiebaItem.fid),
                            'cursor-pointer': editMode,
                            '-mx-2': editMode,
                            'px-2': editMode,
                            'rounded-xl': editMode
                        }"
                        @click="batchModify(tiebaItem.index)"
                    >
                        <div class="flex flex-col">
                            <div>
                                <NuxtLink class="hover:underline underline-offset-2" :to="`https://tieba.baidu.com/f?kw=${tiebaItem.tieba}`" target="blank">{{ tiebaItem.tieba }}</NuxtLink>
                            </div>
                            <span class="text-xs text-gray-500 block">
                                <span v-if="tiebaItem.no" class="text-gray-500">已忽略</span>
                                <span v-else-if="tiebaItem.status === 0 && new Date().getDate() === tiebaItem.latest" class="text-green-500">已签到</span>
                                <span v-else-if="new Date().getDate() !== tiebaItem.latest" class="text-orange-500">待签到</span>
                                <span v-else-if="tiebaItem.status !== 0" class="text-pink-500" :title="tiebaItem.status + '#' + tiebaItem.last_error" :aria-label="tiebaItem.status + '#' + tiebaItem.last_error">{{
                                    tiebaItem.status + '#' + tiebaItem.last_error
                                }}</span>
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <button
                                v-show="editMode"
                                class="transition-colors rounded-full text-pink-500"
                                @click.stop="deleteForum(tiebaItem.pid, tiebaItem.fid, tiebaItem.index)"
                                :title="'删除贴吧 ' + account.name + '/' + tiebaItem.tieba"
                                :aria-label="'删除贴吧 ' + account.name + '/' + tiebaItem.tieba"
                            >
                                <uno-icon class="i-bi:x-circle-fill" style="width: 1.5em; height: 1.5em" />
                            </button>
                            <div v-show="!editMode">
                                <div v-if="tiebaItem.no" class="text-gray-500 inline-block pt-2">
                                    <uno-icon class="i-bi:dash-circle-fill" style="width: 1.5em; height: 1.5em" />
                                </div>
                                <div v-else-if="tiebaItem.status === 0 && new Date().getDate() === tiebaItem.latest" class="text-green-500 inline-block pt-2">
                                    <uno-icon class="i-bi:check-circle-fill" style="width: 1.5em; height: 1.5em" />
                                </div>
                                <div v-else-if="new Date().getDate() !== tiebaItem.latest" class="text-orange-500 inline-block pt-2">
                                    <uno-icon class="i-bi:clock-history" style="width: 1.5em; height: 1.5em" />
                                </div>
                                <div v-else class="text-pink-500 inline-block pt-2">
                                    <uno-icon class="i-bi:exclamation-circle-fill" style="width: 1.5em; height: 1.5em" />
                                </div>
                            </div>
                            <button
                                v-show="editMode"
                                class="transition-colors text-gray-500"
                                @click.stop="updateIgnoreForum(tiebaItem.pid, tiebaItem.fid, tiebaItem.index)"
                                :title="(tiebaItem.no ? '(已忽略)' : '(未忽略)') + '忽略签到贴吧 ' + account.name + '/' + tiebaItem.tieba"
                                :aria-label="(tiebaItem.no ? '(已忽略)' : '(未忽略)') + '忽略签到贴吧 ' + account.name + '/' + tiebaItem.tieba"
                            >
                                <uno-icon v-if="tiebaItem.no" class="i-bi:dash-circle-fill" style="width: 1.5em; height: 1.5em" />
                                <uno-icon v-else class="i-bi:dash-circle-dotted" style="width: 1.5em; height: 1.5em" />
                            </button>
                            <button
                                v-show="editMode"
                                class="transition-colors text-orange-500"
                                @click.stop="resetForum(tiebaItem.pid, tiebaItem.fid, tiebaItem.index)"
                                :title="'重置签到状态 ' + account.name + '/' + tiebaItem.tieba"
                                :aria-label="'重置签到状态 ' + account.name + '/' + tiebaItem.tieba"
                            >
                                <uno-icon class="i-bi:bootstrap-reboot" style="width: 1.5em; height: 1.5em" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
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
        @click="
            () => {
                updateAccoutList()
                getForumList()
            }
        "
    >
        <uno-icon :class="{ 'i-bi:arrow-clockwise': true, 'animate-spin': loading }" />
    </div>
    <Modal
        class="col-span-3 md:col-span-1"
        :title="'已为 ' + pidNameKV[batchPid] + ' 选择 ' + batchSize + ' 个贴吧'"
        :aria-label="'已选择 ' + batchSize + ' 个贴吧'"
        :active="batchSize > 0"
        :no_modal="true"
        @active-callback="
            (c) => {
                if (!c) {
                    batchList = {}
                }
            }
        "
    >
        <template #default></template>
        <template #container>
            <p v-if="!editMode">请点击 “编辑列表” 按钮</p>
            <p v-else-if="Object.keys(batchList).length !== 1">暂不支持多账号批处理</p>
            <p v-else-if="batchList[batchPid].size === 0">请至少选择一个贴吧</p>
            <div v-else>
                <button class="border-pink-500 hover:border-pink-600 dark:hover:border-pink-400 border-2 px-3 py-1 rounded-lg transition-colors mr-3 mb-1" @click="deleteForum(batchPid, [...batchList[batchPid]], -1)">删除</button>
                <button class="border-gray-500 hover:border-gray-600 dark:hover:border-gray-400 border-2 px-3 py-1 rounded-lg transition-colors mr-3 mb-1" @click="updateIgnoreForum(batchPid, [...batchList[batchPid]], -1, false)">忽略</button>
                <button
                    class="border-gray-500 hover:border-gray-600 dark:hover:border-gray-400 border-2 border-dotted hover:border-dashed px-3 py-1 rounded-lg transition-colors mr-3 mb-1"
                    @click="updateIgnoreForum(batchPid, [...batchList[batchPid]], -1, true)"
                >
                    取消忽略
                </button>
                <button class="border-orange-500 hover:border-orange-600 dark:hover:border-orange-400 border-2 px-3 py-1 rounded-lg transition-colors mr-3 mb-1" @click="resetForum(batchPid, [...batchList[batchPid]], -1)">重置</button>
                <button class="border-sky-500 hover:border-sky-600 dark:hover:border-sky-400 border-2 px-3 py-1 rounded-lg transition-colors mr-3 mb-1" @click="batchSelectAllInPage(batchPid)">全选</button>
            </div>
        </template>
    </Modal>
</template>

<style scoped></style>
