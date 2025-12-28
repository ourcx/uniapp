import loader from '@/loader';
import { UIPageModuleInfo } from '@/types/comon';
import { modDefine, modRequire } from 'shared';

class GlobalApi {
  init() {
    // 创建一个JSBridge对象，里面会添加通信相关的API
    (window as any).JSBridge = {};
    window.modDefine = modDefine;
    window.modRequire = modRequire;
    window.Page = (moduleInfo: UIPageModuleInfo) => {
      loader.createPageModule(moduleInfo);
    }
  }
}

export default new GlobalApi();