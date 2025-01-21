<template>
    <div class="rounded-2xl mb-2" v-if="accountInfo">
        <div class="mx-3 my-2">
            <div class="border-4 border-sky-500 rounded-xl p-2">
                <h4 class="text-lg font-bold">公告</h4>
                <hr class="border-gray-400 dark:border-gray-600 my-2" />
                <div v-if="notifications">
                    <p v-for="(text, line) in notifications.split('\n')" :key="line">{{ text }}</p>
                </div>
                <svg class="animate-spin h-5 w-5 dark:text-gray-100 text-sky-500" v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        </div>
        <div class="p-3 flex flex-col justify-between gap-2">
            <div class="flex flex-col">
                <div class="flex flex-col 3xs:flex-row justify-start gap-2">
                    <div class="flex flex-col">
                        <span class="text-2xl max-w-[250px] overflow-hidden truncate">{{ accountInfo.name }}</span>
                        <span class="text-sm max-w-[250px] overflow-hidden truncate">{{ accountInfo.email }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <div class="dark:text-gray-100 border-l-4 border-l-sky-500 dark:border-l-sky-800 px-3 py-0.5 mx-1 uppercase font-bold text-sm">{{ accountInfo.role }}</div>
                        <div class="text-sm border-l-4 dark:text-gray-100 border-l-green-600 dark:border-l-green-800 px-3 py-0.5 mx-1 uppercase font-bold">uid: {{ accountInfo.uid }}</div>
                    </div>
                </div>
            </div>
            <div v-if="tbaccounts.length > 0" class="mt-3 ml-5">
                <img
                    v-for="tbaccount in tbaccounts"
                    :key="tbaccount.portrait"
                    :src="'https://himg.bdimg.com/sys/portrait/item/' + tbaccount.portrait"
                    :alt="'avatar-' + tbaccount.name + '-' + tbaccount.portrait"
                    :title="tbaccount.name + '的头像'"
                    class="w-14 h-14 transition-all -ml-5 hover:mr-7 rounded-2xl my-1 inline-block ring-2 ring-gray-400 dark:ring-gray-600 bg-gray-300 dark:bg-gray-700"
                    loading="lazy"
                />
            </div>
        </div>
        <hr class="border-gray-400 dark:border-gray-600 px-3" />
        <div class="inline-block md:block">
            <Modal class="inline-block" title="个人设置">
                <template #default>
                    <button class="inline-block my-5 px-5 mx-1 rounded-full transition-colors hover:bg-sky-600 dark:hover:bg-sky-400 bg-sky-500 text-gray-100 py-2">个人设置</button>
                </template>
                <template #container>
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

                        <label class="my-1 flex justify-between" for="bark-key"> Bark key </label>
                        <details role="button">
                            <summary class="text-sm">关于Bark</summary>
                            <ul role="list" class="mb-3 marker:text-sky-500 list-disc list-inside">
                                <li>Bark 仅支持 <a href="https://apps.apple.com/us/app/bark-customed-notifications/id1403753865" target="_blank" class="underline underline-offset-2">iOS/iPadOS 操作系统</a></li>
                                <li>
                                    本站使用的端点为 <span class="break-all font-mono mx-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">{{ accountInfo?.system_settings?.bark_addr }}</span
                                    >{{ accountInfo?.system_settings?.bark_addr === 'https://api.day.app' ? '(官服)' : '' }}
                                </li>
                            </ul>
                        </details>
                        <input
                            id="bark-key"
                            type="text"
                            class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.bark_key"
                        />
                        <label class="my-1 flex justify-between" for="ntfy-topic"> Ntfy topic </label>
                        <details role="button">
                            <summary class="text-sm">关于Ntfy</summary>
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
                        </details>
                        <input
                            id="ntfy-topic"
                            type="text"
                            class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.ntfy_topic"
                        />
                        <label class="block my-1" for="push-type">首选推送渠道</label>
                        <select
                            id="push-type"
                            class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.push_type"
                        >
                            <option value="email">邮箱</option>
                            <option value="ntfy">Ntfy</option>
                            <option value="bark">Bark</option>
                        </select>

                        <input
                            v-if="settingsValue.password !== ''"
                            type="submit"
                            role="button"
                            class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl transition-colors"
                            @click="saveSettings"
                            value="保存"
                        />
                        <button v-else role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-gray-400 dark:bg-gray-500 text-xl transition-colors" disabled>填写当前密码后保存</button>
                    </form>
                </template>
            </Modal>
            <Modal
                v-if="accountInfo?.system_settings?.allow_export_personal_data === '1' || accountInfo?.system_settings?.allow_import_personal_data === '1'"
                class="inline-block"
                title="备份"
                @active-callback="
                    () => {
                        settingsValue.password = ''
                        backupFileData = {}
                    }
                "
            >
                <template #default>
                    <button class="inline-block my-5 px-5 mx-1 rounded-full transition-colors hover:bg-sky-600 dark:hover:bg-sky-400 bg-sky-500 text-gray-100 py-2">备份</button>
                </template>
                <template #container>
                    <div v-if="accountInfo">
                        <div class="my-1">
                            <button v-if="accountInfo?.system_settings?.allow_export_personal_data === '1'" :class="'mr-1 rounded px-2 ' + (backupStatus === 'export' ? 'bg-sky-500 text-gray-200' : '')" @click="backupStatus = 'export'">导出</button>
                            <button v-if="accountInfo?.system_settings?.allow_import_personal_data === '1'" :class="'mr-1 rounded px-2 ' + (backupStatus === 'import' ? 'bg-sky-500 text-gray-200' : '')" @click="backupStatus = 'import'">导入</button>
                        </div>
                        <form v-if="backupStatus === 'export'" class="flex flex-col gap-2">
                            <label class="block">密码</label>
                            <input
                                type="password"
                                placeholder="当前密码"
                                autocomplete="current-password"
                                class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                v-model="settingsValue.password"
                            />
                            <input
                                v-if="settingsValue.password !== ''"
                                type="submit"
                                role="button"
                                class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl transition-colors"
                                @click="
                                    (e) => {
                                        e.preventDefault()
                                        exportAccount(settingsValue.password)
                                    }
                                "
                                value="确认导出"
                            />
                            <button v-else role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-gray-400 dark:bg-gray-500 text-xl transition-colors" disabled>填写当前密码后导出</button>
                        </form>

                        <form v-else-if="backupStatus === 'import'" class="flex flex-col gap-2" v-if="accountInfo">
                            <ul role="list" class="my-1 marker:text-pink-500 list-disc list-inside">
                                <li>批量导入数据时不会检查百度账号有效性，请自行提前检查</li>
                                <li>目前只支持导入百度账号和贴吧列表</li>
                                <li>如果百度账号已经存在，程序只会以<span class="font-bold">仅新增</span>的模式合并贴吧列表</li>
                                <li>导入的顺序可能会改变</li>
                            </ul>
                            <label class="block">密码</label>
                            <input
                                type="password"
                                placeholder="当前密码"
                                autocomplete="current-password"
                                class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                v-model="settingsValue.password"
                            />
                            <label class="block">备份文件</label>
                            <input
                                type="file"
                                class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-300 file:text-gray-700 hover:file:bg-gray-400 dark:file:bg-gray-600 dark:file:text-gray-100 dark:hover:file:bg-gray-500"
                                id="upload-backup-data"
                                lang="zh"
                                @change="
                                    async (e) => {
                                        e.preventDefault()
                                        loadingBackupData()
                                    }
                                "
                                accept="application/json"
                            />
                            <div v-if="Object.keys(backupFileData).length > 0">
                                <label>已读取备份</label>
                                <ul role="list" class="my-1 marker:text-sky-500 list-disc list-inside">
                                    <li v-for="(backupData, backupTableName) in backupFileData" :key="backupTableName">
                                        <span class="font-bold">{{ backupTableName }}: </span><span class="font-mono">{{ (backupData || []).length }}</span>
                                    </li>
                                </ul>
                            </div>

                            <input
                                v-if="settingsValue.password !== ''"
                                type="submit"
                                role="button"
                                class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl transition-colors"
                                @click="
                                    (e) => {
                                        e.preventDefault()
                                        importAccount(settingsValue.password)
                                    }
                                "
                                value="确认导入"
                            />
                            <button v-else-if="Object.keys(backupFileData).length > 0" role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-gray-400 dark:bg-gray-500 text-xl transition-colors" disabled>填写当前密码后导入</button>
                            <button v-else role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-gray-400 dark:bg-gray-500 text-xl transition-colors" disabled>备份数据无效</button>
                        </form>
                        <div v-else>本网站不支持备份</div>
                    </div>
                </template>
            </Modal>
            <NuxtLink role="button" class="inline-block my-5 px-5 mx-1 rounded-full transition-colors hover:bg-pink-600 dark:hover:bg-pink-400 bg-pink-500 text-gray-100 py-2" to="/signin" @click="logout"> 登出 </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Notice, Request, DownloadFile, ReadFileData } from '~/share/Tools'

const store = useMainStore()

const accountInfo = computed(() => store.cache?.accountInfo)
const tbaccounts = computed(() => store.cache?.accounts || [])
const notifications = ref<string>('')

watch(accountInfo, () => {
    settingsValue.email = accountInfo.value?.email || ''
    settingsValue.username = accountInfo.value?.name || ''

    settingsValue.bark_key = accountInfo.value?.bark_key || ''
    settingsValue.ntfy_topic = accountInfo.value?.ntfy_topic || ''
    settingsValue.push_type = accountInfo.value?.push_type || ''
})

const settingsValue = reactive<{
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

onMounted(async () => {
    // get account info
    if (store.rawAuthorization !== '') {
        Request(store.basePath + '/notifications', {
            headers: {
                Authorization: store.authorization
            }
        }).then((res) => {
            if (res.code !== 200) {
                return
            }
            notifications.value = res.data || '没有公告'
            //console.log(res)
        })

        settingsValue.email = accountInfo.value?.email || ''
        settingsValue.username = accountInfo.value?.name || ''
        settingsValue.bark_key = accountInfo.value?.bark_key || ''
        settingsValue.ntfy_topic = accountInfo.value?.ntfy_topic || ''
        settingsValue.push_type = accountInfo.value?.push_type || ''

        if (accountInfo.value?.system_settings?.allow_export_personal_data !== '1' && accountInfo.value?.system_settings?.allow_import_personal_data === '1') {
            backupStatus.value = 'import'
        } else if (accountInfo.value?.system_settings?.allow_export_personal_data !== '1' && accountInfo.value?.system_settings?.allow_import_personal_data !== '1') {
            backupStatus.value = 'none'
        }
    }
})

const saveSettings = (e: Event) => {
    e.preventDefault()
    if (settingsValue.username || settingsValue.email) {
        // change email
        Request(store.basePath + '/passport/update/info', {
            headers: {
                Authorization: store.authorization,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'PUT',
            body: new URLSearchParams({
                username: settingsValue.username,
                email: settingsValue.email,
                ntfy_topic: settingsValue.ntfy_topic,
                bark_key: settingsValue.bark_key,
                push_type: settingsValue.push_type,
                password: settingsValue.password
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
    if (settingsValue.password.length > 0 && settingsValue.new_password.length > 0 && settingsValue.password !== settingsValue.new_password) {
        // change pwd
        Request(store.basePath + '/passport/update/password', {
            headers: {
                Authorization: store.authorization,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'PUT',
            body: new URLSearchParams({ old_password: settingsValue.password, new_password: settingsValue.new_password }).toString()
        }).then((res) => {
            if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
                Notice(res.message, 'error')
                return
            }
            Notice('密码修改成功', 'success')
            store.updateAuthorization(res.data.token)
            //console.log(res)
        })
    } else if (settingsValue.password === settingsValue.new_password) {
        //console.log('same password!')
    }
}

const logout = () => {
    fetch(store.basePath + '/passport/logout', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200 && res.code !== 401) {
                return
            }
            store.logout()
            //console.log(res)
            navigateTo('/signin')
        })
}

const backupStatus = ref<string>('export') // import
const backupFileData = ref<{ [p in string]: any }>({})

const loadingBackupData = () => {
    backupFileData.value = {}
    ReadFileData('upload-backup-data')
        .then((res) => {
            for (const table in res) {
                if (table.startsWith('tc_')) {
                    switch (table) {
                        case 'tc_baiduid':
                            if (!res[table].some((t) => !(t.portrait && t.stoken && t.bduss && t.id && t.id > 0))) {
                                backupFileData.value.tc_baiduid = res.tc_baiduid.map((t) => ({
                                    portrait: String(t.portrait),
                                    stoken: String(t.stoken),
                                    bduss: String(t.bduss),
                                    name: String(t.name || ''),
                                    label: Number(t.id)
                                }))
                            }
                            break
                        case 'tc_tieba':
                            if (!res[table].some((t) => !(t.tieba && t.fid && backupFileData.value.tc_baiduid.find((bdid) => bdid.label === t.pid)))) {
                                backupFileData.value.tc_tieba = res.tc_tieba.map((t) => ({
                                    tieba: String(t.tieba),
                                    fid: Number(t.fid || 0),
                                    label: Number(t.pid || 0),
                                    no: !!(t.no || false),
                                    latest: Number(t.latest || 0),
                                    status: Number(t.status || 0),
                                    last_error: String(t.last_error || '')
                                }))
                            }
                            break
                    }
                }
            }
            document.getElementById('upload-backup-data').value = ''
        })
        .catch((err) => {})
}

const exportAccount = (password = '') => {
    Request(store.basePath + '/passport/export', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST',
        body: new URLSearchParams({
            password
        })
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice('导出失败: ' + res.message, 'error')
                return
            }
            Notice('导出成功', 'success')
            DownloadFile(`tbsign_go-export-${accountInfo.value.uid}.json`, JSON.stringify(res.data, null, 4))
        })
        .catch((e) => {
            Notice('导出失败: ' + e, 'error')
        })
}

const importAccount = (password = '') => {
    Request(store.basePath + '/passport/import', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST',
        body: new URLSearchParams({
            password,
            data: JSON.stringify(backupFileData.value)
        })
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice('导入失败: ' + res.message, 'error')
                return
            }
            Notice(`导入完成，本次导入百度账号 ${res.data.tc_baiduid} 个，贴吧 ${res.data.tc_tieba} 个，请刷新网页`, 'success')
        })
        .catch((e) => {
            Notice('导出失败: ' + e, 'error')
        })
}
</script>
