<script lang="ts" setup>
import { reactive } from 'vue'
import { useMainStore } from '~/stores/main'

const store = useMainStore()

const isAdmin = computed(() => store.admin)
const authorization = computed(() => store._authorization)

const state = reactive<{
    navs: { name: string; to: string; routerName: string; active: boolean }[]
}>({
    navs: [
        { name: '首页', to: '/', routerName: 'index', active: true },
        { name: '个人设置', to: '/settings', routerName: 'settings', active: false },
        { name: '百度账号管理', to: '/accounts', routerName: 'accounts', active: false },
        { name: '循环封禁', to: '/plugin_loop_ban', routerName: 'plugin_loop_ban', active: false },
        { name: '名人堂', to: '/plugin_forum_support', routerName: 'plugin_forum_support', active: false },
        { name: '成长任务', to: '/plugin_user_growth_tasks', routerName: 'plugin_user_growth_tasks', active: false },
        { name: '用户管理', to: '/user_admin', routerName: 'user_admin', active: false },
        { name: '系统管理', to: '/system_admin', routerName: 'system_admin', active: false },
        { name: '更多工具', to: '/tools', routerName: 'tools', active: false },
        { name: '登录', to: '/login', routerName: 'login', active: false },
        { name: '注册', to: '/signup', routerName: 'signup', active: false },
        { name: '重设密码', to: '/reset', routerName: 'reset', active: false }
    ]
})

const updateNavStatus = () => {
    for (const i in state.navs) {
        switch (state.navs[i].routerName) {
            case 'login':
            case 'signup':
            case 'reset':
                state.navs[i].active = authorization.value === ''
                break
            case 'user_admin':
            case 'system_admin':
                state.navs[i].active = authorization.value !== '' && isAdmin.value
                break
            default:
                state.navs[i].active = authorization.value !== ''
        }
    }
}

watch([isAdmin, authorization], () => {
    updateNavStatus()
})

updateNavStatus()
</script>

<template>
    <div id="side-list" class="select-none">
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
                    'bg-sky-500': $route.name === nav.routerName,
                    'text-black': $route.name !== nav.routerName,
                    'hover:text-white': true,
                    'dark:text-white': true,
                    'text-white': $route.name === nav.routerName,
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
