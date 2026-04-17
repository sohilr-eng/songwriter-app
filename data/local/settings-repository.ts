import * as settingsDb from '@/db/settings';
import type { SettingsRepository } from '@/repositories/contracts';

export const localSettingsRepository: SettingsRepository = {
  get: settingsDb.getSetting,
  set: settingsDb.setSetting,
};
