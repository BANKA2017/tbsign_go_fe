<template>
    <NuxtLayout name="tbsign">
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
const colorScheme = ref<string>('normal')

useHead({
    htmlAttrs: {
        lang: 'zh'
    },
    script: [
        {
            innerHTML: `d=localStorage.darkMode||'0';c=document.documentElement.classList;v=c.value==='';if((d==='0'&&matchMedia('(prefers-color-scheme:dark)').matches&&v)||(d==='2'&&v)){c.add('dark')}`
        }
    ],
    meta: [{ name: 'color-scheme', content: colorScheme.value }]
})

const store = useMainStore()

onMounted(() => {
    store.updateSize()
    window.addEventListener('resize', store.updateSize)
    colorScheme.value = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'normal'
})

onUnmounted(() => {
    window.removeEventListener('resize', store.updateSize)
})
</script>

<style scoped></style>
