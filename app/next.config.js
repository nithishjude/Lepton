/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@rainbow-me/rainbowkit'],
  // Keep WalletConnect packages out of the server bundle — they access browser APIs (indexedDB)
  serverExternalPackages: [
    '@walletconnect/universal-provider',
    '@walletconnect/ethereum-provider',
    '@walletconnect/sign-client',
    'pino',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, accounts: false };
    return config;
  },
}
module.exports = nextConfig
