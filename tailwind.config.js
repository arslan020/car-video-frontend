/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1e3a8a', // Deep blue
                secondary: '#bfdbfe', // Light blue
                accent: '#2563eb', // Bright blue
            }
        },
    },
    plugins: [],
}
