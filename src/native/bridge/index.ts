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

    jscoreMessageHandler(massage: IMessage) {
        console.log('来自逻辑线程的消息', massage);
    }

    uiMessageHandler(massage: IMessage) {
        console.log('来自UI线程的消息', massage);
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
    start(loadLogicSource = true){
        //通知ui线程
        this.webview?.postMessage({
            type: 'loadResource',
            body:{
                appId: this.opts.appId,
                pagePath: this.opts.pagePath,
            }
        })
        if(loadLogicSource){
            this.jscore.postMessage({
                //初始化触发一次小程序逻辑资源加载
                type: 'loadResource',
                body:{
                    appId: this.opts.appId,
                    pages: this.opts.pages,
                    bridgeId: this.id
                }
            })
        }else{
            this.status++
            //一个小程序的逻辑线程worker是公用的，在初次启动后，后面就可以不用再继续加载了。
        }
    }

}