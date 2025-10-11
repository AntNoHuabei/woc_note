import { defineStore } from "pinia";
import { ref } from "vue";
import { fetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";
// PingCode Token 接口定义
export interface PingCodeToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  // 添加获取令牌的时间戳，用于计算过期时间
  timestamp: number;
}

// PingCode 客户端凭据接口
export interface PingCodeCredentials {
  client_id: string;
  client_secret: string;
}

// 缓存过期时间（10分钟）
const CACHE_EXPIRY_TIME = 10 * 60 * 1000;

// 旧版 PingCode 项目接口（用于向后兼容）

// 新版 PingCode 项目接口
export interface PingCodeProject {
  id: string;
  url: string;
  identifier: string;
  name: string;
  type: string;
  assignee?: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  scope_type: string;
  scope_id: string;
  visibility: string;
  state: {
    id: string;
    url: string;
    name: string;
    type: string;
  };
  start_at: number;
  end_at: number;
  color: string;
  description?: string;
  properties: Record<string, string>;
  members: Array<{
    id: string;
    url: string;
    type: string;
    user?: {
      id: string;
      url: string;
      name: string;
      display_name: string;
      avatar: string;
    };
  }>;
  created_at: number;
  created_by: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  updated_at: number;
  updated_by: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  is_archived: number;
  is_deleted: number;
}

// 项目列表响应接口
export interface PingCodeProjectsResponse {
  page_size: number;
  page_index: number;
  total: number;
  values: PingCodeProject[];
}
// 工作项列表响应接口
export interface PingCodeWorkItemsResponse {
  page_size: number;
  page_index: number;
  total: number;
  values: PingCodeWorkItem[];
}
// 更新PingCode工作项接口
export interface PingCodeWorkItem {
  id: string;
  url: string;
  project: {
    id: string;
    url: string;
    identifier: string;
    name: string;
    type: string;
    is_archived: number;
    is_deleted: number;
  };
  identifier: string;
  title: string;
  type: string;
  start_at: number;
  end_at: number;
  parent_id: string | null;
  short_id: string;
  html_url: string;
  parent: any;
  assignee?: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  version: any;
  sprint: any;
  state: {
    id: string;
    url: string;
    name: string;
    type: string;
    color: string;
  };
  priority: {
    id: string;
    url: string;
    name: string;
  };
  board: any;
  entry: any;
  swimlane: any;
  phase: any;
  description?: string;
  completed_at: number;
  story_points: any;
  estimated_workload: number;
  remaining_workload: number;
  properties: Record<string, any>;
  tags: Array<{
    id: string;
    url: string;
    name: string;
  }>;
  participants: Array<{
    id: string;
    url: string;
    type: string;
    user?: {
      id: string;
      url: string;
      name: string;
      display_name: string;
      avatar: string;
    };
  }>;
  public_image_token: string;
  created_at: number;
  created_by: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  updated_at: number;
  updated_by: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  is_archived: number;
  is_deleted: number;
}
// PingCode 产品接口
export interface PingCodeProduct {
  id: string;
  url: string;
  identifier: string;
  name: string;
  visibility: string;
  scope_type: string;
  scope_id: string;
  color: string;
  description?: string;
  members: Array<{
    id: string;
    url: string;
    type: string;
    user?: {
      id: string;
      url: string;
      name: string;
      display_name: string;
      avatar: string;
    };
    user_group?: {
      id: string;
      url: string;
      name: string;
    };
  }>;
  created_at: number;
  created_by: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  updated_at: number;
  updated_by: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  is_archived: number;
  is_deleted: number;
}

// 产品列表响应接口
export interface PingCodeProductsResponse {
  page_size: number;
  page_index: number;
  total: number;
  values: PingCodeProduct[];
}

// 在文件顶部添加刷新令牌接口
export interface PingCodeRefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const usePingCodeStore = defineStore("pingcode", () => {
  // 响应式状态
  const token = ref<PingCodeToken | null>(null);
  const credentials = ref<PingCodeCredentials | null>(null);
  const isAuthenticated = ref(false);
  const refreshTimer = ref<number | null>(null);

  // 缓存相关状态
  const projectsCache = ref<PingCodeProject[]>([]);
  const workItemsCache = ref<PingCodeWorkItem[]>([]);
  const productsCache = ref<PingCodeProduct[]>([]);
  const ideasCache = ref<PingCodeIdea[]>([]); // 新增需求缓存
  const newProjectsCache = ref<PingCodeProject[]>([]);

  // 缓存时间戳
  const projectsCacheTimestamp = ref<number>(0);
  const workItemsCacheTimestamp = ref<number>(0);
  const productsCacheTimestamp = ref<number>(0);
  const ideasCacheTimestamp = ref<number>(0); // 新增需求缓存时间戳
  const newProjectsCacheTimestamp = ref<number>(0); // 新增项目缓存时间戳

  // 修改refreshToken方法，使用授权码模式的刷新机制
  const refreshToken = async () => {
    if (!token.value || !token.value.refresh_token || !credentials.value) {
      console.error("没有可用的刷新令牌或配置");
      clearToken();
      return;
    }

    try {
      console.log("正在刷新 PingCode 令牌...");

      // 调用Tauri命令刷新令牌
      const response = await invoke("refresh_pingcode_token", {
        refreshToken: token.value.refresh_token,
      });

      const refreshedTokenData: PingCodeRefreshTokenResponse = JSON.parse(
        response as string
      );

      // 更新令牌信息
      const newToken: PingCodeToken = {
        ...token.value,
        access_token: refreshedTokenData.access_token,
        token_type: refreshedTokenData.token_type,
        expires_in: refreshedTokenData.expires_in,
        timestamp: Date.now(),
      };

      token.value = newToken;

      // 存储到本地存储
      localStorage.setItem("pingcode_token", JSON.stringify(newToken));

      // 重新设置定时刷新
      setupTokenRefresh();

      console.log("PingCode 令牌刷新成功");
    } catch (error) {
      console.error("刷新 PingCode 令牌失败:", error);
      clearToken();
    }
  };

  // 设置客户端凭据
  const setCredentials = (creds: PingCodeCredentials) => {
    credentials.value = creds;
    localStorage.setItem("pingcode_credentials", JSON.stringify(creds));
    console.log("PingCode 客户端凭据已设置");
  };

  // 从本地存储加载凭据
  const loadCredentialsFromStorage = () => {
    const storedCredentials = localStorage.getItem("pingcode_credentials");
    if (storedCredentials) {
      try {
        const parsedCredentials: PingCodeCredentials =
          JSON.parse(storedCredentials);
        credentials.value = parsedCredentials;
        console.log("PingCode 客户端凭据已从本地存储加载");
        return true;
      } catch (error) {
        console.error("解析 PingCode 凭据失败:", error);
        return false;
      }
    }
    return false;
  };

  // 设置令牌
  const setToken = (tokenData: Omit<PingCodeToken, "timestamp">) => {
    // 添加获取令牌的时间戳
    const newToken: PingCodeToken = {
      ...tokenData,
      timestamp: Date.now(),
    };

    token.value = newToken;
    isAuthenticated.value = true;

    // 存储到本地存储
    localStorage.setItem("pingcode_token", JSON.stringify(newToken));

    // 设置定时刷新
    setupTokenRefresh();

    // 清除缓存，因为新令牌可能有权限访问不同的数据
    clearCache();

    console.log("PingCode 令牌已设置");
  };

  // 从本地存储加载令牌
  const loadTokenFromStorage = () => {
    const storedToken = localStorage.getItem("pingcode_token");
    if (storedToken) {
      try {
        const parsedToken: PingCodeToken = JSON.parse(storedToken);
        token.value = parsedToken;

        // 检查令牌是否已过期
        if (!isTokenExpired()) {
          isAuthenticated.value = true;
          setupTokenRefresh();
          console.log("PingCode 令牌已从本地存储加载");
        } else {
          // 令牌已过期，尝试刷新
          refreshToken();
        }
      } catch (error) {
        console.error("解析 PingCode 令牌失败:", error);
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
      `PingCode 令牌将在 ${Math.floor(refreshTime / 60000)} 分钟后刷新`
    );
  };

  // 清除令牌
  const clearToken = () => {
    token.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem("pingcode_token");

    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value);
      refreshTimer.value = null;
    }

    // 清除缓存
    clearCache();

    console.log("PingCode 令牌已清除");
  };

  // 清除凭据
  const clearCredentials = () => {
    credentials.value = null;
    localStorage.removeItem("pingcode_credentials");
    clearToken();
    console.log("PingCode 凭据已清除");
  };

  // 清除缓存
  const clearCache = () => {
    projectsCache.value = [];
    projectsCacheTimestamp.value = 0;
    workItemsCache.value = [];
    workItemsCacheTimestamp.value = 0;
    productsCache.value = [];
    productsCacheTimestamp.value = 0;
    newProjectsCache.value = [];
    newProjectsCacheTimestamp.value = 0;
    console.log("PingCode 缓存已清除");
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
    loadCredentialsFromStorage();
    loadTokenFromStorage();
  };

  // 获取项目列表（带缓存）- 新版API
  const getProjects = async (params?: {
    identifier?: string;
    type?: "scrum" | "kanban" | "waterfall" | "hybrid";
    include_deleted?: boolean;
    include_archived?: boolean;
  }): Promise<PingCodeProject[]> => {
    if (!token.value || isTokenExpired() || !credentials.value) {
      return [];
    }

    // 检查缓存是否有效
    if (
      newProjectsCache.value.length > 0 &&
      isCacheValid(newProjectsCacheTimestamp.value)
    ) {
      console.log("使用缓存的 PingCode 新项目列表");
      return newProjectsCache.value;
    }

    try {
      let url = `https://open.pingcode.com/v1/project/projects`;

      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params?.identifier) {
        queryParams.append("identifier", params.identifier);
      }
      if (params?.type) {
        queryParams.append("type", params.type);
      }
      if (params?.include_deleted !== undefined) {
        queryParams.append(
          "include_deleted",
          params.include_deleted.toString()
        );
      }
      if (params?.include_archived !== undefined) {
        queryParams.append(
          "include_archived",
          params.include_archived.toString()
        );
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthorizationHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`获取项目列表失败: ${response.status}`);
      }

      const data: PingCodeProjectsResponse = await response.json();
      const projects = data.values || [];

      // 更新缓存
      newProjectsCache.value = projects;
      newProjectsCacheTimestamp.value = Date.now();
      console.log("获取并缓存 PingCode 新项目列表");

      return projects;
    } catch (error) {
      console.error("获取 PingCode 新项目列表失败:", error);
      // 如果有缓存，返回缓存的数据
      if (newProjectsCache.value.length > 0) {
        console.log("获取失败，使用缓存的 PingCode 新项目列表");
        return newProjectsCache.value;
      }
      return [];
    }
  };
  // 获取工作项列表（新版API）- 支持project_ids参数
  const getWorkItems = async (params?: {
    project_ids?: string;
    include_deleted?: boolean;
    include_archived?: boolean;
  }): Promise<PingCodeWorkItem[]> => {
    if (!token.value || isTokenExpired() || !credentials.value) {
      return [];
    }

    // 检查缓存是否有效
    if (
      workItemsCache.value.length > 0 &&
      isCacheValid(workItemsCacheTimestamp.value)
    ) {
      console.log("使用缓存的 PingCode 工作项列表");
      return workItemsCache.value;
    }

    try {
      let url = `https://open.pingcode.com/v1/project/work_items`;

      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params?.project_ids) {
        queryParams.append("project_ids", params.project_ids);
      }
      if (params?.include_deleted !== undefined) {
        queryParams.append(
          "include_deleted",
          params.include_deleted.toString()
        );
      }
      if (params?.include_archived !== undefined) {
        queryParams.append(
          "include_archived",
          params.include_archived.toString()
        );
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthorizationHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`获取工作项列表失败: ${response.status}`);
      }

      const data: PingCodeWorkItemsResponse = await response.json();
      const workItems = data.values || [];

      // 更新缓存
      workItemsCache.value = workItems;
      workItemsCacheTimestamp.value = Date.now();
      console.log("获取并缓存 PingCode 工作项列表");

      return workItems;
    } catch (error) {
      console.error("获取 PingCode 工作项列表失败:", error);
      // 如果有缓存，返回缓存的数据
      if (workItemsCache.value.length > 0) {
        console.log("获取失败，使用缓存的 PingCode 工作项列表");
        return workItemsCache.value;
      }
      return [];
    }
  };

  // 获取产品列表（带缓存）
  const getProducts = async (): Promise<PingCodeProduct[]> => {
    if (!token.value || isTokenExpired() || !credentials.value) {
      return [];
    }

    // 检查缓存是否有效
    if (
      productsCache.value.length > 0 &&
      isCacheValid(productsCacheTimestamp.value)
    ) {
      console.log("使用缓存的 PingCode 产品列表");
      return productsCache.value;
    }

    try {
      const response = await fetch(
        `https://open.pingcode.com/v1/ship/products`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthorizationHeader(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`获取产品列表失败: ${response.status}`);
      }

      const data: PingCodeProductsResponse = await response.json();
      const products = data.values || [];

      // 更新缓存
      productsCache.value = products;
      productsCacheTimestamp.value = Date.now();
      console.log("获取并缓存 PingCode 产品列表");

      return products;
    } catch (error) {
      console.error("获取 PingCode 产品列表失败:", error);
      // 如果有缓存，返回缓存的数据
      if (productsCache.value.length > 0) {
        console.log("获取失败，使用缓存的 PingCode 产品列表");
        return productsCache.value;
      }
      return [];
    }
  };

  // 获取需求列表
  const getIdeas = async (params?: {
    product_id?: string;
    state_id?: string;
    priority_id?: string;
    created_between?: string;
    updated_between?: string;
    keywords?: string;
    include_public_image_token?: string;
  }): Promise<PingCodeIdea[]> => {
    if (!token.value || isTokenExpired() || !credentials.value) {
      return [];
    }

    // 检查缓存是否有效
    if (
      ideasCache.value.length > 0 &&
      isCacheValid(ideasCacheTimestamp.value)
    ) {
      console.log("使用缓存的 PingCode 需求列表");
      return ideasCache.value;
    }

    try {
      let url = `https://open.pingcode.com/v1/ship/ideas`;

      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params?.product_id) {
        queryParams.append("product_id", params.product_id);
      }
      if (params?.state_id) {
        queryParams.append("state_id", params.state_id);
      }
      if (params?.priority_id) {
        queryParams.append("priority_id", params.priority_id);
      }
      if (params?.created_between) {
        queryParams.append("created_between", params.created_between);
      }
      if (params?.updated_between) {
        queryParams.append("updated_between", params.updated_between);
      }
      if (params?.keywords) {
        queryParams.append("keywords", params.keywords);
      }
      if (params?.include_public_image_token) {
        queryParams.append(
          "include_public_image_token",
          params.include_public_image_token
        );
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthorizationHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`获取需求列表失败: ${response.status}`);
      }

      const data: PingCodeIdeasResponse = await response.json();
      const ideas = data.values || [];

      // 更新缓存
      ideasCache.value = ideas;
      ideasCacheTimestamp.value = Date.now();
      console.log("获取并缓存 PingCode 需求列表");

      return ideas;
    } catch (error) {
      console.error("获取 PingCode 需求列表失败:", error);
      // 如果有缓存，返回缓存的数据
      if (ideasCache.value.length > 0) {
        console.log("获取失败，使用缓存的 PingCode 需求列表");
        return ideasCache.value;
      }
      return [];
    }
  };

  return {
    // 状态
    token,
    credentials,
    isAuthenticated,

    // 缓存状态（可选暴露给外部）
    projectsCache,
    workItemsCache,
    productsCache,
    ideasCache, // 新增需求缓存
    newProjectsCache,

    // 方法
    setCredentials,
    loadCredentialsFromStorage,
    setToken,
    loadTokenFromStorage,
    isTokenExpired,
    refreshToken,
    clearToken,
    clearCredentials,
    clearCache,
    getAuthorizationHeader,
    initialize,
    getProjects,
    getWorkItems,
    getProducts,
    getIdeas, // 新增获取需求列表方法
  };
});

// 需求列表响应接口
export interface PingCodeIdeasResponse {
  page_size: number;
  page_index: number;
  total: number;
  values: PingCodeIdea[];
}

// PingCode 需求接口
export interface PingCodeIdea {
  id: string;
  url: string;
  product: {
    id: string;
    url: string;
    identifier: string;
    name: string;
    is_archived: number;
    is_deleted: number;
  };
  identifier: string;
  title: string;
  short_id: string;
  html_url: string;
  assignee?: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  state: {
    id: string;
    url: string;
    name: string;
    type: string;
  };
  priority: {
    id: string;
    url: string;
    name: string;
  };
  plan?: {
    id: string;
    url: string;
    name: string;
  };
  suite?: {
    id: string;
    url: string;
    name: string;
    type: string;
  };
  plan_at?: {
    from: number;
    to: number;
    granularity: string;
  };
  real_at?: {
    from: number;
    to: number;
    granularity: string;
  };
  score: number;
  progress: number;
  description?: string;
  properties: Record<string, any>;
  public_image_token: string;
  participants: Array<{
    id: string;
    url: string;
    type: string;
    user?: {
      id: string;
      url: string;
      name: string;
      display_name: string;
      avatar: string;
    };
    user_group?: {
      id: string;
      url: string;
      name: string;
    };
  }>;
  completed_at: number;
  completed_by?: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  created_at: number;
  created_by: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  updated_at: number;
  updated_by: {
    id: string;
    url: string;
    name: string;
    display_name: string;
    avatar: string;
  };
  is_archived: number;
  is_deleted: number;
}
