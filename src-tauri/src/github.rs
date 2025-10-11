use serde::Serialize;
use tauri::{Emitter, Manager, Url, WebviewUrl, WebviewWindowBuilder};

#[derive(Clone, Serialize)]
struct GithubAccessTokenResponse {
    access_token: String,
    expires_in: u64,
    token_type: String,
    scope: String,
    refresh_token: String,
    refresh_token_expires_in: u64,
}

#[tauri::command]
pub fn open_github_login_window(
    client_id: String,
    client_secret: String,
    redirect_uri: String,
    app: tauri::AppHandle,
    main_window: tauri::WebviewWindow,
) -> Result<(), String> {
    // 在实际项目中，您需要替换为您的GitHub OAuth应用程序的客户端ID和重定向URL
    //let client_id = "Iv23lizAciH3IuHmSQDn";
    //let client_secret = "9c53bf2e5e8f9326653e185f07af340607c39276";
    //let redirect_uri = "tauri://callback.wocnote.com";
    let scope = "user";

    let github_login_url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope={}",
        client_id, redirect_uri, scope
    );
    println!("github login url: {}", github_login_url);
    let handle = app.clone();
    let handle_emitter = app.clone();
    std::thread::spawn(move || {
        let win_builder = WebviewWindowBuilder::new(
            &handle,
            "github_login",
            WebviewUrl::External(Url::parse(github_login_url.as_str()).unwrap()),
        )
        .parent(&main_window)
        .unwrap()
        .title("GitHub 登录")
        .on_navigation(move |url| {
            if url.to_string().starts_with(&redirect_uri) {
                let code = url
                    .query_pairs()
                    .find(|(k, _)| k == "code")
                    .map(|(_, v)| v.into_owned())
                    .unwrap();
                

                    
                let access_token_url = format!(
                    "https://github.com/login/oauth/access_token?client_id={}&client_secret={}&code={}&redirect_uri={}",
                    client_id, client_secret, code, redirect_uri
                );

                // 发送POST请求到GitHub以获取访问令牌
                let response = reqwest::blocking::Client::new()
                    .post(&access_token_url)
                    .header("Accept", "application/json")
                    .send()
                    .unwrap();

                let body = response.text().unwrap();
                println!("access token response: {}", body);

                // 解析JSON响应以获取访问令牌
                let json: serde_json::Value = serde_json::from_str(&body).unwrap();
                let access_token = json["access_token"].as_str().unwrap().to_string();
                let expires_in = json["expires_in"].as_u64().unwrap();
                let token_type = json["token_type"].as_str().unwrap().to_string();
                let scope = json["scope"].as_str().unwrap().to_string();
                let refresh_token = json["refresh_token"].as_str().unwrap().to_string();
                let refresh_token_expires_in = json["refresh_token_expires_in"].as_u64().unwrap();
            

                // 构建GithubAccessTokenResponse结构体
                let response = GithubAccessTokenResponse {
                    access_token,
                    expires_in,
                    token_type,
                    scope,
                    refresh_token,
                    refresh_token_expires_in,
                };

                handle_emitter.emit("github-access-token", response).unwrap();


                // 调用前端JavaScript函数，将访问令牌传递给它
                //let _ = main_window.eval(&format!("githubAccessToken({});", serde_json::to_string(&response).unwrap()));
                // 关闭登录窗口
                //let _ = window.close();

              match app.get_webview_window("github_login") {
                  Some(window) => {
                      let _ = window.close();
                  }
                  None => {
                      println!("github_login window not found");
                  }
              }
            }

            return true;
        })
        .inner_size(800.0, 600.0);

        let window = win_builder.build().unwrap();
    });

    Ok(())
}

// 处理GitHub OAuth回调
#[tauri::command]
pub async fn handle_github_oauth_callback(code: String) -> Result<String, String> {
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
