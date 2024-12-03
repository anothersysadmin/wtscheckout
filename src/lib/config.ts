import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3000'),
  VITE_JWT_SECRET: z.string(),
  VITE_ADMIN_PASSWORD: z.string(),
  VITE_CHECKOUT_PASSWORD: z.string(),
});

// Validate environment variables
const env = envSchema.parse(import.meta.env);

export const config = {
  apiUrl: env.VITE_API_URL,
  auth: {
    jwtSecret: env.VITE_JWT_SECRET,
    adminPassword: env.VITE_ADMIN_PASSWORD,
    checkoutPassword: env.VITE_CHECKOUT_PASSWORD,
  },
} as const;

export function createApiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  try {
    const baseUrl = new URL(config.apiUrl);
    return new URL(cleanPath, baseUrl).toString();
  } catch (error) {
    console.error('Error creating API URL:', error);
    throw new Error('Invalid API URL configuration');
  }
}
