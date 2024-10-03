<script lang="ts" setup>
import { reactive } from 'vue'
import { useMainStore } from '~/stores/main'

const store = useMainStore()
const runtimeConfig = useRuntimeConfig()
const showList = ref<boolean>(false)

const isAdmin = computed(() => store.admin)
const authorization = computed(() => store.rawAuthorization)
const pluginList = computed(() => store._cache?.plugin_list || {})
const pageLoginConfig = computed(() => store._cache?.config_page_login)

const route = useRoute()
const state = reactive<{
    navs: { name: string; to: string; routeName: string; active: boolean; show: boolean; plugin_name_backend?: string; sort: number }[]
}>({
    navs: [
        { name: '首页', to: '/', routeName: 'index', active: true, show: true, sort: 0 },
        { name: '个人设置', to: '/settings', routeName: 'settings', active: false, show: true, sort: 1 },
        { name: '百度账号管理', to: '/accounts', routeName: 'accounts', active: false, show: true, sort: 2 },
        { name: '用户管理', to: '/user_admin', routeName: 'user_admin', active: false, show: true, sort: 4 },
        { name: '系统管理', to: '/system_admin', routeName: 'system_admin', active: false, show: true, sort: 5 },
        //{ name: '更多工具', to: '/tools', routeName: 'tools', active: false, show: true, sort: 6},
        { name: '登录', to: '/login', routeName: 'login', active: false, show: true, sort: 7 },
        { name: '注册', to: '/signup', routeName: 'signup', active: false, show: true, sort: 8 },
        { name: '找回密码', to: '/reset_password', routeName: 'reset_password', active: false, show: true, sort: 9 },
        { name: '接口控制', to: '/add_base_path', routeName: 'add_base_path', active: false, show: true, sort: 10 }
    ]
})

const wholeRouteName = computed(() => state.navs.map((x) => x.routeName))
const activeNavs = computed(() => state.navs.filter((x) => x.active))

const updateNavStatus = () => {
    const routeSet = new Set(state.navs.map((n) => n.routeName))
    const tmpNavs = Object.fromEntries(state.navs.map((nav) => [nav.routeName, nav]))
    for (const plugin of Object.values(pluginList.value)) {
        if (plugin.plugin_name_fe && !routeSet.has(plugin.plugin_name_fe)) {
            tmpNavs[`plugin_${plugin.plugin_name_fe}`] = {
                name: plugin.plugin_name_cn_short,
                to: `/plugin_${plugin.plugin_name_fe}`,
                routeName: `plugin_${plugin.plugin_name_fe}`,
                plugin_name_backend: plugin.name,
                active: false,
                show: true,
                sort: 3
            }
        }
    }
    state.navs = Object.values(tmpNavs).sort((a, b) => (a.sort === b.sort ? (a.routeName > b.routeName ? 1 : -1) : a.sort > b.sort ? 1 : -1))
    for (const i in state.navs) {
        switch (state.navs[i].routeName) {
            case 'login':
                state.navs[i].active = authorization.value === ''
                break
            case 'add_base_path':
                state.navs[i].active = authorization.value === '' && runtimeConfig.public.NUXT_BASE_PATH === ''
                break
            case 'signup':
                state.navs[i].active = (authorization.value === '' && pageLoginConfig.value?.enabled_signup) || false
                break
            case 'reset_password':
                state.navs[i].active = authorization.value === '' || false
                break
            case 'user_admin':
            case 'system_admin':
                state.navs[i].active = authorization.value !== '' && isAdmin.value
                break
            default:
                if (state.navs[i].routeName.startsWith('plugin')) {
                    state.navs[i].active = pluginList.value?.[state.navs[i].plugin_name_backend || '']?.status || false
                } else {
                    state.navs[i].active = authorization.value !== ''
                }
        }
    }
}

watch([isAdmin, authorization], updateNavStatus)
watch(pluginList, updateNavStatus, { deep: true })
watch(pageLoginConfig, updateNavStatus, { deep: true })

useHead({
    title: computed(() => {
        const tmpIndex = wholeRouteName.value.indexOf(route.name)
        if (tmpIndex < 0) {
            return '404'
        } else {
            return state.navs[tmpIndex].name
        }
    })
})

updateNavStatus()
</script>

<template>
    <div id="side-list" class="select-none" v-show="wholeRouteName.includes(route.name)">
        <client>
            <div class="md:hidden">
                <div v-for="nav in activeNavs" :key="nav.routeName" v-show="nav.show">
                    <NuxtLink
                        v-show="showList || route.name === nav.routeName"
                        :class="{
                            block: true,
                            'my-1': true,
                            'px-5': true,
                            'mx-1': true,
                            'md:-mx-5': true,
                            'rounded-full': true,
                            'transition-colors': true,
                            'hover:bg-sky-500': true,
                            'bg-sky-500': route.name === nav.routeName,
                            'text-black': route.name !== nav.routeName,
                            'hover:text-gray-100': true,
                            'dark:text-gray-100': true,
                            'text-gray-100': route.name === nav.routeName,
                            'py-2': true,
                            flex: true,
                            'justify-between': true
                        }"
                        :to="nav.to"
                        @click="showList = !showList"
                    >
                        <span>{{ nav.name }}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="bi bi-list w-[1.5em]" viewBox="0 0 16 16" v-show="!showList">
                            <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                        </svg>
                    </NuxtLink>
                </div>
            </div>
            <div class="hidden md:block" v-for="nav in activeNavs" :key="nav.routeName" v-show="nav.show">
                <NuxtLink
                    :class="{
                        'inline-block': true,
                        'my-1': true,
                        'px-5': true,
                        'mx-1': true,
                        'md:-mx-5': true,
                        'rounded-full': true,
                        'transition-colors': true,
                        'hover:bg-sky-500': true,
                        'bg-sky-500': route.name === nav.routeName,
                        'text-black': route.name !== nav.routeName,
                        'hover:text-gray-100': true,
                        'dark:text-gray-100': true,
                        'text-gray-100': route.name === nav.routeName,
                        'py-2': true
                    }"
                    :to="nav.to"
                >
                    {{ nav.name }}
                </NuxtLink>
            </div>
        </client>
    </div>
</template>

<style scoped></style>
