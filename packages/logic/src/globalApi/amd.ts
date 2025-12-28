const defineCache: Record<string, any> = {};  // 缓存已定义的模块
const requireCache: Record<string, any> = {}; // 缓存已加载的模块
const loadingModules: Record<string, any> = {};



export function modDefine(id:string,factory:any){
    if(!defineCache[id]){
        const modules = {
            id,
            factory,
            dependencies: {},
        }
        defineCache[id] = modules;
    }
}



//加载模块
/**
 * 模块加载函数，用于加载和缓存指定ID的模块
 * @param id - 模块的唯一标识符
 * @returns 返回模块的exports对象
 */
export function modRequire(id:string){
    // 检查模块是否正在加载中，避免循环依赖
    if(loadingModules[id]){
        return {};
    }

    // 如果模块未被缓存，则执行模块加载逻辑
    if(!requireCache[id]){
        const mod = defineCache[id];
        // 验证模块定义是否存在
        if(!mod){
            throw new Error(`模块${id}不存在`); 
        }
        // 创建模块容器对象
        const modules = {
            exports: {},
        };

        // 标记模块为正在加载状态
        loadingModules[id] = true;
        // 准备模块工厂函数的参数
        const factoryArgs = [modRequire, modules.exports, modules];
        // 执行模块工厂函数
        mod.factory.apply(null, factoryArgs);
        // 将模块导出缓存到requireCache中
        requireCache[id] = modules.exports;
        // 移除加载中的标记
        delete loadingModules[id];
    }
    return requireCache[id].exports;
}