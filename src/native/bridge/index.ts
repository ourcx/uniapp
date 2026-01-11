import { WebView } from "../webview";
import { BridgeParams, IMessage } from "../../types/common";
import { uuid } from "../../utils/util";
import { MiniApp } from "../miniapp";
import { JSCore } from "../jscore";
import { app } from "@tauri-apps/api";




export class Bridge {
    id: string;
    webview: WebView | null = null;
    jscore: JSCore;
    parent: MiniApp | null = null;
    opts: BridgeParams;
    status: number = 0;


    constructor(opts: BridgeParams) {
        this.id = `bridge_${uuid()}`;
        this.opts = opts;
        // 一个小程序公用一个 jscore，所以这个由外部小程序实例类传入
        this.jscore = opts.jscore;
        this.jscore.addEventListener('message', this.jscoreMessageHandler.bind(this));
    }

    jscoreMessageHandler(message: IMessage) {
        console.log('接收到来自于逻辑线程的消息: ', message);
        const { type, body } = message;
        // 判断 bridgeId 是否对应
        if (body.bridgeId !== this.id) return;
        switch (type) {
            case 'logicResourceLoaded':
                this.status++;
                this.createApp(); // 逻辑线程和UI准备好之后就可以开始创建App了
                break;
            case 'appIsCreated':
                this.status++;
                this.notifyMakeInitialData(); // 通知逻辑线程初始化小程序渲染数据
                break;
            case 'initialDataReady':
                this.status++;
                this.setInitialData(body); // 把逻辑线程的初始化数据设置给UI线程，UI线程开始渲染页面
                break;
            case 'updateModule':
                this.updateModule(body); // 逻辑线程调用setData 更新数据，通知UI渲染
        }
    }

    uiMessageHandler(message: IMessage) {
        console.log('接收到来自UI线程的消息: ', message);
        const { type, body } = message;
        switch (type) {
            case 'uiResourceLoaded':
                this.status++;
                this.createApp();
                break;
            case 'moduleCreated':
                this.uiInstanceCreated(body);
                break;
            case 'moduleMounted':
                this.uiInstanceMounted(body);
                break;
            case 'pageScroll':
                this.pageScroll(body);
                break;
            case 'triggerEvent':
                this.triggerEvent(body);
                break;
        }
    }


    async init() {
        this.webview = await this.createWebview();
        this.webview.addEventListener('message', this.uiMessageHandler.bind(this));
    }

    //创建当前bridge关联的webview进程
    async createWebview() {
        return new Promise<WebView>((resolve) => {
            const webview = new WebView({
                configInfo: this.opts.configInfo,
                isRoot: this.opts.isRoot,
            });
            webview.parent = this;
            webview.init(() => {
                resolve(webview);
            });
            // 将webview添加到miniApp的webview容器节点中
            this.parent?.webviewContainer?.appendChild(webview.el);
        });

    }
    //通知逻辑线程和UI线程加载小程序资源
    start(loadLogicSource = true) {
        //通知ui线程
        this.webview?.postMessage({
            type: 'loadResource',
            body: {
                appId: this.opts.appId,
                pagePath: this.opts.pagePath,
            }
        })
        if (loadLogicSource) {
            this.jscore.postMessage({
                //初始化触发一次小程序逻辑资源加载
                type: 'loadResource',
                body: {
                    appId: this.opts.appId,
                    pages: this.opts.pages,
                    bridgeId: this.id
                }
            })
        } else {
            this.status++
            //一个小程序的逻辑线程worker是公用的，在初次启动后，后面就可以不用再继续加载了。
        }
    }

    //通知逻辑线程创建小程序实例
    createApp() {
        if (this.status !== 2) return;
        this.jscore.postMessage({
            type: 'createApp',
            body: {
                bridgeId: this.id,
                scene: this.opts.scene,
                query: this.opts.query,
                pagePath: this.opts.pagePath
            }
        })
    }

    //通知逻辑线程初始化渲染函数
    notifyMakeInitialData() {
        this.jscore.postMessage({
            type: 'makeInitialData',
            body: {
                bridgeId: this.id,
                pagePath: this.opts.pagePath
            }
        })
    }
    //将逻辑线程初始化好多渲染函数发给ui线程
    setInitialData(data: any) {
        const { initialData } = data;
        this.webview?.postMessage({
            type: 'setInitialData',
            body: {
                initialData,
                bridgeId: this.id,
                pagePath: this.opts.pagePath
            }
        })
    }
    //逻辑线程数据更新，通知ui线程重新渲染
    updateModule(payload: any) {
        const { id, data } = payload;
        this.webview?.postMessage({
            type: 'updateModule',
            body: {
                id,
                data
            }
        })
    }


    //ui线程的消息处理
    // ui线程模块创建好，通知逻辑线程可以创建页面实例了
    // 这里后面真实触发的时机回调整为 vue created 状态时执行
    uiInstanceCreated(payload: any) {
        const { path, id } = payload;
        this.jscore.postMessage({
            type: 'createInstance',
            body: {
                id,
                path,
                bridgeId: this.id,
                query: this.opts.query,
            }
        });
    }

}