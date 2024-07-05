<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { Notice } from '~/share/Tools'

const store = useMainStore()

const userGroupList = ref<string[]>(['banned', 'user', 'vip', 'admin']) // TODO "deleted",

const total = ref<number>(0)
const page = ref<number>(1)
const count = ref<number>(10)

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
    }[]
>([])

const getList = () => {
    fetch(
        store.basePath +
            '/admin/account?' +
            new URLSearchParams({
                page: page.value.toString(),
                count: count.value.toString()
            }),
        {
            headers: {
                Authorization: store.authorization
            }
        }
    )
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
        Notice('帐号 uid:' + uid + ' 不存在', 'error')
        return
    }
    fetch(store.basePath + '/admin/account/modify/' + uid, {
        headers: {
            Authorization: store.authorization
        },
        method: 'PATCH',
        body: new URLSearchParams({
            name: accountInfo.name,
            email: accountInfo.email,
            role: accountInfo.role
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
    fetch(store.basePath + '/admin/account/token/' + uid, {
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
    fetch(store.basePath + '/admin/account/list/' + uid, {
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
                //console.log(res)
                return
            }
            Notice('已清空 uid:' + uid + ' 绑定的百度账号', 'success')
            //console.log(res)
        })
}

onMounted(() => {
    page.value = Number(route.query?.page || 1) || 1
    getList()
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-10">暂时没有防呆设计，注意别手抖删错号</div>
            <div class="w-full">
                <select id="page" v-model="page" class="rounded-xl bg-gray-100 dark:bg-black dark:text-gray-100 form-select block w-full my-2">
                    <option v-for="(_, i) in new Array(Math.ceil(total / count))" :key="'page-' + i" :value="i + 1">{{ i + 1 }} 页</option>
                </select>
                <div v-for="(listItem, index) in list" :key="listItem.id" class="p-3 rounded-xl mb-5">
                    <hr v-if="index > 0" class="border-gray-400 dark:border-gray-600 my-3" />
                    <div class="text-2xl">
                        <span class="text-sm rounded-full text-gray-100 bg-green-600 dark:bg-green-800 px-2 mr-1">uid: {{ listItem.id }}</span>
                    </div>
                    <label :for="'username-' + listItem.id">用户名</label>
                    <input
                        :id="'username-' + listItem.id"
                        autocomplete="username"
                        type="text"
                        class="my-2 rounded-xl placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                        v-model="list[index].name"
                    />
                    <label :for="'user-email-' + listItem.id">邮箱</label>
                    <input
                        :id="'user-email-' + listItem.id"
                        autocomplete="email"
                        type="email"
                        class="my-2 rounded-xl placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                        v-model="list[index].email"
                    />
                    <label :for="'user-group-' + listItem.id">用户组</label>
                    <select :id="'user-group-' + listItem.id" v-model="list[index].role" class="rounded-xl bg-gray-100 dark:bg-black dark:text-gray-100 form-select block w-full my-2">
                        <option v-for="name in userGroupList" :key="name" :value="name">{{ name }}</option>
                    </select>

                    <div class="flex justify-start gap-2 mt-5">
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100" @click="saveSettings(listItem.id)">保存</button>
                        <!--<button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors" @click="deleteAccount(listItem.id)">删除</button>-->
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100" @click="kickDown(listItem.id)">下线</button>
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100" @click="deleteTiebaAccounts(listItem.id)">清空帐号绑定</button>
                    </div>
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
