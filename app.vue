<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
    htmlAttrs: {
        lang: 'zh'
    },
    script: [
        {
            innerHTML: `d=localStorage.darkMode||'0';c=document.documentElement.classList;v=c.value==='';if((d==='0'&&matchMedia('(prefers-color-scheme:dark)').matches&&v)||(d==='2'&&v)){c.add('dark')}`
        }
    ]
})
</script>

<style scoped></style>
