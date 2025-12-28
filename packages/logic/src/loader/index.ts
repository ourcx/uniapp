// loader/index.ts

import { AppModule } from './appModule';
import { PageModule } from './pageModule';
import type { AppModuleInfo, PageModuleInfo, PageModuleCompileInfo } from '@/types/common';

// 扩展 globalThis 类型，添加 Worker 环境特有的方法

declare global {
  interface Window {
    // 避免与浏览器环境冲突
  }
  
  var importScripts: (url: string) => void;
  var modRequire: (id: string) => any;
}

interface LoaderResourceOpts {
  appId: string;
  pages: string[];
}
/**
 * 逻辑线程资源加载器，主要用于管理各个小程序模块的一些配置信息
 * 
 * staticModules: 存储小程序App逻辑代码和页面模块配置数据
 * 
 * - loadResources(opts): void 加载小程序资源
 * - createAppModule(moduleInfo: AppModuleInfo): void 创建小程序App模块
 * - createPageModule(moduleInfo: PageModuleInfo, compileInfo: PageModuleCompileInfo): void 创建小程序页面模块
 * - getInitialDataByPagePath(path: string): any 根据页面路径获取对应页面初始数据
 */
class Loader {
  /** 存储逻辑页面定义的App模块和页面模块信息 */
  staticModules: Record<string, AppModule | PageModule> = {};

  /**
   * 加载小程序逻辑 js 资源并执行
   */
  loadResources(opts: LoaderResourceOpts) {
    const { appId, pages } = opts;
    // 拼接模版资源loader路径
    const logicResourcePath = `${appId}/logic.js`;
    
    // 使用类型断言或直接调用全局函数
    if (typeof importScripts !== 'undefined') {
      importScripts(logicResourcePath);
    } else {
      globalThis.importScripts!(logicResourcePath);
    }
    
    if (typeof modRequire !== 'undefined') {
      modRequire('app'); // 加载小程序App模块
      pages.forEach(pathPath => {
        modRequire(pathPath); // 加载小程序页面模块
      });
    } else {
      (globalThis as any).modRequire('app');
      pages.forEach(pathPath => {
        (globalThis as any).modRequire(pathPath);
      });
    }
  }

  /**
   * 创建小程序 AppModule
   */
  createAppModule(moduleInfo: AppModuleInfo) {
    const appModule = new AppModule(moduleInfo);
    this.staticModules['app'] = appModule;
  }

  /**
   * 创建小程序 PageModule
   */ 
  createPageModule(moduleInfo: PageModuleInfo, compileInfo: PageModuleCompileInfo) {
    const pageModule = new PageModule(moduleInfo, compileInfo);
    const { path } = compileInfo;
    this.staticModules[path] = pageModule;
  }

  /**
   * 根据页面 path 获取当前页面的逻辑数据 data
   */
  getInitialDataByPagePath(path: string) {
    const pageModule = this.staticModules[path] as PageModule;
    return {
      [path]: pageModule.getInitialData(),
    };
  }

  getModuleByPath(path: string) {
    return this.staticModules[path];
  }
}

export default new Loader();