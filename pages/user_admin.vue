<script setup lang="ts">
import Modal from '~/components/Modal.vue'
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const loading = computed(() => store.loading)

const userGroupList = ref<string[]>(['banned', 'user', 'vip', 'admin']) // TODO "deleted",

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
    Request(store.basePath + '/admin/account/modify/' + uid, {
        headers: {
            Authorization: store.authorization
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

const kickDown = (uid = 0) => {
    if (uid < 1) {
        return
    }
    Request(store.basePath + '/admin/account/token/' + uid, {
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
    Request(store.basePath + '/admin/account/list/' + uid, {
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
    Request(store.basePath + '/admin/account/list/' + uid + '/reset', {
        headers: {
            Authorization: store.authorization
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
        Notice('已重置 uid:' + uid + ' 的贴吧签到状态', 'success')
        //console.log(res)
    })
}

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

const resetPasswordCode = (uid = 0) => {
    if (uid < 1) {
        return
    }
    Request(store.basePath + '/admin/account/password/' + uid + '/reset', {
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
    <div class="p-3 mb-5">
        <label for="search-account" class="text-lg">搜索账号</label>
        <div class="flex w-full rounded-xl my-3">
            <input id="search-account" type="text" class="form-input bg-gray-100 dark:bg-gray-900 grow rounded-l-xl" v-model="query" placeholder="用户名、邮箱" />
            <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 px-3 py-1 transition-colors rounded-r-xl" @click="getList">搜索</button>
        </div>
    </div>
    <div class="w-full">
        <select id="page" v-model="page" class="rounded-xl bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select block w-24 my-2 mx-3">
            <option v-for="(_, i) in new Array(Math.ceil(total / count))" :key="'page-' + i" :value="i + 1">{{ i + 1 }} 页</option>
        </select>
        <div v-for="(listItem, index) in list" :key="listItem.id" class="p-3 rounded-xl mb-5">
            <hr v-if="index > 0" class="border-gray-400 dark:border-gray-600 my-3" />
            <div class="text-2xl flex gap-2 mb-2">
                <span class="text-sm rounded-full text-gray-100 bg-green-600 dark:bg-green-800 px-2">uid: {{ listItem.id }}</span>
                <span class="text-sm rounded-full text-gray-100 bg-green-600 dark:bg-green-800 px-2">账号: {{ listItem.baidu_account_count }}</span>
                <span class="text-sm rounded-full text-gray-100 bg-green-600 dark:bg-green-800 px-2">贴吧: {{ listItem.forum_count }}</span>
            </div>
            <div class="text-2xl flex gap-2 mb-2">
                <span class="text-sm rounded-full text-gray-100 bg-green-600 dark:bg-green-800 px-2">成功: {{ listItem.checkin_success }}</span>
                <span class="text-sm rounded-full text-gray-100 bg-pink-600 dark:bg-pink-800 px-2">失败: {{ listItem.checkin_failed }}</span>
                <span class="text-sm rounded-full text-gray-100 bg-orange-600 dark:bg-orange-800 px-2">待签: {{ listItem.checkin_waiting }}</span>
                <span class="text-sm rounded-full text-gray-100 bg-gray-600 dark:bg-gray-800 px-2">忽略: {{ listItem.checkin_ignore }}</span>
            </div>
            <label :for="'username-' + listItem.id">用户名</label>
            <input
                :id="'username-' + listItem.id"
                autocomplete="username"
                type="text"
                class="my-2 rounded-xl placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100"
                v-model="list[index].name"
            />
            <label :for="'user-email-' + listItem.id">邮箱</label>
            <input
                :id="'user-email-' + listItem.id"
                autocomplete="email"
                type="email"
                class="my-2 rounded-xl placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100"
                v-model="list[index].email"
            />
            <label :for="'user-group-' + listItem.id">用户组</label>
            <select :id="'user-group-' + listItem.id" v-model="list[index].role" class="rounded-xl bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select block w-full my-2">
                <option v-for="name in userGroupList" :key="name" :value="name">{{ name }}</option>
            </select>

            <div class="mt-5">
                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 mr-2 mb-1" @click="saveSettings(listItem.id)">保存</button>
                <!--<button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors mr-2" @click="deleteAccount(listItem.id)">删除</button>-->
                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 mr-2 mb-1" @click="kickDown(listItem.id)">下线</button>
                <Modal class="py-1 rounded-lg inline mr-2 mb-1" title="清空账号绑定">
                    <template #default>
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100">清空账号绑定</button>
                    </template>
                    <template #container>
                        <p class="mb-3">注意：确认后将会清空对应账号的所有本站贴吧账号绑定！</p>
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="deleteTiebaAccounts(listItem.id)">确认</button>
                    </template>
                </Modal>
                <Modal class="py-1 rounded-lg inline mr-2 mb-1" title="重置本日签到状态">
                    <template #default>
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100">重置签到状态</button>
                    </template>
                    <template #container>
                        <ul class="mb-3 col-span-2 md:col-span-1 marker:text-sky-500 list-disc list-inside">
                            <li>确认后将会清空对应账号的所有本站贴吧账号绑定今天的签到状态，会导致重签。</li>
                            <li>短时间内频繁签到会导致对应的贴吧账号被封禁，请谨慎使用本功能。</li>
                        </ul>
                        <input type="checkbox" class="form-checkbox bg-gray-100 dark:bg-gray-900 dark:checked:bg-blue-500 my-4" v-model="resetFailedOnly" :id="'upgrade-double-check-:' + listItem.id" /><label
                            class="ml-2"
                            :for="'upgrade-double-check-:' + listItem.id"
                            >仅重置签到失败的贴吧</label
                        >
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="resetCheckinStatus(listItem.id, resetFailedOnly)">确认</button>
                    </template>
                </Modal>
                <Modal
                    class="py-1 rounded-lg inline mr-2 mb-1"
                    title="重置密码验证码"
                    @active-callback="
                        () => {
                            resetPasswordCodeStruct.value = ''
                        }
                    "
                >
                    <template #default>
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100">获取验证码</button>
                    </template>
                    <template #container>
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
                </Modal>
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
        @click="getList"
    >
        <uno-icon :class="{ 'i-bi:arrow-clockwise': true, 'animate-spin': loading }" />
    </div>
</template>

<style scoped></style>
