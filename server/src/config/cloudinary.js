import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

const { cloudName, apiKey, apiSecret } = env.cloudinary;

export const isCloudinaryConfigured = Boolean(
  cloudName && apiKey && apiSecret && !apiKey.startsWith('your_'),
);

if (isCloudinaryConfigured) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

export default cloudinary;
