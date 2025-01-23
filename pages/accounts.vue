<script setup lang="ts">
import Modal from '~/components/Modal.vue'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const loading = computed(() => store.loading)
const accountInfo = computed(() => store.cache?.accountInfo)
const pluginList = computed(() => store.cache?.plugin_list)

const route = useRoute()
const router = useRouter()

const list = ref<
    {
        fid: number
        id: number
        last_error: string
        latest: number
        no: boolean
        pid: number
        status: number
        tieba: string
        uid: number
    }[]
>([])
const accounts = computed(() => store.cache?.accounts)
const pidNameKV = computed(() => store.pidNameKV)

const editMode = ref<boolean>(false)

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
    for (const item of list.value) {
        if (!_list[item.pid]) {
            _list[item.pid] = []
        }
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
    Request(store.basePath + '/list/sync', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => {
            syncList.value = false
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            Notice('列表已同步', 'success')
            list.value = res.data
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
            syncList.value = false
        })
}

const updateIgnoreForum = (pid = 0, fid = 0) => {
    if (pid <= 0 || fid <= 0) {
        return
    }

    let forumIndex = (list.value || []).map((forumData) => `${forumData?.pid || -1},${forumData?.fid || -1}`).indexOf(`${pid},${fid}`)

    if (forumIndex === -1) {
        Notice('pid:' + pid + '/fid:' + fid + ' 不存在')
        return
    }
    const forumInfo = list.value[forumIndex]
    Request(store.basePath + '/list/' + forumInfo.pid + '/' + forumInfo.fid + '/ignore', {
        headers: {
            Authorization: store.authorization
        },
        method: forumInfo?.no ? 'DELETE' : 'PATCH'
    })
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            Notice((res.data.no ? '已忽略 ' : '已恢复 ') + pidNameKV.value[res.data.pid] + '/' + list.value[forumIndex]?.tieba || 'fid:' + list.value[forumIndex]?.fid, 'success')
            list.value[forumIndex].no = res.data.no
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
}

const getForumList = () => {
    Request(store.basePath + '/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            list.value = res.data
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
}

const deleteForum = (pid = 0, fid = 0) => {
    if (pid <= 0 || fid <= 0) {
        return
    }

    let forumIndex = (list.value || []).map((forumData) => `${forumData?.pid || -1},${forumData?.fid || -1}`).indexOf(`${pid},${fid}`)

    if (forumIndex === -1) {
        Notice('pid:' + pid + '/fid:' + fid + ' 不存在')
        return
    }
    const forumInfo = list.value[forumIndex]
    Request(store.basePath + '/list/' + forumInfo.pid + '/' + forumInfo.fid, {
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
            Notice('已删除 ' + pidNameKV.value[pid] + '/' + list.value[forumIndex]?.tieba || 'fid:' + list.value[forumIndex]?.fid, 'success')
            list.value = list.value.slice(0, forumIndex).concat(list.value.slice(forumIndex + 1))
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
}

const resetForum = (pid = 0, fid = 0) => {
    if (pid <= 0 || fid <= 0) {
        return
    }

    let forumIndex = (list.value || []).map((forumData) => `${forumData?.pid || -1},${forumData?.fid || -1}`).indexOf(`${pid},${fid}`)

    if (forumIndex === -1) {
        Notice('pid:' + pid + '/fid:' + fid + ' 不存在')
        return
    }
    const forumInfo = list.value[forumIndex]
    Request(store.basePath + '/list/' + forumInfo.pid + '/' + forumInfo.fid + '/reset', {
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
            Notice('已重置 ' + pidNameKV.value[pid] + '/' + list.value[forumIndex]?.tieba || 'fid:' + list.value[forumIndex]?.fid + ' 的签到状态', 'success')
            list.value[forumIndex].latest = 0
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
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
    Request(store.basePath + '/account', {
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
                (res.data || []).map((account) => {
                    account.page = 0
                    account.more = false
                    account.filter = 'all'
                    account.search = ''
                    return account
                })
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
    if (tmpList.length / 100 < accounts.value[accountIndex].page) {
        accounts.value[accountIndex].page = tmpList.length > 0 ? Math.ceil(tmpList.length / 100) - 1 : 0
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

                    <p class="text-sm mt-2">* 使用任意百度可扫码的客户端扫码确认后点击 “确认” 按钮</p>
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
        <div v-for="(account, index) in accounts" :key="account.id" class="bg-gray-200 dark:bg-gray-800 col-span-12 rounded-2xl py-2 px-3">
            <div :class="{ flex: true, 'justify-between': true, 'cursor-pointer': true, sticky: true, 'top-0': true, 'bg-gray-200': true, 'dark:bg-gray-800': true }" @click="accounts[index].more = !accounts[index].more">
                <div class="flex gap-3">
                    <div :class="{ relative: true, hidden: true, '2xs:block': !(editMode || accounts[index].more), 'xs:block': true }">
                        <img :alt="`baidu-avatar-` + account.portrait" :src="`https://himg.bdimg.com/sys/portrait/item/${account.portrait}`" class="w-10 h-10 rounded-full my-1" />
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
                            {{ account.name }}</NuxtLink
                        >
                        <div
                            :class="{ 'text-sm': true, flex: true, 'flex-col': accounts[index].more, 'flex-row': !accounts[index].more, 'xs:flex-row': true }"
                            :title="(tblistFilter[account.id]?.success || 0) + '成功，' + (tblistFilter[account.id]?.pending || 0) + '等待，' + (tblistFilter[account.id]?.failed || 0) + '失败，' + (tblistFilter[account.id]?.ignore || 0) + '忽略'"
                            :aria-label="
                                (tblistFilter[account.id]?.success || 0) + '成功，' + (tblistFilter[account.id]?.pending || 0) + '等待，' + (tblistFilter[account.id]?.failed || 0) + '失败，' + (tblistFilter[account.id]?.ignore || 0) + '忽略'
                            "
                        >
                            <div>
                                <span class="text-green-500">{{ tblistFilter[account.id]?.success || 0 }}</span
                                ><span class="mx-0.5">/</span><span class="text-orange-500">{{ tblistFilter[account.id]?.pending || 0 }}</span
                                ><span class="mx-0.5">/</span>
                            </div>
                            <div>
                                <span class="text-pink-500">{{ tblistFilter[account.id]?.failed || 0 }}</span
                                ><span class="mx-0.5">/</span><span class="text-gray-600 dark:text-gray-400">{{ tblistFilter[account.id]?.ignore || 0 }}</span>
                            </div>
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
                            v-show="new Array(Math.ceil((accountListFilterWrapper(account.id, index) || []).length / 100)).length > 0"
                        >
                            <option :value="i" v-for="i in Object.keys(new Array(Math.ceil((accountListFilterWrapper(account.id, index) || []).length / 100)).fill(null))">第{{ Number(i) + 1 }}页</option>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em]" viewBox="0 0 16 16">
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
                        </svg>
                    </button>
                    <button @click="accounts[index].more = !accounts[index].more" class="rounded-full h-10 text-gray-900 dark:text-gray-100 transition-colors my-1" title="展开贴吧列表" aria-label="展开贴吧列表">
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em]" viewBox="0 0 16 16">
                            <path
                                v-if="accounts[index].more"
                                fill="currentColor"
                                fill-rule="evenodd"
                                d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8m7-8a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0m-.5 11.707l-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-1 0z"
                            />
                            <path
                                v-else
                                fill="currentColor"
                                fill-rule="evenodd"
                                d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            <div
                :class="{ 'list-in': accounts[index].more, 'list-out': !accounts[index].more }"
                :style="{ 'max-height': accounts[index].more ? accountListFilterWrapper(account.id, index).slice(100 * (accounts[index].page || 0), 100 + 100 * (accounts[index].page || 0)).length * 3 + 8 + 'rem' : 0 }"
            >
                <input type="text" placeholder="搜索贴吧列表" v-model="accounts[index].search" class="block w-full bg-gray-200 dark:bg-gray-900 rounded-xl my-3" />

                <div v-for="(tiebaItem, i) in accountListFilterWrapper(account.id, index).slice(100 * (accounts[index].page || 0), 100 + 100 * (accounts[index].page || 0))" :key="account.id + '_' + i">
                    <hr v-if="i > 0" class="border-gray-400 dark:border-gray-600 my-1" />
                    <div class="flex justify-between">
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
                                class="transition-colors"
                                @click="deleteForum(tiebaItem.pid, tiebaItem.fid)"
                                :title="'删除贴吧 ' + account.name + '/' + tiebaItem.tieba"
                                :aria-label="'删除贴吧 ' + account.name + '/' + tiebaItem.tieba"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] rounded-full text-pink-500 transition-colors" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
                                </svg>
                            </button>
                            <div v-show="!editMode">
                                <svg v-if="tiebaItem.no" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-gray-500" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z" />
                                </svg>
                                <svg
                                    v-else-if="tiebaItem.status === 0 && new Date().getDate() === tiebaItem.latest"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="100%"
                                    height="100%"
                                    fill="currentColor"
                                    class="w-[1.5em] text-green-500"
                                    viewBox="0 0 16 16"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417L5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
                                    />
                                </svg>
                                <svg v-else-if="new Date().getDate() !== tiebaItem.latest" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-orange-500" viewBox="0 0 16 16">
                                    <path
                                        d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"
                                    />
                                    <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
                                    <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-pink-500" viewBox="0 0 16 16">
                                    <path fill="currentColor" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2a1 1 0 0 0 0-2" />
                                </svg>
                            </div>
                            <button
                                v-show="editMode"
                                class="transition-colors"
                                @click="updateIgnoreForum(tiebaItem.pid, tiebaItem.fid)"
                                :title="'忽略签到贴吧 ' + account.name + '/' + tiebaItem.tieba"
                                :aria-label="'忽略签到贴吧 ' + account.name + '/' + tiebaItem.tieba"
                            >
                                <svg v-if="tiebaItem.no" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-gray-500" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z" />
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-gray-500" viewBox="0 0 16 16">
                                    <path
                                        d="M8 0q-.264 0-.523.017l.064.998a7 7 0 0 1 .918 0l.064-.998A8 8 0 0 0 8 0M6.44.152q-.52.104-1.012.27l.321.948q.43-.147.884-.237L6.44.153zm4.132.271a8 8 0 0 0-1.011-.27l-.194.98q.453.09.884.237zm1.873.925a8 8 0 0 0-.906-.524l-.443.896q.413.205.793.459zM4.46.824q-.471.233-.905.524l.556.83a7 7 0 0 1 .793-.458zM2.725 1.985q-.394.346-.74.74l.752.66q.303-.345.648-.648zm11.29.74a8 8 0 0 0-.74-.74l-.66.752q.346.303.648.648zm1.161 1.735a8 8 0 0 0-.524-.905l-.83.556q.254.38.458.793l.896-.443zM1.348 3.555q-.292.433-.524.906l.896.443q.205-.413.459-.793zM.423 5.428a8 8 0 0 0-.27 1.011l.98.194q.09-.453.237-.884zM15.848 6.44a8 8 0 0 0-.27-1.012l-.948.321q.147.43.237.884zM.017 7.477a8 8 0 0 0 0 1.046l.998-.064a7 7 0 0 1 0-.918zM16 8a8 8 0 0 0-.017-.523l-.998.064a7 7 0 0 1 0 .918l.998.064A8 8 0 0 0 16 8M.152 9.56q.104.52.27 1.012l.948-.321a7 7 0 0 1-.237-.884l-.98.194zm15.425 1.012q.168-.493.27-1.011l-.98-.194q-.09.453-.237.884zM.824 11.54a8 8 0 0 0 .524.905l.83-.556a7 7 0 0 1-.458-.793zm13.828.905q.292-.434.524-.906l-.896-.443q-.205.413-.459.793zm-12.667.83q.346.394.74.74l.66-.752a7 7 0 0 1-.648-.648zm11.29.74q.394-.346.74-.74l-.752-.66q-.302.346-.648.648zm-1.735 1.161q.471-.233.905-.524l-.556-.83a7 7 0 0 1-.793.458zm-7.985-.524q.434.292.906.524l.443-.896a7 7 0 0 1-.793-.459zm1.873.925q.493.168 1.011.27l.194-.98a7 7 0 0 1-.884-.237zm4.132.271a8 8 0 0 0 1.012-.27l-.321-.948a7 7 0 0 1-.884.237l.194.98zm-2.083.135a8 8 0 0 0 1.046 0l-.064-.998a7 7 0 0 1-.918 0zM4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z"
                                    />
                                </svg>
                            </button>
                            <button
                                v-show="editMode"
                                class="transition-colors"
                                @click="resetForum(tiebaItem.pid, tiebaItem.fid)"
                                :title="'重置签到状态 ' + account.name + '/' + tiebaItem.tieba"
                                :aria-label="'重置签到状态 ' + account.name + '/' + tiebaItem.tieba"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-orange-500" viewBox="0 0 16 16">
                                    <path
                                        d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z"
                                    />
                                </svg>
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
        <svg :class="{ 'animate-spin': loading }" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
            <g fill="currentColor">
                <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182a.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z" />
            </g>
        </svg>
    </div>
</template>

<style scoped></style>
