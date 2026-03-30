import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'assets/scss')],
    silenceDeprecations: ['legacy-js-api'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**', pathname: '/**' },
      { protocol: 'http', hostname: '**', pathname: '/**' },
    ],
  },
};

export default nextConfig;
