/**
 * ui线程资源加载器
 */
import { UIPageModuleInfo } from '@/types/comon';
import { PageModule } from './pageModule';

interface LoaderResourceOpts {
  appId: string;
  pagePath: string;
}

class Loader {
  staticModules: Record<string, PageModule> = {};

  // 加载小程序页面资源
  loadResources(opts: LoaderResourceOpts) {
    const { appId, pagePath } = opts;
    // 拼接模版资源loader路径
    const viewResourcePath = `http://localhost:1420/${appId}/view.js`;
    const styleResourcePath = `http://localhost:1420/${appId}/style.css`;
    
    return Promise.all([
      this.loadStyleFile(styleResourcePath),
      this.loadScriptFile(viewResourcePath)
    ]).then(() => {
      // 使用类型断言确保类型安全
      if (window.modRequire) {
        window.modRequire(pagePath);
      } else {
        console.warn('modRequire function is not available');
      }
    });
  }

  loadStyleFile(path: string) {
    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = "stylesheet";
      link.href = path;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load style: ${path}`));
    
      document.head.appendChild(link); // 改为添加到head
    })
  }

  loadScriptFile(path: string) {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = path;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${path}`));
    
      document.head.appendChild(script); // 改为添加到head
    })
  }

  // 创建小程序页面 PageModule 模块
  createPageModule(moduleInfo: UIPageModuleInfo) {
    const pageModule = new PageModule(moduleInfo);
    const { path } = moduleInfo;
    this.staticModules[path] = pageModule;
  }

  // 设置渲染数据
  setInitialData(initialData: Record<string, any>) {
    for (const [path, data] of Object.entries(initialData)) {
      const pageModule = this.staticModules[path];
      if (!pageModule) {
        continue;
      }
      pageModule.setInitialData(data);
    }
  }

  // 获取指定路径下的module
  getModuleByPath(path: string) {
    return this.staticModules[path];
  }
}

export default new Loader();