/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                mohi: {
                    100: '#DAE0CE',
                    200: '#BECBA7',
                    300: '#A3B581',
                    400: '#87A05A',
                    500: '#6C8B33',
                },
                molo: {
                    100: '#F3D2CE',
                    200: '#F1B0A7',
                    300: '#EF8D80',
                    400: '#ED6B59',
                    500: '#EB4832',
                }
            }
        },
    },
    plugins: [],
}
