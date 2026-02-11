/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};
