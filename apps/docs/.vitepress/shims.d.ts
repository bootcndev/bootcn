// Lets tsc (which does not read .vue files) type the theme's imports.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}
