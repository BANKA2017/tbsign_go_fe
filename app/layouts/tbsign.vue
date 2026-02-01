<template>
    <div id="app">
        <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-gray-100">
            <div class="max-w-[1024px] mx-auto">
                <div class="mx-4 md:mx-10 lg:mx-8 xl:mx-4">
                    <main-title />
                    <main id="main" class="my-5 relative w-full">
                        <div class="flex flex-col md:flex-row w-full gap-4 items-stretch justify-center dark:text-gray-100">
                            <nav class="w-full md:w-60">
                                <side-list />
                            </nav>
                            <div class="w-full shrink">
                                <div v-if="isLoading" class="bg-gray-300 dark:bg-gray-700 rounded-xl px-3 py-5 my-2">
                                    <svg class="animate-spin h-5 w-5 dark:text-gray-100 text-sky-500 mr-1 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    加载中……
                                </div>
                                <slot v-else />
                            </div>
                        </div>
                    </main>
                    <Footer class="block" />
                </div>
            </div>
            <Loading />
            <div
                class="fixed right-5 2xl:right-1/2 2xl:translate-x-[calc(512px+(2rem+(0.75rem*2)))] bottom-20 px-3 py-2 cursor-pointer transition-colors duration-150 select-none text-gray-100 bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded-md"
                style="z-index: 9999"
                @click="ScrollTo()"
            >
                <uno-icon class="i-bi:caret-up-fill" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import MainTitle from '~/components/MainTitle.vue'
import Footer from '~/components/Footer.vue'
import Loading from '~/components/Loading.vue'
import ScrollTo from '~/share/ScrollTo'

const store = useMainStore()
const account_info = computed(() => store._cache?.accountInfo || { uid: 0 })

const router = useRouter()

const isNotLoginPath = computed(() => ['signin', 'signup', 'reset-password', 'add-base-path'].includes(router.currentRoute.value.name?.toString() || ''))

const isLoading = computed(() => !isNotLoginPath.value && Number(account_info.value?.uid || 0) <= 0)
</script>

<style>
@import url('noty/lib/noty.css');
@import url('noty/lib/themes/nest.css');

.list-out {
    opacity: 0;
    transition:
        max-height 0.1s ease-out,
        opacity 0.1s ease-out;
    overflow: hidden;
}

.list-in {
    opacity: 1;
    transition:
        max-height 0.1s ease-in,
        opacity 0.1s ease-in;
    overflow: hidden;
}
</style>
