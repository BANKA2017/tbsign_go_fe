<script setup lang="ts">
import Modal from '~/components/Modal.vue'
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const loading = computed(() => store.loading)
const pluginList = computed(() => store.cache?.plugin_list || {})

const userGroupList = {
    banned: '已封禁',
    user: '用户',
    vip: 'VIP',
    admin: '管理员'
    // 'deleted': '删号（注意！此操作不可逆）'
}

const actionList = {
    kick: '下线',
    delete: '删除平台账号',
    empty_account: '清空账号绑定',
    reset_checkin_status: '重置签到状态',
    reset_plugin_status: '重置插件记录',
    get_code: '获取验证码'
}
const activeAction = ref<string>('kick')
const deleteAccountDoubleCheck = ref<boolean>(false)
const resetPasswordCodeStruct = reactive<{
    verify_code: string
    expire: number
    value: string
    time: number
}>({
    verify_code: '',
    expire: 0,
    value: '',
    time: 0
})
const resetPluginName = ref<string>('')

watch(activeAction, (_, o) => {
    if (o === 'get_code') {
        resetPasswordCodeStruct.value = ''
    } else if (o === 'delete') {
        deleteAccountDoubleCheck.value = false
    } else if (o === 'reset_plugin_status') {
        resetPluginName.value = ''
    }
})

const total = ref<number>(0)
const page = ref<number>(1)
const count = ref<number>(10)

const query = ref<string>('')

const resetFailedOnly = ref<boolean>(false)

const route = useRoute()
const router = useRouter()

watch(page, () => {
    router.replace({ query: { page: page.value } })
    getList()
})

const list = ref<
    {
        email: string
        id: number
        name: string
        role: string
        t: string
        baidu_account_count: number
        forum_count: number

        checkin_success: number
        checkin_failed: number
        checkin_waiting: number
        checkin_ignore: number
    }[]
>([])

const getList = () => {
    Request(
        store.basePath +
            '/admin/account?' +
            new URLSearchParams({
                page: page.value.toString(),
                count: count.value.toString(),
                q: query.value
            }),
        {
            headers: {
                Authorization: store.authorization
            }
        }
    ).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }
        total.value = res.data.total
        list.value = res.data.list
        //console.log(res)
    })
}

const saveSettings = (uid = 0) => {
    if (uid < 1) {
        return
    }
    const accountInfo = list.value.find((account) => account.id === uid)
    if (!accountInfo) {
        Notice('账号 uid:' + uid + ' 不存在', 'error')
        return
    }
    Request(store.basePath + '/admin/account/' + uid + '/modify', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PATCH',
        body: new URLSearchParams({
            name: accountInfo.name,
            email: accountInfo.email,
            role: accountInfo.role
        })
    }).then((res) => {
        if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }
        Notice('已修改 uid:' + uid + ' 的信息', 'success')
        //console.log(res)
    })
}

const deleteAccount = (uid = 0) => {
    if (uid < 1) {
        return
    }

    //account
    const accountInfo = list.value.find((account) => account.id === uid)
    if (!accountInfo) {
        Notice('账号 uid:' + uid + ' 不存在', 'error')
        return
    }
    Request(store.basePath + '/admin/account/' + uid, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }
        Notice('已删除 uid:' + uid + ' 的全部数据', 'success')
        list.value = list.value.filter((account) => account.id !== uid)
        //console.log(res)
    })
}

const kickDown = (uid = 0) => {
    if (uid < 1) {
        return
    }
    Request(store.basePath + '/admin/account/' + uid + '/token', {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }
        Notice('已下线 uid:' + uid, 'success')
        //console.log(res)
    })
}

const deleteTiebaAccounts = (uid = 0) => {
    if (uid < 1) {
        return
    }
    Request(store.basePath + '/admin/account/' + uid + '/list', {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }
        Notice('已清空 uid:' + uid + ' 绑定的百度账号', 'success')
        //console.log(res)
    })
}

const resetCheckinStatus = (uid = 0, failed_only = false) => {
    if (uid < 1) {
        return
    }
    Request(store.basePath + '/admin/account/' + uid + '/list/reset', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams({
            failed_only: Number(failed_only).toString()
        })
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }

        const accountIndex = list.value.map((x) => x.id).indexOf(uid)
        if (failed_only) {
            list.value[accountIndex].checkin_waiting += list.value[accountIndex].checkin_failed
            list.value[accountIndex].checkin_failed = 0
        } else {
            list.value[accountIndex].checkin_waiting += list.value[accountIndex].checkin_success + list.value[accountIndex].checkin_failed
            list.value[accountIndex].checkin_success = 0
            list.value[accountIndex].checkin_failed = 0
        }
        Notice('已重置 uid:' + uid + ' 本日的贴吧签到状态', 'success')
        //console.log(res)
    })
}

const resetPluginStatus = (uid = 0, plugin_name = '') => {
    if (uid < 1 || !pluginList.value[plugin_name]) {
        return
    }
    Request(store.basePath + '/admin/account/' + uid + '/plugin/' + plugin_name + '/reset', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }

        Notice('已重置 uid:' + uid + ' 本日的插件状态', 'success')
        //console.log(res)
    })
}

const resetPasswordCode = (uid = 0) => {
    if (uid < 1) {
        return
    }
    Request(store.basePath + '/admin/account/' + uid + '/password/reset', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }

        if (res.data?.value) {
            resetPasswordCodeStruct.value = res.data.value
            resetPasswordCodeStruct.verify_code = res.data.verify_code
            resetPasswordCodeStruct.expire = res.data.expire
            resetPasswordCodeStruct.time = res.data.time
        }

        Notice('获取 uid:' + uid + ' 的密码重置验证码成功', 'success')
        //console.log(res)
    })
}

onMounted(() => {
    page.value = Number(route.query?.page || 1) || 1
    getList()
})
</script>

<template>
    <div class="p-3">
        <label for="search-account" class="text-lg">搜索账号</label>
        <div class="flex w-full rounded-xl my-3">
            <input id="search-account" type="text" class="form-input bg-gray-100 dark:bg-gray-900 grow rounded-l-xl" v-model="query" placeholder="用户名、邮箱" />
            <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 px-3 py-1 transition-colors rounded-r-xl" @click="getList">搜索</button>
        </div>
    </div>
    <div class="w-full">
        <select id="page" v-model="page" class="rounded-xl bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select block w-36 my-2 mx-3">
            <option v-for="(_, i) in new Array(Math.ceil(total / count))" :key="'page-' + i" :value="i + 1">{{ i + 1 }} 页</option>
        </select>
        <div class="grid grid-cols-2 mx-3 gap-2">
            <div v-for="(listItem, index) in list" :key="listItem.id" class="bg-gray-200 dark:bg-gray-700 rounded-xl p-3 col-span-2 lg:col-span-1">
                <div class="flex flex-col mb-2">
                    <div class="ml-2 inline-block grow truncate font-bold">
                        <span v-if="listItem.role === 'vip'" class="px-2 rounded bg-yellow-400 dark:bg-yellow-600 text-gray-900 text-sm">VIP</span>
                        <span v-else-if="listItem.role === 'banned'" class="px-2 rounded bg-pink-400 dark:bg-pink-600 text-gray-100 text-sm line-through">BAN</span>
                        <span v-else-if="listItem.role === 'admin'" class="px-2 rounded bg-sky-400 dark:bg-sky-600 text-gray-100 text-sm">MOD</span>

                        {{ listItem.name || '未设置用户名' }}
                    </div>
                    <div class="ml-2 inline-block grow truncate italic">{{ listItem.email || '未设置邮箱' }}</div>
                </div>
                <div class="grid grid-cols-2">
                    <div class="col-span-1 text-2xl mb-2">
                        <div class="dark:text-gray-100 border-l-4 border-l-green-600 dark:border-l-green-800 px-3 py-0.5 mx-1 uppercase font-bold text-sm mb-1">成功: {{ listItem.checkin_success }}</div>
                        <div class="dark:text-gray-100 border-l-4 border-l-pink-600 dark:border-l-pink-800 px-3 py-0.5 mx-1 uppercase font-bold text-sm mb-1">失败: {{ listItem.checkin_failed }}</div>
                        <div class="dark:text-gray-100 border-l-4 border-l-orange-600 dark:border-l-orange-800 px-3 py-0.5 mx-1 uppercase font-bold text-sm mb-1">待签: {{ listItem.checkin_waiting }}</div>
                        <div class="dark:text-gray-100 border-l-4 border-l-gray-600 dark:border-l-gray-800 px-3 py-0.5 mx-1 uppercase font-bold text-sm">忽略: {{ listItem.checkin_ignore }}</div>
                    </div>

                    <div class="col-span-1 gap-1 mb-2">
                        <div class="dark:text-gray-100 border-l-4 border-l-green-600 dark:border-l-green-800 px-3 py-0.5 mx-1 uppercase font-bold text-sm mb-1">账号: {{ listItem.baidu_account_count }}</div>
                        <div class="dark:text-gray-100 border-l-4 border-l-green-600 dark:border-l-green-800 px-3 py-0.5 mx-1 uppercase font-bold text-sm">贴吧: {{ listItem.forum_count }}</div>
                    </div>
                </div>
                <div class="">
                    <Modal class="py-1 rounded-lg inline mr-2 mb-1" :title="'编辑 @' + listItem.name">
                        <template #default>
                            <button class="underline underline-offset-2 hover:decoration-sky-500 transition-all">编辑</button>
                        </template>
                        <template #container>
                            <label :for="'username-' + listItem.id">用户名</label>
                            <input
                                :id="'username-' + listItem.id"
                                autocomplete="username"
                                type="text"
                                class="my-2 rounded-xl placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-800 dark:text-gray-100"
                                v-model="list[index].name"
                            />
                            <label :for="'user-email-' + listItem.id">邮箱</label>
                            <input
                                :id="'user-email-' + listItem.id"
                                autocomplete="email"
                                type="email"
                                class="my-2 rounded-xl placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-800 dark:text-gray-100"
                                v-model="list[index].email"
                            />
                            <label :for="'user-group-' + listItem.id">用户组</label>
                            <select :id="'user-group-' + listItem.id" v-model="list[index].role" class="rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-gray-100 form-select block w-full my-2">
                                <option v-for="(nameCn, name) in userGroupList" :key="name" :value="name">{{ nameCn }}-{{ name }}</option>
                            </select>
                            <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 mr-2 mb-1" @click="saveSettings(listItem.id)">保存</button>
                        </template>
                    </Modal>

                    <Modal
                        class="py-1 rounded-lg inline mb-1"
                        :title="'操作 @' + listItem.name"
                        @active-callback="
                            () => {
                                activeAction = 'kick'
                                resetPasswordCodeStruct.value = ''
                                deleteAccountDoubleCheck = false
                                resetPluginName = ''
                            }
                        "
                    >
                        <template #default>
                            <button class="underline underline-offset-2 hover:decoration-pink-500 transition-all">操作</button>
                        </template>
                        <template #container>
                            <select id="user-admin-action" v-model="activeAction" class="rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-gray-100 form-select block w-full my-2">
                                <option v-for="(actionName, actionID) in actionList" :key="actionID" :value="actionID">{{ actionName }}</option>
                            </select>
                            <template v-if="activeAction === 'delete'">
                                <p class="mb-3">注意！确认后将会彻底删除对应账号所有数据！此操作不可逆！</p>
                                <div class="mb-2">
                                    <input type="checkbox" class="form-checkbox bg-gray-100 dark:bg-gray-800 dark:checked:bg-blue-500 my-4" v-model="deleteAccountDoubleCheck" :id="'upgrade-double-check-:' + listItem.id" /><label
                                        class="ml-2 break-all"
                                        :for="'upgrade-double-check-:' + listItem.id"
                                        >确认删除平台账号 <span class="break-all font-bold mr-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all text-sm">@{{ listItem.name }}</span></label
                                    >
                                </div>
                                <button
                                    :disabled="!deleteAccountDoubleCheck"
                                    class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg disabled:bg-gray-400 disabled:dark:bg-gray-600"
                                    @click="deleteAccount(listItem.id)"
                                >
                                    确认删除
                                </button>
                            </template>
                            <button v-else-if="activeAction === 'kick'" class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="kickDown(listItem.id)">下线</button>
                            <template v-else-if="activeAction === 'empty_account'">
                                <p class="mb-3">注意：确认后将会清空对应账号的所有本站贴吧账号绑定！</p>
                                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="deleteTiebaAccounts(listItem.id)">确认</button>
                            </template>

                            <template v-else-if="activeAction === 'reset_checkin_status'">
                                <ul class="mb-3 col-span-2 md:col-span-1 marker:text-sky-500 list-disc list-inside">
                                    <li>确认后将会清空对应本站账号的所有贴吧账号本日的签到状态，会导致重签。</li>
                                    <li>短时间内频繁签到会导致对应的贴吧账号被封禁，请谨慎使用本功能。</li>
                                </ul>
                                <input type="checkbox" class="form-checkbox bg-gray-100 dark:bg-gray-800 dark:checked:bg-blue-500 my-4" v-model="resetFailedOnly" :id="'upgrade-double-check-:' + listItem.id" /><label
                                    class="ml-2"
                                    :for="'upgrade-double-check-:' + listItem.id"
                                    >仅重置签到失败的贴吧</label
                                >
                                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="resetCheckinStatus(listItem.id, resetFailedOnly)">确认</button>
                            </template>

                            <template v-else-if="activeAction === 'reset_plugin_status'">
                                <ul class="mb-3 col-span-2 md:col-span-1 marker:text-sky-500 list-disc list-inside">
                                    <li>确认后将会清空该账号对应插件本日的签到状态，稍后将会自动重签。</li>
                                    <li>短时间内频繁提交可能会导致对应的账号被封禁，请谨慎使用本功能。</li>
                                    <li>部分插件无需重置状态，会一直返回成功</li>
                                </ul>

                                <label for="user-reset-plugin" class="font-bold">选择插件</label>
                                <select id="user-reset-plugin" v-model="resetPluginName" class="rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-gray-100 form-select block w-full mt-2 mb-3">
                                    <option v-for="(pluginInfo, pluginName) in pluginList" :key="pluginName" :value="pluginName">{{ pluginInfo.plugin_name_cn }}</option>
                                </select>

                                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="resetPluginStatus(listItem.id, resetPluginName)">确认</button>
                            </template>

                            <template v-else-if="activeAction === 'get_code'">
                                <ul class="mb-3 col-span-2 md:col-span-1 marker:text-pink-500 list-disc list-inside">
                                    <li>请管理员协助用户获取验证码前先确认申请者身份</li>
                                </ul>
                                <div v-if="resetPasswordCodeStruct.value">
                                    <ul class="mb-3 col-span-2 md:col-span-1 marker:text-sky-500 list-disc list-inside">
                                        <li>
                                            验证码：<span class="break-word whitespace-pre-wrap font-mono mx-2 text-gray-100 bg-gray-800 px-2 rounded-lg select-all">{{ resetPasswordCodeStruct.value }}</span>
                                        </li>
                                        <li>
                                            有效期至：<span class="break-word whitespace-pre-wrap font-mono mx-2 text-gray-100 bg-gray-800 px-2 rounded-lg select-all">{{ getPubDate(new Date(resetPasswordCodeStruct.expire * 1000)) }}</span>
                                        </li>
                                        <li>
                                            重置次数：<span class="break-word whitespace-pre-wrap font-mono mx-2 text-gray-100 bg-gray-800 px-2 rounded-lg select-all">{{ resetPasswordCodeStruct.time }}</span>
                                        </li>
                                    </ul>
                                </div>
                                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="resetPasswordCode(listItem.id)">确认</button>
                            </template>
                        </template>
                    </Modal>
                </div>
            </div>
        </div>
    </div>
    <SyncModule :loading="loading" :callback="getList" />
</template>

<style scoped></style>
