<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import Modal from '~/components/Modal.vue'
import { Notice } from '~/share/Tools'

const store = useMainStore()
const loading = computed(() => store.loading)

const route = useRoute()
const router = useRouter()

const list = computed(() => store._cache?.list)
const accounts = computed(() => store._cache?.accounts)
const pidNameKV = computed(() => store.pidNameKV)

const editMode = ref<boolean>(false)

const buffer_to_base64 = (buf: ArrayBuffer) => {
    let binary = ''
    const bytes = new Uint8Array(buf)
    for (var i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return globalThis.btoa(binary)
}

const newTiebaAccount = () => {
    if (typeof window === 'undefined') {
        return ''
    }
    const csrfToken = buffer_to_base64(crypto.getRandomValues(new Uint8Array(16)))
        .replaceAll('/', '_')
        .replaceAll('+', '-')
        .replaceAll('=', '')
    localStorage.setItem('tc_csrf_token', csrfToken)
    window.open(`https://bduss.nest.moe/#/` + str_to_base64url(window.location.origin + route.fullPath + '#/stoken_type=tb&csrf=' + csrfToken), '_self')
}

const checkAccountStatus = async () => {
    if (!accounts.value) {
        return
    }
    for (const accountIndex in accounts.value) {
        fetch(store.basePath + '/account/' + accounts.value[accountIndex].id + '/status', {
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
                    return
                }
                accounts.value[accountIndex].status = res.data
                //console.log(res)
            })
    }
}

const deleteAccount = async (id: string) => {
    fetch(store.basePath + '/account/' + id, {
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
            Notice('已删除 pid:' + id, 'success')
            store.updateCache(
                'accounts',
                accounts.value.filter((item) => item.id !== res.data.pid)
            )
            //console.log(res)
        })
}

const str_to_base64url = (text: string) => {
    return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const cleanTiebaList = async () => {
    fetch(store.basePath + '/list', {
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
            Notice('已清空帐号', 'success')
            store.updateCache('list', [])
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

const syncTiebaList = async () => {
    store.updateValue('loading', true)
    fetch(store.basePath + '/list/sync', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
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
            Notice('列表已同步', 'success')
            store.updateCache('list', res.data)
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
            store.updateValue('loading', false)
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
    store.updateValue('loading', true)
    fetch(store.basePath + '/list/' + forumInfo.pid + '/' + forumInfo.fid + '/ignore', {
        headers: {
            Authorization: store.authorization
        },
        method: forumInfo?.no ? 'DELETE' : 'PATCH'
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
                return
            }
            const tmpList = list.value
            Notice((res.data.no ? '已忽略 ' : '已恢复 ') + pidNameKV.value[res.data.pid] + '/' + tmpList[forumIndex]?.tieba || 'fid:' + tmpList[forumIndex]?.fid, 'success')
            tmpList[forumIndex].no = res.data.no
            store.updateCache('list', tmpList)
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
            store.updateValue('loading', false)
        })
}

const getForumList = () => {
    store.updateValue('loading', true)
    fetch(store.basePath + '/list', {
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
                return
            }
            store.updateCache('list', res.data)
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
            store.updateValue('loading', false)
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
    store.updateValue('loading', true)
    fetch(store.basePath + '/list/' + forumInfo.pid + '/' + forumInfo.fid, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
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
            let tmpList = list.value
            Notice('已删除 ' + pidNameKV.value[pid] + '/' + tmpList[forumIndex]?.tieba || 'fid:' + tmpList[forumIndex]?.fid, 'success')
            tmpList = [...tmpList.slice(0, forumIndex), ...tmpList.slice(forumIndex + 1)]
            store.updateCache('list', tmpList)
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
            store.updateValue('loading', false)
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
    store.updateValue('loading', true)
    fetch(store.basePath + '/list', {
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
            const tmpList = list.value
            Notice('已添加 ' + pidNameKV.value[addForumValue.pid] + '/' + res.data?.tieba || 'fid:' + res.data?.fid, 'success')
            tmpList.push(res.data)
            store.updateCache('list', tmpList)
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
            store.updateValue('loading', false)
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
    fetch(store.basePath + '/account', {
        headers: {
            Authorization: store.authorization
        },
        method: 'PATCH',
        body: new URLSearchParams({
            bduss,
            stoken
        })
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
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

const qrLoginData = reactive<{
    sign: string
    imgurl: string
}>({
    sign: '',
    imgurl: ''
})

const getQRCode = () => {
    fetch(store.basePath + '/account/qrcode', {
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
            qrLoginData.sign = res.data?.sign
            qrLoginData.imgurl = res.data?.imgurl
            //console.log(res)
        })
}

onMounted(() => {
    if (route.hash.length > 2) {
        try {
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
        } catch (e) {
            console.error(e)
            // Notice(e.toString(), 'error')
        }
    }
    getForumList()
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-5">
                共绑定 {{ tbStatus.accountCount }} 个帐号，当前已列出 {{ tbStatus.forumCount }} 个贴吧。已签到 <span class="text-green-500">{{ tbStatus.success }}</span> 个贴吧，失败 <span class="text-pink-500">{{ tbStatus.failed }}</span> 个，忽略
                <span class="text-gray-600 dark:text-gray-400">{{ tbStatus.ignore }}</span> 个，还有 <span class="text-orange-500">{{ tbStatus.pending }}</span> 个贴吧等待签到
            </div>
            <div class="my-5 grid grid-cols-6 gap-2 max-w-[48em]">
                <Modal class="col-span-3 md:col-span-1" title="绑定账号">
                    <template #default>
                        <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="扫码登录并进行绑定或更新">绑定账号</button>
                    </template>
                    <template #container>
                        <div>
                            <!--<div class="flex justify-center mb-5">
                                <img class="max-w-36 w-full" v-if="qrLoginData.imgurl" :src="'//' + qrLoginData.imgurl" alt="登录二维码" />
                            </div>
                            <button @click="newTiebaAccount" class="w-full px-2 py-1 my-1 rounded-xl border-4 border-sky-500 bg-sky-500 dark:text-gray-100">确认</button>
                            <NuxtLink
                                role="button"
                                class="w-full px-2 py-1 my-1 rounded-xl border-4 border-sky-500 hover:bg-sky-500 text-gray-100 block text-center hover:text-gray-100 transition-colors"
                                v-if="qrLoginData.sign"
                                :href="'https://wappass.baidu.com/wp/?qrlogin=&sign=' + qrLoginData.sign"
                                target="_blank"
                            >
                                网页授权
                            </NuxtLink>
                            <span class="text-sm my-2">* 注：请通过移动设备（手机）打开 “网页授权” 页</span>
                            <hr class="my-3" />-->
                            <button @click="newTiebaAccount" class="w-full px-2 py-1 text-xl rounded-xl bg-sky-500 text-gray-100">自动导入</button>
                            <hr class="my-3" />
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

                <button @click="syncTiebaList" class="col-span-3 md:col-span-1 rounded-2xl border-2 px-4 py-1 border-gray-300 hover:bg-gray-300 hover:text-black transition-colors" title="从贴吧拉取列表，更新数据库">同步列表</button>
                <button @click="cleanTiebaList" class="col-span-3 md:col-span-1 rounded-2xl border-2 px-4 py-1 border-gray-300 hover:bg-gray-300 hover:text-black transition-colors" title="清空贴吧列表">清空列表</button>
                <button @click="checkAccountStatus" class="col-span-3 md:col-span-1 rounded-2xl border-2 px-4 py-1 border-gray-300 hover:bg-gray-300 hover:text-black transition-colors" title="检查帐号状态">检查状态</button>
                <button
                    @click="editMode = !editMode"
                    :class="'col-span-3 md:col-span-1 rounded-2xl border-2 px-4 py-1 border-gray-300 hover:bg-gray-300 hover:text-black transition-colors ' + (editMode ? 'bg-gray-300 text-black' : '')"
                    title="编辑贴吧列表"
                >
                    编辑列表
                </button>
                <Modal class="col-span-3 md:col-span-1" title="手动添加贴吧">
                    <template #default>
                        <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="手动添加贴吧">添加贴吧</button>
                    </template>
                    <template #container>
                        <div class="my-2">
                            <label for="pid-to-add">选择帐号</label>
                            <select id="pid-to-add" v-model="addForumValue.pid" class="bg-gray-200 dark:bg-gray-900 dark:text-gray-100 form-select block w-full my-3 rounded-xl">
                                <option v-for="(name, pid) in pidNameKV" :key="pid" :value="pid">{{ name }}</option>
                            </select>
                        </div>

                        <div class="my-2">
                            <label for="add-fname">贴吧名称</label>
                            <input id="add-fname" class="form-input bg-gray-200 dark:bg-gray-900 w-full rounded-xl" type="text" v-model="addForumValue.fname" placeholder="贴吧名称" />
                        </div>
                        <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 transition-colors" @click="addForum">保存</button>
                    </template>
                </Modal>
            </div>

            <div class="grid grid-cols-12 gap-2 my-2">
                <div v-for="(account, index) in accounts" :key="account.id" class="bg-gray-200 dark:bg-gray-800 col-span-12 rounded-2xl py-2 px-3">
                    <div class="flex justify-between cursor-pointer sticky top-0 bg-gray-200 dark:bg-gray-800" @click="accounts[index].more = !accounts[index].more">
                        <div class="flex gap-3">
                            <div class="relative">
                                <img :alt="`baidu-avatar-` + account.portrait" :src="`https://himg.bdimg.com/sys/portrait/item/${account.portrait}`" class="w-10 h-10 rounded-full my-1 border border-white" />
                                <div :class="`h-2 w-2 absolute right-1 bottom-1 rounded-full border border-white ` + (account.status === undefined ? 'bg-gray-500' : account.status ? 'bg-green-500' : 'bg-pink-500')"></div>
                            </div>
                            <div class="">
                                <NuxtLink
                                    class="max-w-[10em] overflow-hidden text-ellipsis whitespace-nowrap hover:underline underline-offset-2"
                                    :title="account.portrait"
                                    :to="`https://tieba.baidu.com/home/main?id=${account.portrait}`"
                                    target="blank"
                                >
                                    {{ account.name }}</NuxtLink
                                >
                                <div class="text-sm">
                                    <span class="text-green-500">{{ tblistFilter[account.id]?.success || 0 }}</span>
                                    /
                                    <span class="text-orange-500">{{ tblistFilter[account.id]?.pending || 0 }}</span> / <span class="text-pink-500">{{ tblistFilter[account.id]?.failed || 0 }}</span> /
                                    <span class="text-gray-600 dark:text-gray-400">{{ tblistFilter[account.id]?.ignore || 0 }}</span>
                                </div>
                            </div>
                        </div>
                        <div
                            class="flex gap-1"
                            @click="
                                (e) => {
                                    e.stopPropagation()
                                }
                            "
                        >
                            <button v-show="editMode" @click="deleteAccount(account.id)" class="rounded-full w-10 h-10 bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 text-gray-100 dark:text-gray-900 transition-colors p-2 my-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em]" viewBox="0 0 16 16">
                                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div :class="{ 'my-3': true, hidden: !accounts[index].more }">
                        <hr class="border-gray-400 dark:border-gray-600 mb-3" />
                        <div v-for="(tiebaItem, i) in tbList[account.id]" :key="tiebaItem.id">
                            <hr v-if="i > 0" class="border-gray-400 dark:border-gray-600 my-1" />
                            <div class="flex justify-between">
                                <div class="flex flex-col">
                                    <div>
                                        <NuxtLink class="hover:underline underline-offset-2" :to="`https://tieba.baidu.com/f?kw=${tiebaItem.tieba}`" target="blank">{{ tiebaItem.tieba }}</NuxtLink>
                                    </div>
                                    <span class="text-xs text-gray-500 block">
                                        <span v-if="tiebaItem.status === 0 && new Date().getDate() === tiebaItem.latest" class="text-green-500">已签到</span>
                                        <span v-else-if="new Date().getDate() !== tiebaItem.latest" class="text-orange-500">待签到</span>
                                        <span v-else-if="tiebaItem.status !== 0" class="text-pink-500" :title="tiebaItem.status + '#' + tiebaItem.last_error">{{ tiebaItem.status + '#' + tiebaItem.last_error }}</span>
                                        <span v-else-if="tiebaItem.no" class="text-gray-500">已忽略</span>
                                        <span v-else class="text-pink-500">未知错误</span>
                                    </span>
                                </div>
                                <div class="flex gap-2">
                                    <button v-show="editMode" class="transition-colors" @click="deleteForum(tiebaItem.pid, tiebaItem.fid)">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] rounded-full text-pink-500 transition-colors" viewBox="0 0 16 16">
                                            <path
                                                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"
                                            />
                                        </svg>
                                    </button>
                                    <div v-show="!editMode">
                                        <svg
                                            v-if="tiebaItem.status === 0 && new Date().getDate() === tiebaItem.latest"
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
                                                fill="currentColor"
                                                d="M2.5 15a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1zm2-13v1c0 .537.12 1.045.337 1.5h6.326c.216-.455.337-.963.337-1.5V2zm3 6.35c0 .701-.478 1.236-1.011 1.492A3.5 3.5 0 0 0 4.5 13s.866-1.299 3-1.48zm1 0v3.17c2.134.181 3 1.48 3 1.48a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351z"
                                            />
                                        </svg>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-pink-500" viewBox="0 0 16 16">
                                            <path fill="currentColor" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2a1 1 0 0 0 0-2" />
                                        </svg>
                                    </div>
                                    <button v-show="editMode" class="transition-colors" @click="updateIgnoreForum(tiebaItem.pid, tiebaItem.fid)">
                                        <svg v-if="tiebaItem.no" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-gray-500" viewBox="0 0 16 16">
                                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z" />
                                        </svg>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-gray-500" viewBox="0 0 16 16">
                                            <path
                                                d="M8 0q-.264 0-.523.017l.064.998a7 7 0 0 1 .918 0l.064-.998A8 8 0 0 0 8 0M6.44.152q-.52.104-1.012.27l.321.948q.43-.147.884-.237L6.44.153zm4.132.271a8 8 0 0 0-1.011-.27l-.194.98q.453.09.884.237zm1.873.925a8 8 0 0 0-.906-.524l-.443.896q.413.205.793.459zM4.46.824q-.471.233-.905.524l.556.83a7 7 0 0 1 .793-.458zM2.725 1.985q-.394.346-.74.74l.752.66q.303-.345.648-.648zm11.29.74a8 8 0 0 0-.74-.74l-.66.752q.346.303.648.648zm1.161 1.735a8 8 0 0 0-.524-.905l-.83.556q.254.38.458.793l.896-.443zM1.348 3.555q-.292.433-.524.906l.896.443q.205-.413.459-.793zM.423 5.428a8 8 0 0 0-.27 1.011l.98.194q.09-.453.237-.884zM15.848 6.44a8 8 0 0 0-.27-1.012l-.948.321q.147.43.237.884zM.017 7.477a8 8 0 0 0 0 1.046l.998-.064a7 7 0 0 1 0-.918zM16 8a8 8 0 0 0-.017-.523l-.998.064a7 7 0 0 1 0 .918l.998.064A8 8 0 0 0 16 8M.152 9.56q.104.52.27 1.012l.948-.321a7 7 0 0 1-.237-.884l-.98.194zm15.425 1.012q.168-.493.27-1.011l-.98-.194q-.09.453-.237.884zM.824 11.54a8 8 0 0 0 .524.905l.83-.556a7 7 0 0 1-.458-.793zm13.828.905q.292-.434.524-.906l-.896-.443q-.205.413-.459.793zm-12.667.83q.346.394.74.74l.66-.752a7 7 0 0 1-.648-.648zm11.29.74q.394-.346.74-.74l-.752-.66q-.302.346-.648.648zm-1.735 1.161q.471-.233.905-.524l-.556-.83a7 7 0 0 1-.793.458zm-7.985-.524q.434.292.906.524l.443-.896a7 7 0 0 1-.793-.459zm1.873.925q.493.168 1.011.27l.194-.98a7 7 0 0 1-.884-.237zm4.132.271a8 8 0 0 0 1.012-.27l-.321-.948a7 7 0 0 1-.884.237l.194.98zm-2.083.135a8 8 0 0 0 1.046 0l-.064-.998a7 7 0 0 1-.918 0zM4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!--{{ tiebaItem }}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16"><path fill="currentColor" d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5"/></svg>
                    -->
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
                @click="getForumList"
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
