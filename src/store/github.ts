import { defineStore } from "pinia";
import { ref } from "vue";
import { listen } from "@tauri-apps/api/event";
import { Octokit } from "octokit";

// GitHub Token 接口定义
export interface GithubToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
  refresh_token_expires_in: number;
  // 添加获取令牌的时间戳，用于计算过期时间
  timestamp: number;
}

// 在文件顶部的接口定义部分添加配置接口
export interface GithubConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

// 缓存过期时间（10分钟）
const CACHE_EXPIRY_TIME = 10 * 60 * 1000;

// 已订阅仓库接口
export interface SubscribedRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
}

export const useGithubStore = defineStore("github", () => {
  // 响应式状态
  const token = ref<GithubToken | null>(null);
  const isAuthenticated = ref(false);
  const refreshTimer = ref<number | null>(null);

  // 缓存相关状态
  const reposCache = ref<any[]>([]);
  const reposCacheTimestamp = ref<number>(0);
  const userCache = ref<any>(null);
  const userCacheTimestamp = ref<number>(0);
  // 添加 issues 缓存状态
  const issuesCache = ref<any[]>([]);
  const issuesCacheTimestamp = ref<number>(0);

  // 已订阅仓库状态
  const subscribedRepos = ref<SubscribedRepo[]>([]);

  // 初始化监听 GitHub access token 事件
  const initializeEventListeners = () => {
    // 监听 GitHub access token 事件
    listen("github-access-token", (event) => {
      const tokenData: Omit<GithubToken, "timestamp"> = event.payload as any;
      setToken(tokenData);
    });
  };

  // 初始化已订阅仓库
  const initializeSubscribedRepos = () => {
    const storedSubscribed = localStorage.getItem("github_subscribed_repos");
    if (storedSubscribed) {
      try {
        subscribedRepos.value = JSON.parse(storedSubscribed);
        console.log("已订阅仓库列表已从本地存储加载");
      } catch (error) {
        console.error("解析已订阅仓库列表失败:", error);
        subscribedRepos.value = [];
      }
    }
  };

  // 设置令牌
  const setToken = (tokenData: Omit<GithubToken, "timestamp">) => {
    // 添加获取令牌的时间戳
    const newToken: GithubToken = {
      ...tokenData,
      timestamp: Date.now(),
    };

    token.value = newToken;
    isAuthenticated.value = true;

    // 存储到本地存储
    localStorage.setItem("github_token", JSON.stringify(newToken));

    // 设置定时刷新
    setupTokenRefresh();

    // 初始化已订阅仓库
    initializeSubscribedRepos();

    // 清除缓存，因为新令牌可能有权限访问不同的数据
    clearCache();

    console.log("GitHub 令牌已设置");
  };

  // 从本地存储加载令牌
  const loadTokenFromStorage = () => {
    const storedToken = localStorage.getItem("github_token");
    if (storedToken) {
      try {
        const parsedToken: GithubToken = JSON.parse(storedToken);
        token.value = parsedToken;

        // 检查令牌是否已过期
        if (!isTokenExpired()) {
          isAuthenticated.value = true;
          setupTokenRefresh();
          // 初始化已订阅仓库
          initializeSubscribedRepos();
          console.log("GitHub 令牌已从本地存储加载");
        } else {
          // 令牌已过期，尝试刷新
          refreshToken();
        }
      } catch (error) {
        console.error("解析 GitHub 令牌失败:", error);
        clearToken();
      }
    }
  };

  // 检查令牌是否过期
  const isTokenExpired = (): boolean => {
    if (!token.value) {
      return true;
    }

    // 计算令牌创建时间加上有效期（提前1分钟刷新）
    const tokenExpiryTime =
      token.value.timestamp + (token.value.expires_in - 60) * 1000;
    const currentTime = Date.now();

    return currentTime > tokenExpiryTime;
  };

  // 设置令牌刷新定时器
  const setupTokenRefresh = () => {
    // 清除之前的定时器
    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value);
    }

    if (!token.value) {
      return;
    }

    // 计算刷新时间（提前1分钟）
    const refreshTime = (token.value.expires_in - 60) * 1000;

    // 设置新的定时器
    refreshTimer.value = window.setTimeout(() => {
      refreshToken();
    }, refreshTime);

    console.log(
      `GitHub 令牌将在 ${Math.floor(refreshTime / 60000)} 分钟后刷新`
    );
  };

  // 在 store 定义中添加配置状态
  const config = ref<GithubConfig | null>(null);

  // 添加获取配置的方法
  const getConfig = (): GithubConfig | null => {
    return config.value;
  };

  // 添加设置配置的方法
  const setConfig = (newConfig: GithubConfig): void => {
    config.value = newConfig;
    // 存储到本地存储
    localStorage.setItem("github_config", JSON.stringify(newConfig));
    console.log("GitHub 配置已设置");
  };

  // 添加从本地存储加载配置的方法
  const loadConfigFromStorage = (): void => {
    const storedConfig = localStorage.getItem("github_config");
    if (storedConfig) {
      try {
        config.value = JSON.parse(storedConfig);
        console.log("GitHub 配置已从本地存储加载");
      } catch (error) {
        console.error("解析 GitHub 配置失败:", error);
        config.value = null;
      }
    }
  };

  // 修改 refreshToken 方法，使用存储的配置
  const refreshToken = async () => {
    if (!token.value || !token.value.refresh_token || !config.value) {
      console.error("没有可用的刷新令牌或配置");
      clearToken();
      return;
    }

    try {
      console.log("正在刷新 GitHub 令牌...");

      const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: config.value.client_id,
            client_secret: config.value.client_secret,
            grant_type: "refresh_token",
            refresh_token: token.value.refresh_token,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("刷新令牌失败");
      }

      const refreshedTokenData = await response.json();
      setToken(refreshedTokenData);
      console.log("GitHub 令牌刷新成功");
    } catch (error) {
      console.error("刷新 GitHub 令牌失败:", error);
      clearToken();
    }
  };

  // 清除令牌
  const clearToken = () => {
    token.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem("github_token");

    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value);
      refreshTimer.value = null;
    }

    // 清除缓存
    clearCache();

    console.log("GitHub 令牌已清除");
  };

  // 清除缓存
  const clearCache = () => {
    reposCache.value = [];
    reposCacheTimestamp.value = 0;
    userCache.value = null;
    userCacheTimestamp.value = 0;
    // 清除 issues 缓存
    issuesCache.value = [];
    issuesCacheTimestamp.value = 0;
    console.log("GitHub 缓存已清除");
  };

  // 检查缓存是否有效
  const isCacheValid = (cacheTimestamp: number): boolean => {
    const currentTime = Date.now();
    return currentTime - cacheTimestamp < CACHE_EXPIRY_TIME;
  };

  // 获取授权头部
  const getAuthorizationHeader = (): Record<string, string> => {
    if (!token.value || isTokenExpired()) {
      return {};
    }

    return {
      Authorization: `${token.value.token_type} ${token.value.access_token}`,
    };
  };

  // 初始化 store
  const initialize = () => {
    initializeEventListeners();
    loadTokenFromStorage();
    loadConfigFromStorage();
  };

  // 获取仓库列表（带缓存）
  const getRepos = async () => {
    if (!token.value || isTokenExpired()) {
      return [];
    }

    // 检查缓存是否有效
    if (
      reposCache.value.length > 0 &&
      isCacheValid(reposCacheTimestamp.value)
    ) {
      console.log("使用缓存的 GitHub 仓库列表");
      return reposCache.value;
    }

    try {
      const octokit = new Octokit({
        auth: token.value.access_token,
      });

      const repos = await octokit.rest.repos.listForAuthenticatedUser({
        type: "all",
      });

      // 更新缓存
      reposCache.value = repos.data;
      reposCacheTimestamp.value = Date.now();
      console.log("获取并缓存 GitHub 仓库列表");

      return repos.data;
    } catch (error) {
      console.error("获取 GitHub 仓库列表失败:", error);
      // 如果有缓存，返回缓存的数据
      if (reposCache.value.length > 0) {
        console.log("获取失败，使用缓存的 GitHub 仓库列表");
        return reposCache.value;
      }
      return [];
    }
  };

  // 获取用户信息（带缓存）
  const getUser = async () => {
    if (!token.value || isTokenExpired()) {
      return null;
    }

    // 检查缓存是否有效
    if (userCache.value && isCacheValid(userCacheTimestamp.value)) {
      console.log("使用缓存的 GitHub 用户信息");
      return userCache.value;
    }

    try {
      const octokit = new Octokit({
        auth: token.value.access_token,
      });

      const user = await octokit.rest.users.getAuthenticated();

      // 更新缓存
      userCache.value = user.data;
      userCacheTimestamp.value = Date.now();
      console.log("获取并缓存 GitHub 用户信息");

      return user.data;
    } catch (error) {
      console.error("获取 GitHub 用户信息失败:", error);
      // 如果有缓存，返回缓存的数据
      if (userCache.value) {
        console.log("获取失败，使用缓存的 GitHub 用户信息");
        return userCache.value;
      }
      return null;
    }
  };

  // 获取已订阅的仓库列表
  const getSubscribedRepos = (): SubscribedRepo[] => {
    console.log("获取已订阅的仓库列表");
    return subscribedRepos.value;
  };

  // 订阅仓库
  const subscribeRepo = (repo: any): void => {
    // 检查仓库是否已订阅
    const isAlreadySubscribed = subscribedRepos.value.some(
      (r) => r.id === repo.id
    );
    if (!isAlreadySubscribed) {
      // 构造订阅仓库对象
      const subscribedRepo: SubscribedRepo = {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
      };

      // 添加到已订阅列表
      subscribedRepos.value.push(subscribedRepo);

      // 保存到本地存储
      localStorage.setItem(
        "github_subscribed_repos",
        JSON.stringify(subscribedRepos.value)
      );
      console.log(`已订阅仓库: ${repo.full_name}`);

      // 清除 issues 缓存，因为订阅仓库变化了
      issuesCache.value = [];
      issuesCacheTimestamp.value = 0;
      console.log("Issues 缓存已清除（仓库订阅发生变化）");
    }
  };

  // 取消订阅仓库
  const unsubscribeRepo = (repoId: number): void => {
    // 从已订阅列表中移除
    subscribedRepos.value = subscribedRepos.value.filter(
      (repo) => repo.id !== repoId
    );

    // 保存到本地存储
    localStorage.setItem(
      "github_subscribed_repos",
      JSON.stringify(subscribedRepos.value)
    );
    console.log(`已取消订阅仓库 ID: ${repoId}`);

    // 清除 issues 缓存，因为订阅仓库变化了
    issuesCache.value = [];
    issuesCacheTimestamp.value = 0;
    console.log("Issues 缓存已清除（仓库订阅发生变化）");
  };

  // 检查仓库是否已订阅
  const isRepoSubscribed = (repoId: number): boolean => {
    return subscribedRepos.value.some((repo) => repo.id === repoId);
  };

  // 获取所有 Issue 并按已订阅仓库过滤
  const getAllIssues = async () => {
    if (!token.value || isTokenExpired()) {
      return [];
    }

    // 检查缓存是否有效
    if (
      issuesCache.value.length > 0 &&
      isCacheValid(issuesCacheTimestamp.value)
    ) {
      console.log("使用缓存的 GitHub Issues 列表");
      return issuesCache.value;
    }

    try {
      const octokit = new Octokit({
        auth: token.value.access_token,
      });

      // 获取所有 issues
      const issues = await octokit.rest.issues.list({
        state: "all",
        //per_page: 100, // 获取更多 issues
      });

      // 获取已订阅仓库的 full_name 列表
      const subscribedRepoNames = subscribedRepos.value.map(
        (repo) => repo.full_name
      );

      // 如果没有订阅任何仓库，返回空数组
      if (subscribedRepoNames.length === 0) {
        console.log("未订阅任何仓库，返回空 Issue 列表");
        return [];
      }

      // 过滤出属于已订阅仓库的 issues
      const filteredIssues = issues.data.filter((issue) => {
        // 从 issue.url 中提取仓库 full_name
        // GitHub API 返回的 issue.url 格式通常是 https://api.github.com/repos/{owner}/{repo}/issues/{number}
        const urlParts = issue.url.split("/");
        // 找到 'repos' 索引，然后获取后面的两个部分作为 full_name
        const reposIndex = urlParts.indexOf("repos");
        if (reposIndex !== -1 && reposIndex + 2 < urlParts.length) {
          const repoFullName = `${urlParts[reposIndex + 1]}/${
            urlParts[reposIndex + 2]
          }`;
          return subscribedRepoNames.includes(repoFullName);
        }
        return false;
      });

      // 更新缓存
      issuesCache.value = filteredIssues;
      issuesCacheTimestamp.value = Date.now();
      console.log(
        `已获取并缓存 ${filteredIssues.length} 个属于已订阅仓库的 Issue`
      );

      return filteredIssues;
    } catch (error) {
      console.error("获取 GitHub 所有 Issue 失败:", error);
      // 如果有缓存，返回缓存的数据
      if (issuesCache.value.length > 0) {
        console.log("获取失败，使用缓存的 GitHub Issues 列表");
        return issuesCache.value;
      }
      return [];
    }
  };

  return {
    // 状态
    token,
    isAuthenticated,
    subscribedRepos,

    // 缓存状态（可选暴露给外部）
    reposCache,
    userCache,
    issuesCache, // 暴露 issues 缓存

    // 方法
    setToken,
    loadTokenFromStorage,
    isTokenExpired,
    refreshToken,
    clearToken,
    clearCache, // 暴露清除缓存的方法
    getAuthorizationHeader,
    initialize,
    getRepos,
    getUser,
    getSubscribedRepos,
    subscribeRepo,
    unsubscribeRepo,
    isRepoSubscribed,
    getAllIssues,
    getConfig,
    setConfig,
  };
});
