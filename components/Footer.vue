<template>
    <footer class="text-end py-10 text-sm">
        <section class="text-gray-900 dark:text-gray-100 font-sans mb-1 rounded-full flex justify-end">
            <div v-if="config.public.NUXT_BASE_PATH" role="button" class="inline-block">
                <span class="border border-sky-500 rounded-full px-2">Private</span>
            </div>
            <NuxtLink to="/add_base_path" v-else role="button" class="inline-block" :title="basePath">
                <span class="bg-sky-500 border border-sky-500 text-gray-100 rounded-l-full px-2">API</span>
                <span class="border border-sky-500 rounded-r-full px-2 transition-all">{{ parsedBasePath?.protocol === 'https' ? 'https' : parsedBasePath?.protocol === undefined ? 'NONE' : 'http' }}</span>
            </NuxtLink>
        </section>
    </footer>
</template>

<script setup lang="ts">
const store = useMainStore()
const config = useRuntimeConfig()

const basePath = computed(() => store.basePath)

const parsedBasePath = computed(() => {
    try {
        return new URL(basePath.value)
    } catch {
        return {}
    }
})
</script>
