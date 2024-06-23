<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="rounded-2xl bg-gray-300 dark:bg-gray-900 p-5">....</div>
        </frame-work>
    </NuxtLayout>
</template>
<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

// fetch("http://192.168.123.41:1323/passport/login", {
//     method: 'POST',
//     body: new URLSearchParams({
//         account: 'a',
//         password: ''
//     }),
// }).then(res => res.json()).then(res => {
//     if (res.code !== 200) {
//         return
//     }
//     store.updateValue('account', res.data)
//     console.log(res)
// })
definePageMeta({
    middleware: ['auth']
})
</script>
