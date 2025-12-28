import { isFunction } from 'lodash';
import type { AppModuleInfo, AppOpenInfo } from "@/types/common";

/**
 * 小程序 App 运行时实例，一个小程序只会存在一个 App 实例
 */
const LifecycleMethods = ['onLaunch', 'onShow', 'onHide'] as const;
type LifecycleMethod = typeof LifecycleMethods[number];

export class App {
  /**
   * 应用注册信息
   */
  moduleInfo: AppModuleInfo;
  /**
   * 页面打开信息
   */
  openInfo: AppOpenInfo;
  
  // 明确定义生命周期方法属性
  onLaunch?: (...args: any[]) => any;
  onShow?: (...args: any[]) => any;
  onHide?: (...args: any[]) => any;

  constructor(moduleInfo: AppModuleInfo, openInfo: AppOpenInfo) {
    this.moduleInfo = moduleInfo;
    this.openInfo = openInfo;
    this.init();
  } 

  /**
   * 初始化App
   */
  init() {
    this.initLifecycle();
    this.onLaunch?.(this.openInfo);
    this.onShow?.(this.openInfo);
  }

  /**
   * 初始化app生命周期
   */
  initLifecycle() {
    LifecycleMethods.forEach(name => {
      const lifecycle = this.moduleInfo[name];
      if (!isFunction(lifecycle)) {
        return;
      }
      (this as any)[name] = lifecycle!.bind(this);
    })
  }

  /**
   * 触发onShow生命周期
   */
  callShowLifecycle() {
    const { pagePath, query, scene } = this.openInfo;
    const options = {
      scene,
      query,
      path: pagePath,
    };
    this.onShow?.(options); 
  }
}