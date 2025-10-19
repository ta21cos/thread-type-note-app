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
