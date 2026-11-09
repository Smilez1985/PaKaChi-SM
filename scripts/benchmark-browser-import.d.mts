import type {Browser} from 'playwright';
export interface BrowserImportSample {
 projectSha256:string;projectBytes:number;fileReadMs:number;readyMs:number;firstDrawMs:number;frameBoundaryMs:number;
 drawCalls:number;imageBitmapsDecoded:number;canvas:{width:number;height:number};webglVersion:string;renderer:string;studioCounts:Record<string,number>;
}
export function parseBrowserImportArgs(args:string[]):{runs:number;transfers:number;renderer:'software'|'default';project?:string};
export function measureBrowserProject(browser:Browser,options:{url:string;project:string;timeout?:number;screenshot?:string}):Promise<BrowserImportSample>;
