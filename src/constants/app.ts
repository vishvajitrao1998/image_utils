import Constants from 'expo-constants';

export const SUPPORT_EMAIL = 'support@yourdomain.com'; // TODO: put your real contact email here
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const androidPackage = Constants.expoConfig?.android?.package;
export const STORE_URL = androidPackage
  ? `https://play.google.com/store/apps/details?id=${androidPackage}`
  : null;