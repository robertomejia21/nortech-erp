/** @type {import('next').NextConfig} */
const nextConfig = {
    // Transpile Firebase packages to fix undici compatibility with Node.js v24
    transpilePackages: ['firebase', '@firebase/auth', '@firebase/firestore', '@firebase/storage', '@firebase/functions'],

    webpack: (config, { isServer }) => {
        // Fix for undici private class fields syntax
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig;
