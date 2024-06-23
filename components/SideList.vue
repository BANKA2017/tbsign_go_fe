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
        { name: '循环封禁', to: '/loop_ban', routerName: 'loop_ban', active: false },
        { name: '名人堂', to: '/forum_support', routerName: 'forum_support', active: false },
        { name: '成长任务', to: '/user_growth_tasks', routerName: 'user_growth_tasks', active: false },
        { name: '系统管理', to: '/admin', routerName: 'admin', active: false },
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
            case 'admin':
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
        <template v-for="nav in state.navs.filter((x) => x.active)" :key="nav.name">
            <NuxtLink
                :class="{
                    'inline-block': true,
                    'md:block': true,
                    'my-1': true,
                    'px-3': true,
                    'mx-1': true,
                    'rounded-full': true,
                    'text-center': true,
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
        </template>

        <div class="text-sm text-gray-500 text-center my-5 hidden md:block">NeXT TbSign</div>
    </div>
</template>

<style scoped></style>
