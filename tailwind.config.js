/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./components/**/*.{js,vue,ts}', './layouts/**/*.vue', './pages/**/*.vue', './plugins/**/*.{js,ts}', './nuxt.config.{js,ts}', './app.vue'],
    darkMode: 'class',
    theme: {
        extend: {
            screens: {
                '3xs': '300px',
                '2xs': '375px',
                xs: '475px'
            }
        }
    },
    plugins: [require('@tailwindcss/forms')]
}
