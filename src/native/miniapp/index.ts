import { BridgeParams } from "../../types/common";
import { OpenMiniAppOpts } from "../../types/type";
import { Application } from "../application";
import { AppManager } from "../appManager";
import { Bridge } from "../bridge";
import { JSCore } from "../jscore";
import { miniAppTpl } from "./tpl";

export class MiniApp {
  /* 小程序appId */
  appId: string;
  /* 小程序App信息 */
  app: OpenMiniAppOpts;
  /* application实例 */
  parent: Application | null = null;
  /* 小程序页面根节点 */
  el: HTMLElement;
  /* 小程序webview的挂载节点 */
  webviewContainer: HTMLElement | null = null;
  jscore: JSCore;
  bridgeList: Bridge[] = [];

  constructor(opts: OpenMiniAppOpts) {
    this.app = opts;
    this.appId = opts.appId;
    // 创建小程序页面的根节点
    this.el = document.createElement('div');
    this.el.classList.add('wx-native-view');
    this.jscore = new JSCore();
  }

  /**
   * 初始化小程序页面 
   * */
  viewDidLoad() {
    // 初始化小程序页面模版
    this.initMiniAppFrame();
    this.webviewContainer = this.el.querySelector('.wx-mini-app__webviews');
    // 显示小程序加载状态信息
    this.showLaunchScreen();
    // 绑定小程序关闭事件
    this.bindCloseEvent();
    //小程序初始化
    this.init();
  }

  async init() {
    // 将小程序添加到应用实例的容器节点中
    this.jscore?.init();
    const entryPageBridge = await this.createBridge({
      jscore: this.jscore,
      isRoot: true,
      appId: this.app.appId,
      pagePath: this.app.path,
      pages: [],
      query: this.app.query,
      scene: this.app.scene,
      configInfo: { // 暂时模拟构造一下美团小程序的页面配置参数，后续我们会通过读取小程序的 app.json 文件获取
        "navigationBarBackgroundColor": "#ffd200",
        "navigationBarTextStyle": "black",
        "navigationBarTitleText": "美团",
        "backgroundColor": "#fff",
        "usingComponents": {}
      }
    });
    this.bridgeList.push(entryPageBridge)

    //隐藏小程序加载
    this.hideLaunchScreen();
  }

  async createBridge(opts: BridgeParams) {
    const bridge = new Bridge(opts);
    bridge.parent = this;
    await bridge.init();
    return bridge;
  }

  initMiniAppFrame() {
    this.el.innerHTML = miniAppTpl;
  }

  /**
   * 显示小程序加载状态
   */
  showLaunchScreen() {
    const launchScreen = this.el.querySelector('.wx-mini-app__launch-screen') as HTMLElement;
    const name = this.el.querySelector('.wx-mini-app__name') as HTMLElement;
    const logo = this.el.querySelector('.wx-mini-app__logo-img-url') as HTMLImageElement;

    name.innerHTML = this.app.name;
    logo.src = this.app.logo;
    launchScreen.style.display = 'block';
  }

  /**
   * 隐藏小程序加载状态
   */
  hideLaunchScreen() {
    const startPage = this.el.querySelector('.wx-mini-app__launch-screen') as HTMLElement;
    startPage.style.display = 'none';
  }


  bindCloseEvent() {
    const closeBtn = this.el.querySelector('.wx-mini-app-navigation__actions-close') as HTMLElement;

    closeBtn.onclick = () => {
      AppManager.closeApp(this);
    };
  }
}