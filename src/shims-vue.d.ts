declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue-youtube' {
  import type { PluginInstallFunction } from 'vue'
  export default { install: PluginInstallFunction }
}