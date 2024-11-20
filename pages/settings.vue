<script setup lang="ts">
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()

const accountInfo = computed(() => store.cache?.accountInfo)

watch(accountInfo, () => {
    settingsValue.value.email = accountInfo.value?.email || ''
    settingsValue.value.username = accountInfo.value?.name || ''

    settingsValue.value.bark_key = accountInfo.value?.bark_key || ''
    settingsValue.value.ntfy_topic = accountInfo.value?.ntfy_topic || ''
    settingsValue.value.push_type = accountInfo.value?.push_type || ''
})

const settingsValue = ref<{
    username: string
    email: string
    password: string
    new_password: string
    ntfy_topic: string
    bark_key: string
    push_type: string
}>({
    username: '',
    email: '',
    password: '',
    new_password: '',

    ntfy_topic: '',
    bark_key: '',
    push_type: ''
})

const saveSettings = (e: Event) => {
    e.preventDefault()
    if (settingsValue.value.username || settingsValue.value.email) {
        // change email
        Request(store.basePath + '/passport/update/info', {
            headers: {
                Authorization: store.authorization,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'PUT',
            body: new URLSearchParams({
                username: settingsValue.value.username,
                email: settingsValue.value.email,
                ntfy_topic: settingsValue.value.ntfy_topic,
                bark_key: settingsValue.value.bark_key,
                push_type: settingsValue.value.push_type,
                password: settingsValue.value.password
            }).toString()
        }).then((res) => {
            if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
                Notice(res.message, 'error')
                return
            }
            Notice('信息修改成功', 'success')
            const newAccountInfo = JSON.parse(JSON.stringify(accountInfo.value))
            newAccountInfo.email = res.data.email
            newAccountInfo.name = res.data.name
            newAccountInfo.avatar = res.data.avatar

            newAccountInfo.ntfy_topic = res.data.ntfy_topic
            newAccountInfo.bark_key = res.data.bark_key
            newAccountInfo.push_type = res.data.push_type
            store.updateCache('accountInfo', newAccountInfo)
            //console.log(res)
        })
    }
    if (settingsValue.value.password.length > 0 && settingsValue.value.new_password.length > 0 && settingsValue.value.password !== settingsValue.value.new_password) {
        // change pwd
        Request(store.basePath + '/passport/update/password', {
            headers: {
                Authorization: store.authorization,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'PUT',
            body: new URLSearchParams({ old_password: settingsValue.value.password, new_password: settingsValue.value.new_password }).toString()
        }).then((res) => {
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

    settingsValue.value.bark_key = accountInfo.value?.bark_key || ''
    settingsValue.value.ntfy_topic = accountInfo.value?.ntfy_topic || ''
    settingsValue.value.push_type = accountInfo.value?.push_type || ''
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <div class="px-3 py-2">
            <span class="text-lg">设置</span>
        </div>
        <form class="p-3 flex flex-col gap-2" v-if="accountInfo">
            <label class="block my-1" for="username">用户名</label>
            <input
                id="username"
                autocomplete="username"
                type="text"
                class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                v-model="settingsValue.username"
            />
            <label class="block my-1" for="email">邮箱</label>
            <input
                id="email"
                autocomplete="email"
                type="email"
                class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                v-model="settingsValue.email"
            />
            <!--<abbr class="block my-1" title="忘记了原密码？试试退出后使用找回密码">密码</abbr>-->
            <label class="block my-1">密码</label>
            <input
                type="password"
                placeholder="当前密码"
                autocomplete="current-password"
                class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                v-model="settingsValue.password"
            />
            <input
                type="password"
                placeholder="新密码（留空不修改）"
                autocomplete="new-password"
                class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                v-model="settingsValue.new_password"
            />

            <hr class="border-gray-400 dark:border-gray-600 px-3 my-3" />

            <label class="my-1 flex justify-between" for="bark-key">
                Bark key
                <Modal class="col-span-3 md:col-span-1" title="关于Bark" aria-label="关于Bark">
                    <template #default>
                        <span
                            role="button"
                            @click="
                                (e) => {
                                    e.preventDefault()
                                }
                            "
                            class="underline underline-offset-2 text-sm"
                            title="关于Bark"
                            aria-label="关于Bark"
                        >
                            关于Bark
                        </span>
                    </template>
                    <template #container>
                        <ul role="list" class="mb-3 marker:text-sky-500 list-disc list-inside">
                            <li>Bark 仅支持 <a href="https://apps.apple.com/us/app/bark-customed-notifications/id1403753865" target="_blank" class="underline underline-offset-2">iOS/iPadOS 操作系统</a></li>
                            <li>
                                本站使用的端点为 <span class="break-all font-mono mx-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">{{ accountInfo?.system_settings?.bark_addr }}</span
                                >{{ accountInfo?.system_settings?.bark_addr === 'https://api.day.app' ? '(官服)' : '' }}
                            </li>
                        </ul>
                    </template>
                </Modal>
            </label>
            <input id="bark-key" type="text" class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl" v-model="settingsValue.bark_key" />
            <label class="my-1 flex justify-between" for="ntfy-topic">
                Ntfy topic
                <Modal class="col-span-3 md:col-span-1" title="关于Ntfy" aria-label="关于Ntfy">
                    <template #default>
                        <span
                            role="button"
                            @click="
                                (e) => {
                                    e.preventDefault()
                                }
                            "
                            class="underline underline-offset-2 text-sm"
                            title="关于Ntfy"
                            aria-label="关于Ntfy"
                        >
                            关于Ntfy
                        </span>
                    </template>
                    <template #container>
                        <ul role="list" class="mb-3 marker:text-sky-500 list-disc list-inside">
                            <li><a href="https://ntfy.sh" target="_blank" class="underline underline-offset-2">Ntfy.sh</a> 支持 Android/iOS/iPadOS/网页推送</li>
                            <li>
                                任何人都可以访问<span class="break-all font-mono mx-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">{{
                                    accountInfo?.system_settings?.ntfy_addr + '/' + (settingsValue.ntfy_topic ? settingsValue.ntfy_topic : '${ntfy_topic}')
                                }}</span
                                >取得历史推送，所以建议将此值设置得尽可能地长
                            </li>
                            <li>
                                本站使用的端点为 <span class="break-all font-mono mx-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">{{ accountInfo?.system_settings?.ntfy_addr }}</span
                                >{{ accountInfo?.system_settings?.ntfy_addr === 'https://ntfy.sh' ? '(官服)' : '' }}
                            </li>
                        </ul>
                    </template>
                </Modal>
            </label>
            <input id="ntfy-topic" type="text" class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl" v-model="settingsValue.ntfy_topic" />
            <label class="block my-1" for="push-type">首选推送渠道</label>
            <select id="push-type" class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl" v-model="settingsValue.push_type">
                <option value="email">邮箱</option>
                <option value="ntfy">Ntfy</option>
                <option value="bark">Bark</option>
            </select>

            <input v-if="settingsValue.password !== ''" type="submit" role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl transition-colors" @click="saveSettings" value="保存" />
            <button v-else role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-gray-400 dark:bg-gray-500 text-xl transition-colors" disabled>填写当前密码后保存</button>
        </form>
    </NuxtLayout>
</template>
