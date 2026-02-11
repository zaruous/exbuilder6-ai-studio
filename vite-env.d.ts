// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Augment the global NodeJS namespace to include API_KEY in ProcessEnv.
// This avoids the "Cannot redeclare block-scoped variable 'process'" error
// by merging with the existing type definition instead of redeclaring the variable.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
