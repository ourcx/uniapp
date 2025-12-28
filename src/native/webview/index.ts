import mitt, { Emitter } from "mitt";
import { IMessage, WebviewParams } from "../../types/common";
import { webviewTpl } from "./tpl";
import { uuid } from "../../utils/util";
import { Bridge } from "../bridge";



/**
 * WebView 原生webview容器
 * id: string 每个webview的唯一id
 * opts: WebviewParams webview配置参数
 * el: HTMLElement webview根元素
 * parent: Bridge | null 所属bridge实例
 * iframe: HTMLIFrameElement webview中的iframe元素
 * event: Emitter<Record<string, any>> 事件emitter实例
 * + init(): Promise<void> 初始化webview
 * + postMessage(message: IMessage): void 向webview发送消息
 * + addEventListener(type: string, listener: (event: any) => void): void 监听webview消息
 * + setInitialStyle(): void 根据配置初始化webview样式
 */
export class WebView {
    id: string;
    opts: WebviewParams;
    el: HTMLElement;
    parent: Bridge | null = null;
    iframe: HTMLIFrameElement;
    event: Emitter<Record<string, any>>;
    constructor(opts: WebviewParams) {
        this.opts = opts;
        // 每个webview的唯一id
        this.id = `webview_${uuid()}`;
        this.el = document.createElement('div');
        this.el.classList.add('wx-native-view');
        this.el.innerHTML = webviewTpl;
        // 根据小程序配置初始化页面信息
        this.setInitialStyle();
        this.iframe = this.el.querySelector('.wx-native-webview__window') as HTMLIFrameElement;
        this.iframe.name = this.id;
        this.event = mitt();
        this.bindBackEvent();
    }

  /**
   * 初始化webview
   */
  async init(callback: () => void) {
    // 等待frame 加载完成
    await this.frameLoaded();
    callback && callback();
  }

  frameLoaded() {
    return new Promise<void>((resolve) => {
      this.iframe.onload = () => {
        resolve();
      }
    });
  }

  // 绑定左上角返回按钮点击事件
  bindBackEvent() {
    const backBtn = this.el.querySelector('.wx-native-webview__navigation-left-btn') as HTMLElement;
    backBtn.onclick = () => {
      console.log('点击返回按钮')
    };
  }
  
  // 向UI线程发送消息通知
  postMessage(message: IMessage) {
    const iframeWindow = (window.frames as any)[this.iframe.name];
    if (iframeWindow) {
      // todo: 发送消息给ui线程
    }
  }

  /**
   * 监听UI渲染线程消息
   */
  addEventListener<T = any>(type: string, listener: (event: T) => void) {
    this.event.on(type, listener);
  }

  setInitialStyle() {
    const config = this.opts.configInfo;
    const webview = this.el.querySelector('.wx-native-webview') as HTMLElement;
    const pageName = this.el.querySelector('.wx-native-webview__navigation-title') as HTMLElement;
    const navigationBar = this.el.querySelector('.wx-native-webview__navigation') as HTMLElement;
    const leftBtn = this.el.querySelector('.wx-native-webview__navigation-left-btn') as HTMLElement;
    const root = this.el.querySelector('.wx-native-webview__root') as HTMLElement;

    // 根页面的时候不显示左侧返回按钮
    if (this.opts.isRoot) {
      leftBtn.style.display = 'none';
    } else {
      leftBtn.style.display = 'block';
    }

    // 设置顶部的文字的颜色类
    if (config.navigationBarTextStyle === 'white') {
        navigationBar.classList.add('wx-native-webview__navigation--white');
    } else {
        navigationBar.classList.add('wx-native-webview__navigation--black');
    }
    
    // 如果声明了自定义 header，则通过css样式隐藏默认的 navigation 元素
    if (config.navigationStyle === 'custom') {
        webview.classList.add('wx-native-webview--custom-nav');
    }

    // 设置页面背景色
    root.style.backgroundColor = config.backgroundColor;
    // 设置导航栏背景色
    navigationBar.style.backgroundColor = config.navigationBarBackgroundColor;
    // 设置标题内容
    pageName.innerText = config.navigationBarTitleText;
  }
}

