// globalApi/index.ts
import { modDefine, modRequire } from './amd';
import loader from '@/loader';
import type { AppModuleInfo, PageModuleInfo, PageModuleCompileInfo } from '@/types/common';

class GlobalApi {
  init() {
    (globalThis as any).App = (moduleInfo: AppModuleInfo) => {
      loader.createAppModule(moduleInfo);
    }

    (globalThis as any).Page = (moduleInfo: PageModuleInfo, compileInfo: PageModuleCompileInfo) => {
      loader.createPageModule(moduleInfo, compileInfo);
    }

    (globalThis as any).modDefine = modDefine;
    (globalThis as any).modRequire = modRequire; 
  }
}

export default new GlobalApi();