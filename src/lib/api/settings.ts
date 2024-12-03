import { z } from 'zod';

export const SettingsSchema = z.object({
  logoUrl: z.string().nullable(),
});

export type Settings = z.infer<typeof SettingsSchema>;

const SETTINGS_KEY = 'settings';

export async function getSettings(): Promise<Settings> {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    return { logoUrl: null };
  }
  return JSON.parse(stored);
}

export async function uploadLogo(logoUrl: string | null): Promise<void> {
  const settings = await getSettings();
  settings.logoUrl = logoUrl;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
