<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { Notice } from '~/share/Tools'

const store = useMainStore()

const accountInfo = computed(() => store._cache?.accountInfo)

watch(accountInfo, () => {
    settingsValue.value.email = accountInfo.value?.email || ''
    settingsValue.value.username = accountInfo.value?.name || ''
})

const settingsValue = ref<{
    username: string
    email: string
    password: string
    new_password: string
}>({
    username: '',
    email: '',
    password: '',
    new_password: ''
})

const saveSettings = (e: Event) => {
    e.preventDefault()
    if (settingsValue.value.username || settingsValue.value.email) {
        // change email
        fetch(store.basePath + '/passport/update/info', {
            headers: {
                Authorization: store.authorization,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'PUT',
            body: new URLSearchParams({ username: settingsValue.value.username, email: settingsValue.value.email }).toString()
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
                Notice('信息修改成功', 'success')
                const newAccountInfo = JSON.parse(JSON.stringify(accountInfo.value))
                newAccountInfo.email = res.data.email
                newAccountInfo.name = res.data.username
                store.updateCache('accountInfo', newAccountInfo)
                //console.log(res)
            })
    }
    if (settingsValue.value.password.length > 0 && settingsValue.value.new_password.length > 0 && settingsValue.value.password !== settingsValue.value.new_password) {
        // change pwd
        fetch(store.basePath + '/passport/update/password', {
            headers: {
                Authorization: store.authorization,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'PUT',
            body: new URLSearchParams({ old_password: settingsValue.value.password, new_password: settingsValue.value.new_password }).toString()
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
                Notice('密码修改成功', 'success')
                store.updateAuthorization(res.data.token)
                //console.log(res)
            })
    } else if (settingsValue.value.password === settingsValue.value.new_password) {
        //console.log('same password!')
    }
}

onMounted(() => {
    settingsValue.value.email = accountInfo.value?.email || ''
    settingsValue.value.username = accountInfo.value?.name || ''
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="px-3 py-2">
                <span class="text-lg">设置</span>
            </div>
            <form class="p-3 flex flex-col gap-2" v-if="accountInfo">
                <label class="block my-1">用户名</label>
                <input autocomplete="username" type="text" class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100" v-model="settingsValue.username" />
                <label class="block my-1">邮箱</label>
                <input autocomplete="email" type="email" class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100" v-model="settingsValue.email" />
                <!--<abbr class="block my-1" title="忘记了原密码？试试退出后使用找回密码">密码</abbr>-->
                <label class="block my-1">密码</label>
                <input
                    type="password"
                    placeholder="当前密码"
                    autocomplete="current-password"
                    class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                    v-model="settingsValue.password"
                />
                <input
                    type="password"
                    placeholder="新密码"
                    autocomplete="new-password"
                    class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-black dark:text-gray-100"
                    v-model="settingsValue.new_password"
                />
                <input type="submit" role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl transition-colors" @click="saveSettings" value="保存" />
            </form>
        </frame-work>
    </NuxtLayout>
</template>
