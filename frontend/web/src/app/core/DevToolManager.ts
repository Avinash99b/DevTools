import type { DevTool } from "../types/DevTool";

class DevToolManager {
    tools: DevTool[] = []

    private onToolsUpdateCallback: ()=> void = ()=>{}
    setOnToolsUpdateCallback(onToolsUpdate:()=>void){
        this.onToolsUpdateCallback=onToolsUpdate
    }
    getToolCountByCategoryId(categoryId: string) {
        return this.tools.filter((it) => it.categoryId === categoryId).length
    }

    getToolsByCategoryId(categoryId:string):DevTool[]{
        if(categoryId==="all")return this.tools;
        return this.tools.filter((it)=>it.categoryId===categoryId)
    }
    registerTool(devTool:DevTool){
        this.tools.push(devTool)
        this.onToolsUpdateCallback()
    }
    getToolById(id:string){
        return this.tools.find((it)=>it.id===id);
    }
    getAllTools(){
        return this.tools;
    }
}

const devToolManager = new DevToolManager();
export function registerDevTool(devTool:DevTool){
    //Check if any dev tool already exists with that id
    if(devToolManager.getToolById(devTool.id)){
        throw new Error("Already a tool with that id registered")
    }
    devToolManager.registerTool(devTool)
}

export default devToolManager;