<template>
    <div id="app">
        <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-gray-100">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-start-1 col-span-12 md:col-start-2 md:col-span-10">
                    <div class="mx-4 md:mx-1">
                        <main-title />
                        <main id="main" class="my-5">
                            <div class="grid grid-cols-4 gap-5 dark:text-gray-100">
                                <nav class="col-span-4 md:col-span-1">
                                    <side-list />
                                </nav>
                                <div class="col-span-4 md:col-span-3">
                                    <slot />
                                </div>
                            </div>
                        </main>
                        <Footer class="block" />
                    </div>
                </div>
            </div>
            <Loading />
            <div
                :class="{
                    fixed: true,
                    'right-5': true,
                    'bottom-20': true,
                    'px-3': true,
                    'py-2': true,
                    'cursor-pointer': true,
                    'transition-colors': true,
                    'duration-150': true,
                    'select-none': true,
                    'text-gray-100': true,
                    'bg-sky-500': true,
                    'hover:bg-sky-600': true,
                    'dark:hover:bg-sky-400': true,
                    'rounded-md': true
                }"
                style="z-index: 9999"
                @click="ScrollTo()"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-caret-up-fill" viewBox="0 0 16 16">
                    <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z" />
                </svg>
            </div>
        </div>
    </div>
</template>

<script setup>
import MainTitle from './MainTitle'
import Footer from './Footer'
import Loading from '~/components/Loading'
import ScrollTo from '~/share/ScrollTo'
</script>

<style>
@import url('noty/lib/noty.css');
@import url('noty/lib/themes/nest.css');
</style>
