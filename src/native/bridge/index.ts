import { WebView } from "../webview";
import { BridgeParams, IMessage } from "../../types/common";
import { uuid } from "../../utils/util";
import { MiniApp } from "../miniapp";
import { JSCore } from "../jscore";


export class Bridge {
    id: string;
    webview: WebView | null = null;
    jscore: JSCore;
    parent: MiniApp | null = null;
    opts: BridgeParams;

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
}