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

onMounted(() => {
    //get data from storage
    if (localStorage.darkMode) {
        darkMode.value = localStorage.darkMode
    }
    switchDarkModeAction(darkMode.value)
})

const switchDarkModeProxy = () => {
    darkMode.value = switchDarkMode(darkMode.value)
    localStorage.darkMode = darkMode.value
}
</script>
