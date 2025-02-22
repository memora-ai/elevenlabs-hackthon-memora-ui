/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@uiw/react-md-editor'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }
    return config;
  },
  images: {
    domains: ['i.pravatar.cc'],
  },
};

module.exports = nextConfig;