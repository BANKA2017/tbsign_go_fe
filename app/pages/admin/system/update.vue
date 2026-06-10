<script setup lang="ts">
import SystemPanelTab from '~/components/SystemPanelTab.vue'
import UpdateSystemItem from '~/components/UpdateSystemItem.vue'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const isAdmin = computed(() => store.admin)

const serverStatus = ref<
    {
        build: { [key: string]: string }
        upgrade: { [key: string]: string | boolean }
        variables: { [key: string]: string | boolean }
    } & {
        [key: string]: string | number | boolean | { [key: string]: string | boolean } | { [key: string]: string }
    }
>({
    build: {},
    variables: {},
    upgrade: {}
})

const isSupportVersion = (os = '', arch = '') => {
    // Windows will lock the binary file
    return (['linux', 'darwin'].includes(os) && ['arm64', 'amd64'].includes(arch)) || (os === 'windows' && arch === 'amd64')
}

const serverGoStatus = computed(() => {
    const res = {
        os: '',
        arch: ''
    }
    if (typeof serverStatus.value?.goversion === 'string') {
        const tmpVersion = serverStatus.value?.goversion.split(' ')
        if (tmpVersion.length !== 2) {
            return res
        }
        const [os, arch] = tmpVersion[1].split('/')
        if (os && arch) {
            res.os = os
            res.arch = arch
        }
        return res
    } else {
        return res
    }
})

const fullVersion = computed(() => {
    return (
        serverStatus.value.build.date.slice(0, 10).replaceAll('-', '') +
        '.' +
        (serverStatus.value?.build?.commit_hash && serverStatus.value.build.commit_hash !== 'N/A' ? (serverStatus.value.build.commit_hash || '').slice(0, 7) : '_') +
        '.' +
        (serverStatus.value?.build?.embedded_frontend_commit_hash && serverStatus.value.build.embedded_frontend_commit_hash !== 'N/A' ? (serverStatus.value.build.embedded_frontend_commit_hash || '').slice(0, 7) : '_')
    )
})

const releaseList = ref<any[]>([])
const tenMinutesDelay = ref<boolean>(true)

const getReleasesList = () => {
    Request((serverStatus.value.upgrade.api_base || 'https://api.github.com/repos/banka2017/tbsign_go') + '/releases?per_page=6')
        .then((res) => {
            releaseList.value = res.sort((a: any, b: any) => (a.published_at < b.published_at ? 1 : -1)).filter((x) => x.tag_name.startsWith('tbsign_go.'))
            const currentIndex = releaseList.value.map((x) => x.tag_name.replace('tbsign_go.', '')).indexOf(fullVersion.value)
            if (currentIndex > -1) {
                releaseList.value = releaseList.value.filter((_, i) => i <= currentIndex)
            }

            if (releaseList.value.length === 1 && releaseList.value[0].tag_name.replace('tbsign_go.', '') === fullVersion.value) {
                tenMinutesDelay.value = false
            }
        })
        .catch((e) => {
            Notice(e.toString(), 'error')
            console.error(e)
        })
}

const loading = ref<boolean>(false)

const syncStatus = () => {
    loading.value = true
    Request(store.basePath + '/admin/server/status', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            serverStatus.value = res.data
            //console.log(res)
        })
        .finally(() => {
            loading.value = false
        })
}

onMounted(() => {
    syncStatus()
})
</script>

<template>
    <div v-if="isAdmin">
        <div class="my-2 rounded-2xl">
            <SystemPanelTab active-component="update" />
        </div>

        <div class="my-2 rounded-2xl mb-5">
            <div class="px-3 py-2">
                <h2 class="text-xl font-bold">软件更新</h2>
            </div>
            <p class="px-3 py-1" v-if="serverStatus?.encrypt">
                <uno-icon class="i-bi:file-earmark-lock-fill inline-block -mt-0.5" />
                升级前请先解密数据
            </p>
            <p class="px-3 py-1" v-else-if="(serverStatus.build.publish_type || '').toLowerCase() === 'source'">
                <uno-icon class="i-bi:git -mt-0.5 inline-block" style="color: #f54d27" />
                开发版请参考
                <a href="https://github.com/BANKA2017/tbsign_go/blob/master/build.sh" target="_blank" class="underline"><code>build.sh</code></a> 编译运行
            </p>
            <p class="px-3 py-1" v-else-if="(serverStatus.build.publish_type || '').toLowerCase() === 'docker'">
                <uno-icon class="i-skill-icons:docker inline-block -mt-0.5" />
                Docker 版请前往 <a href="https://github.com/BANKA2017/tbsign_go/pkgs/container/tbsign_go" target="_blank" class="underline"><code>ghcr.io</code></a> 检查更新
            </p>
            <p class="px-3 py-1" v-else-if="!isSupportVersion(serverGoStatus.os, serverGoStatus.arch)">
                <uno-icon class="i-bi:cpu-fill -mt-0.5 inline-block" />
                {{ (serverGoStatus.os || '').toLowerCase() + '-' + (serverGoStatus.arch || '').toLowerCase() }} 不支持网页更新
            </p>
            <div v-else>
                <ul role="list" class="px-3 my-2 marker:text-sky-500 list-disc list-inside">
                    <li>
                        如果下面列表中没有一项的右上角有<SvgCheck height="1.2em" width="1.2em" class="inline-block mx-0.5 -mt-0.5" />，说明当前版本过于老旧，或者属于拥有严重 BUG 被撤回的版本，建议前往
                        <a href="https://github.com/BANKA2017/tbsign_go/releases" target="_blank" class="underline"><code>Releases</code></a> 下载文件替换更新
                    </li>
                    <li>无法保证直接升级一定能够成功，升级前请提前备份数据库</li>
                    <li @click="tenMinutesDelay = false" role="button">最后更新会有 10 分钟的延迟</li>
                    <li>不支持自动降级</li>
                    <li>
                        <span class="rounded-full mr-1">
                            <span class="rounded-l-full pl-2 pr-1 text-sm border-2 bg-sky-500 border-sky-500 text-gray-100">{{ serverGoStatus.os }}</span>
                            <span class="rounded-r-full pr-2 pl-1 text-sm border-2 border-sky-500">{{ serverGoStatus.arch }}</span> </span
                        >是正式版，
                        <span class="rounded-full mr-1">
                            <span class="rounded-l-full pl-2 pr-1 text-sm border-2 bg-yellow-500 border-yellow-500 text-gray-900 font-semibold">{{ serverGoStatus.os }}</span>
                            <span class="rounded-r-full pr-2 pl-1 text-sm border-2 border-yellow-500">{{ serverGoStatus.arch }}</span> </span
                        >是 Pre-release 版
                    </li>
                    <li>
                        <Modal class="inline-block" title="更新来源" aria-label="更新来源">
                            <template #default> <span class="cursor-pointer">点击查看更新来源</span> </template>
                            <template #container>
                                <label for="upgrade-list" class="block text-sm font-medium mb-1 mt-3">API</label>
                                <input
                                    id="upgrade-list"
                                    type="text"
                                    disabled
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                    :value="serverStatus.upgrade?.api_base || 'https://api.github.com/repos/banka2017/tbsign_go'"
                                />
                                <label for="upgrade-list" class="block text-sm font-medium mb-1 mt-3">下载地址</label>
                                <input
                                    id="upgrade-list"
                                    type="text"
                                    disabled
                                    class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                                    :value="serverStatus.upgrade?.asset_base || 'https://github.com/BANKA2017/tbsign_go/releases/download'"
                                />
                            </template>
                        </Modal>
                    </li>
                </ul>

                <UploadBinary v-if="serverStatus.upgrade?.allow_upload" :os="serverGoStatus.os" :arch="serverGoStatus.arch" :current-build-date="serverStatus.build.date" />

                <button class="border-pink-500 hover:bg-pink-500 border-2 rounded-lg ml-3 mt-3 px-3 py-1 hover:text-gray-100 transition-colors" title="检查更新" aria-label="检查更新" @click="getReleasesList">
                    {{ releaseList.length == 0 ? '检查更新' : '刷新列表' }}
                </button>

                <div class="p-3 grid grid-cols-2 gap-2" v-if="releaseList.length > 0">
                    <div class="col-span-2 md:col-span-1" v-for="(release, i) in releaseList.filter((x) => !tenMinutesDelay || Number(new Date(x.published_at)) + 1000 * 60 * 10 < Date.now())" :key="release.tag_name">
                        <UpdateSystemItem
                            :item="release.assets.find((x: any) => x.name.endsWith(Object.values(serverGoStatus).join('-') + (serverGoStatus.os === 'windows' ? '.exe' : '')))"
                            :url="release.html_url"
                            :current="fullVersion"
                            :os="serverGoStatus.os"
                            :arch="serverGoStatus.arch"
                            :base="serverStatus.upgrade.asset_base?.toString()"
                            :prerelease="release.prerelease"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
