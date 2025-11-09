export type EnvVars = {
  readonly CLERK_SECRET_KEY: string;
  readonly CLERK_PUBLISHABLE_KEY: string;
  readonly ALLOWED_ORIGINS?: string;
  readonly APP_DOMAIN?: string;
};

declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        readonly NODE_ENV?: string;
        readonly PORT?: string;
        readonly DATABASE_URL?: string;
      }
    }
  }
}
