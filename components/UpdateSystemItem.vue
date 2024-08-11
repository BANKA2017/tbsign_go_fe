<script setup lang="ts">
import { Notice } from '~/share/Tools'
import Modal from './Modal.vue'

const props = defineProps({
    item: Object,
    isCurrent: Boolean,
    url: String,
    os: String,
    arch: String
})

const store = useMainStore()

const targetVersion = computed(() => props.item.name.replace('tbsign_go.', '').replace(`.${props.os}-${props.arch}`, ''))

const flowStep = ref<number>(0)
const doubleCheck = ref<boolean>(false)

const upgradeToVersion = (version: string = '') => {
    store.updateValue('loading', true)
    fetch(store.basePath + '/admin/server/upgrade', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'version=' + version,
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
            Notice('🎉已更新到 ' + version, 'success')
            flowStep.value = 1
            //console.log(res)
        })
        .catch((e) => {
            store.updateValue('loading', false)
            Notice(e.toString(), 'error')
            console.error(e)
        })
}

const restartSystem = () => {
    fetch(store.basePath + '/admin/server/shutdown', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
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
            //console.log(res)
        })
        .catch((e) => {
            Notice('已关闭系统，请刷新本页', 'success')
            flowStep.value = 2
            console.error(e)
        })
}

const refreshPage = () => {
    location.reload()
}
</script>

<template>
    <div class="border-4 border-gray-400 dark:border-gray-700 rounded-xl p-3 my-2">
        <div class="flex justify-between">
            <span class="rounded-full">
                <span class="rounded-l-full pl-2 pr-1 text-sm border-2 bg-sky-500 border-sky-500 text-gray-100">{{ os }}</span>
                <span class="rounded-r-full pr-2 pl-1 text-sm border-2 border-sky-500">{{ arch }}</span>
            </span>
            <span v-if="isCurrent" title="当前版本"> ✅ </span>
        </div>
        <ul role="list" class="my-2 marker:text-sky-500 list-disc list-inside">
            <li>
                上传时间 : <code>{{ item.created_at }}</code>
            </li>
            <li>
                版本 : <code>{{ targetVersion }}</code>
            </li>
            <li>
                大小 :
                <code
                    ><span :title="item.size + ' 字节'"> {{ (item.size / 1024 / 1024).toFixed(2) }} MB ({{ item.size }}) </span></code
                >
            </li>
        </ul>

        <div class="flex justify-start gap-2">
            <Modal class="col-span-3 md:col-span-1" title="更新系统" aria-label="更新系统" v-if="!isCurrent">
                <template #default>
                    <button class="border-pink-500 hover:bg-pink-500 border-2 rounded-lg px-3 py-1 hover:text-gray-100 transition-colors" title="更新系统" aria-label="更新系统">更新系统</button>
                </template>
                <template #container>
                    <div v-if="flowStep === 0">
                        <ul role="list" class="mb-3 marker:text-sky-500 list-disc list-inside">
                            <li>确认后将会更新程序，本操作不可逆！</li>
                            <li>本操作可能需要较长时间，请等到右上角圈圈消失并弹出消息后再关闭本窗口！</li>
                        </ul>
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="upgradeToVersion(targetVersion)">确认更新</button>
                    </div>
                    <div v-else-if="flowStep === 1">
                        <ul role="list" class="marker:text-sky-500 list-disc list-inside">
                            <li>更新已完成，下次开启本程序将会使用新版本</li>
                            <li>如果已经部署了守护程序请点击下面的确认关闭按钮，否则请回到最初部署的地方重启</li>
                        </ul>
                        <div class="my-3" v-show="!doubleCheck">
                            <input type="checkbox" class="form-checkbox bg-gray-100 dark:bg-gray-900 dark:checked:bg-blue-500" v-model="doubleCheck" :id="'upgrade-double-check-:' + targetVersion" /><label
                                class="ml-2"
                                :for="'upgrade-double-check-:' + targetVersion"
                                >确定关闭</label
                            >
                        </div>

                        <button v-show="doubleCheck" class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg my-3" @click="restartSystem">确认关闭</button>
                    </div>
                    <div v-else-if="flowStep === 2">
                        <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="refreshPage">刷新</button>
                    </div>
                </template>
            </Modal>
            <NuxtLink class="rounded-lg px-2 py-1 border-2 border-gray-300 hover:bg-gray-300 hover:text-black transition-colors" role="button" :to="url" target="blank">版本信息</NuxtLink>
        </div>
    </div>
</template>
