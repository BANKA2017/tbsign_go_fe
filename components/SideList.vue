<script lang="ts" setup>
import { reactive } from 'vue'
import { useMainStore } from '~/stores/main'

const store = useMainStore()

const isAdmin = computed(() => store.admin)
const authorization = computed(() => store._authorization)
const pluginList = computed(() => store._cache?.plugin_list)
const pageLoginConfig = computed(() => store._cache?.config_page_login)

const route = useRoute()

const state = reactive<{
    navs: { name: string; to: string; routeName: string; active: boolean }[]
}>({
    navs: [
        { name: '首页', to: '/', routeName: 'index', active: true },
        { name: '个人设置', to: '/settings', routeName: 'settings', active: false },
        { name: '百度账号管理', to: '/accounts', routeName: 'accounts', active: false },
        { name: '循环封禁', to: '/plugin_loop_ban', routeName: 'plugin_loop_ban', active: false },
        { name: '名人堂', to: '/plugin_forum_support', routeName: 'plugin_forum_support', active: false },
        { name: '成长任务', to: '/plugin_user_growth_tasks', routeName: 'plugin_user_growth_tasks', active: false },
        { name: '用户管理', to: '/user_admin', routeName: 'user_admin', active: false },
        { name: '系统管理', to: '/system_admin', routeName: 'system_admin', active: false },
        //{ name: '更多工具', to: '/tools', routeName: 'tools', active: false },
        { name: '登录', to: '/login', routeName: 'login', active: false },
        { name: '注册', to: '/signup', routeName: 'signup', active: false },
        { name: '重设密码', to: '/reset', routeName: 'reset', active: false }
    ]
})

const wholeRouteName = computed(() => state.navs.map((x) => x.routeName))

const updateNavStatus = () => {
    for (const i in state.navs) {
        switch (state.navs[i].routeName) {
            case 'login':
                state.navs[i].active = authorization.value === ''
                break
            case 'signup':
                state.navs[i].active = (authorization.value === '' && pageLoginConfig.value?.enabled_signup) || false
                break
            case 'reset':
                state.navs[i].active = (authorization.value === '' && pageLoginConfig.value?.enabled_reset_password) || false
                break
            case 'user_admin':
            case 'system_admin':
                state.navs[i].active = authorization.value !== '' && isAdmin.value
                break
            case 'plugin_loop_ban':
                state.navs[i].active = pluginList.value?.['ver4_ban']?.status || false
                break
            case 'plugin_forum_support':
                state.navs[i].active = pluginList.value?.['ver4_rank']?.status || false
                break
            case 'plugin_user_growth_tasks':
                state.navs[i].active = pluginList.value?.['kd_growth']?.status || false
                break
            default:
                state.navs[i].active = authorization.value !== ''
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
        <div class="inline-block md:block" v-for="nav in state.navs.filter((x) => x.active)" :key="nav.name">
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
                    'hover:text-white': true,
                    'dark:text-white': true,
                    'text-white': route.name === nav.routeName,
                    'py-2': true
                }"
                :to="nav.to"
            >
                {{ nav.name }}
            </NuxtLink>
        </div>

        <div class="text-sm text-gray-500 my-5 hidden md:block">NeXT TbSign</div>
    </div>
</template>

<style scoped></style>
