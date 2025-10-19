interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_BACKEND_API_ENDPOINT: string;
  readonly VITE_BACKEND_WS_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
