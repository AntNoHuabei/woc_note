mod github;
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};



#[tauri::command]
fn open_github_login_window(window: tauri::Window) -> Result<(), String> {
    // 在实际项目中，您需要替换为您的GitHub OAuth应用程序的客户端ID和重定向URL
    let client_id = "YOUR_GITHUB_CLIENT_ID";
    let redirect_uri = "http://localhost:3000/callback";
    let scope = "user";
    
    let github_login_url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope={}",
        client_id, redirect_uri, scope
    );
    
    // 打开新窗口进行GitHub登录
    tauri::WindowBuilder::new(
        &window,
        "github_login",
        tauri::WindowUrl::External(github_login_url.parse().unwrap())
    )
    .title("GitHub 登录")
    .width(800.0)
    .height(600.0)
    .center()
    .build()
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

// 处理GitHub OAuth回调
#[tauri::command]
async fn handle_github_oauth_callback(code: String) -> Result<String, String> {
    // 在实际项目中，您需要替换为您的GitHub OAuth应用程序的客户端ID和客户端密钥
    let client_id = "YOUR_GITHUB_CLIENT_ID";
    let client_secret = "YOUR_GITHUB_CLIENT_SECRET";
    
    // 这里应该是向GitHub请求访问令牌的代码
    // 为了演示，我们直接返回一个模拟的令牌
    let access_token = "mock_github_access_token";
    
    // 在实际应用中，您可能还需要使用访问令牌获取用户信息
    // 然后将用户信息返回给前端
    
    Ok(access_token.to_string())
}
