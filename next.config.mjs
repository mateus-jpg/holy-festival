/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            'drive.google.com',
            'lh3.googleusercontent.com',
            'firebasestorage.googleapis.com'
        ],
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/shop',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
