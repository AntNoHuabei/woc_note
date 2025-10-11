use serde::Serialize;
use tauri::{Emitter, Manager, Url, WebviewUrl, WebviewWindowBuilder};

#[derive(Clone, Serialize)]
struct PingCodeAccessTokenResponse {
    access_token: String,
    token_type: String,
    expires_in: u64,
    refresh_token: String,
}

#[tauri::command]
pub fn open_pingcode_login_window(
    client_id: String,
    client_secret: String,
    redirect_uri: String,
    app: tauri::AppHandle,
    main_window: tauri::WebviewWindow,
) -> Result<(), String> {
    // 构建PingCode授权URL

    
    let pingcode_login_url = format!(
        "https://open.pingcode.com/oauth2/authorize?response_type=code&client_id={}", client_id
    );
    
    println!("pingcode login url: {}", pingcode_login_url);
    let handle = app.clone();
    let handle1 = app.clone();
    let handle_emitter = app.clone();
    let stored_client_secret = client_secret.clone();
    let stored_redirect_uri = redirect_uri.clone();
    
    std::thread::spawn(move || {
        let win_builder = WebviewWindowBuilder::new(
            &handle,
            "pingcode_login",
            WebviewUrl::External(Url::parse(pingcode_login_url.as_str()).unwrap()),
        )
        .parent(&main_window)
        .unwrap()
        .title("PingCode 登录")
        .on_navigation(move |url| {
            if url.to_string().starts_with(&stored_redirect_uri) {
                let code = url
                    .query_pairs()
                    .find(|(k, _)| k == "code")
                    .map(|(_, v)| v.into_owned())
                    .unwrap_or_default();
                 
                if !code.is_empty() {
                    // 构建获取令牌的URL
                    let access_token_url = format!(
                        "https://open.pingcode.com/v1/auth/token?grant_type=authorization_code&client_id={}&client_secret={}&code={}",
                        client_id,
                        stored_client_secret,
                        code
                    );

                    // 发送GET请求到PingCode以获取访问令牌
                    let response = reqwest::blocking::Client::new()
                        .get(&access_token_url)
                        .header("Content-Type", "application/json")
                        .send()
                        .unwrap();

                    let body = response.text().unwrap();
                    println!("access token response: {}", body);

                    // 解析JSON响应以获取访问令牌
                    let json: serde_json::Value = serde_json::from_str(&body).unwrap();
                    let access_token = json["access_token"].as_str().unwrap_or("").to_string();
                    let token_type = json["token_type"].as_str().unwrap_or("Bearer").to_string();
                    let expires_in = json["expires_in"].as_u64().unwrap_or(0);
                    let refresh_token = json["refresh_token"].as_str().unwrap_or("").to_string();
                 
                    // 构建PingCodeAccessTokenResponse结构体
                    let response = PingCodeAccessTokenResponse {
                        access_token,
                        token_type,
                        expires_in,
                        refresh_token,
                    };

                    handle_emitter.emit("pingcode-access-token", response).unwrap();
                }

                // 关闭登录窗口
                if let Some(window) = handle1.get_webview_window("pingcode_login") {
                    let _ = window.close();
                }
            }

            return true;
        })
        .inner_size(800.0, 600.0);

        let window = win_builder.build().unwrap();
    });

    Ok(())
}

#[tauri::command]
pub async fn refresh_pingcode_token(
    refresh_token: String,

) -> Result<String, String> {
    match reqwest::blocking::Client::new()
        .get(format!(
            "https://open.pingcode.com/v1/auth/token?grant_type=refresh_token&refresh_token={}",
            refresh_token
        ))
        .header("Content-Type", "application/json")
        .send() {
        Ok(response) => {
            if !response.status().is_success() {
                return Err(format!("刷新令牌失败: {} {}", 
                    response.status(), response.text().unwrap_or_default()));
            }
            Ok(response.text().unwrap())
        },
        Err(e) => Err(e.to_string())
    }
}