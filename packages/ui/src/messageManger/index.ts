/**
 * messageManager class
 * ui层消息处理
 * 
 * - message: Message 通信对象
 * - init(): void 消息监听注册
 */
import message, { type Messgae } from '../message';
import loader from '@/loader';
import runtimeManager from '@/runtimeManager';

class messageManager {
  message: Messgae;

  constructor() {
    (window as any).message = message;
    this.message = message;
  }

  init() {
    // 1. bridge 层通知 ui 线程加载小程序页面资源
    this.message.receive('loadResource', this.loadResource.bind(this));
    // 2. 逻辑线程准备好数据之后，发送给ui线程渲染页面
    this.message.receive('setInitialData', this.setInitialData.bind(this));
    // 3. 逻辑线程调用 `setData` 更新数据后，通知ui线程重新渲染
    this.message.receive('updateModule', this.updateModule.bind(this));
  }

  private loadResource(data: { appId: any; pagePath: any; }) {
    const { appId, pagePath } = data;
    loader.loadResources({ appId, pagePath }).then(() => {
      this.message.send({
        type: 'uiResourceLoaded',
        body: {}
      })
    });
  }

  private setInitialData(data: { bridgeId: any; pagePath: any; initialData: any; }) {
    const { bridgeId, pagePath, initialData } = data;
    // 初始话数据有了之后就可以开始渲染页面了
    loader.setInitialData(initialData)
    runtimeManager.startRender({
      pagePath,
      bridgeId
    });
  }

  updateModule(data: any) {
    runtimeManager.updateModule(data);
  }
}

export default new messageManager(); 