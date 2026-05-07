<template>
    <button class="aspect-square rounded-xl tex-3xl transition-colors bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 p-2" @click="switchDarkModeProxy">
        <!--auto-->
        <uno-icon v-if="darkMode === '0'" class="i-bi:circle-half" style="width: 1.25rem; height: 1.25rem" />
        <!--the sun-->
        <uno-icon v-else-if="darkMode === '1'" class="i-bi:sun-fill" style="width: 1.25rem; height: 1.25rem" />
        <!--the moon-->
        <uno-icon v-else-if="darkMode === '2'" class="i-bi:moon-fill" style="width: 1.25rem; height: 1.25rem" />
    </button>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { switchDarkMode, switchDarkModeAction } from '~/share/DarkMode'
import type { darkModeType } from '~/share/DarkMode'

const darkMode = ref<darkModeType>('0')

if (!inject('darkMode', false)) {
    const { vueApp } = useNuxtApp()
    vueApp.provide('darkMode', readonly(darkMode))
}

const store = useMainStore()

onMounted(() => {
    //get data from storage
    if (localStorage.darkMode) {
        darkMode.value = localStorage.darkMode
    }
    const dark = switchDarkModeAction(darkMode.value) === 'dark'
    store.updateValue('dark', dark)
})

const switchDarkModeProxy = () => {
    const dm = switchDarkMode(darkMode.value)
    darkMode.value = dm.darkMode
    store.updateValue('dark', dm.currentScheme === 'dark')
    localStorage.darkMode = darkMode.value
}
</script>
