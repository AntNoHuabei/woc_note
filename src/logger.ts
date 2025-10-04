import { trace, info, error, attachConsole } from "@tauri-apps/plugin-log";

// 启用 TargetKind::Webview 后，这个函数将把日志打印到浏览器控制台
const detach = await attachConsole();

export { trace, info, error, detach };
