<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { GithubToken, useGithubStore } from "../store/github";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Github,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  AlertCircle,
  CheckCircle,
  LogOut,
  Star,
  StarOff,
  List,
  BookOpen,
  Search,
  Filter,
  Grid3X3,
  Layers,
  X,
  Circle,
} from "lucide-vue-next";
import {
  NButton,
  NPopconfirm,
  NSelect,
  NInput,
  NDialog,
  NForm,
  NFormItem,
  NInputGroup,
} from "naive-ui";

// 在组件内添加对 store 的引用
const githubStore = useGithubStore();

// 在页面加载时加载配置
onMounted(() => {
  checkGithubAccountStatus();

  // 加载已保存的配置
  const savedConfig = githubStore.getConfig();
  if (savedConfig) {
    clientId.value = savedConfig.client_id;
    clientSecret.value = savedConfig.client_secret;
    redirectUri.value = savedConfig.redirect_uri;
  }
});

// 修改 handleConfigConfirm 方法
const handleConfigConfirm = async () => {
  try {
    // 保存配置到 store
    githubStore.setConfig({
      client_id: clientId.value,
      client_secret: clientSecret.value,
      redirect_uri: redirectUri.value,
    });

    // 关闭对话框
    isConfigDialogVisible.value = false;

    // 调用 tauri 打开登录窗口
    await invoke("open_github_login_window", {
      clientId: clientId.value,
      clientSecret: clientSecret.value,
      redirectUri: redirectUri.value,
    });
  } catch (error) {
    console.error("打开 GitHub 登录窗口失败:", error);
  }
};

// 基础状态
const isGithubConnected = ref(false);
const githubUsername = ref("");
const isExpanded = ref(false);
const isLoading = ref(false);

// 添加对话框和表单相关状态
const isConfigDialogVisible = ref(false);
const clientId = ref("");
const clientSecret = ref("");
const redirectUri = ref("tauri://callback.wocnote.com");

// 数据状态
const myIssues = ref<GithubIssue[]>([]);
const unassignedIssues = ref<GithubIssue[]>([]);
const repositories = ref<GithubRepository[]>([]);
const allIssues = ref<GithubIssue[]>([]);

// 视图和筛选状态
const viewMode = ref<"flat" | "grouped">("flat"); // 扁平化或分组视图
const selectedRepos = ref<number[]>([]); // 选中的仓库ID
const searchKeyword = ref(""); // 搜索关键词
const issueState = ref<"open" | "closed" | "all">("open"); // Issue状态筛选

// 计算属性：过滤后的Issues
const filteredIssues = computed(() => {
  let issues = [...allIssues.value];

  // 按状态筛选
  if (issueState.value !== "all") {
    issues = issues.filter((issue) => issue.state === issueState.value);
  }

  // 按仓库筛选
  if (selectedRepos.value.length > 0) {
    issues = issues.filter((issue) =>
      selectedRepos.value.includes(issue.repository.id)
    );
  }

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    issues = issues.filter(
      (issue) =>
        issue.title.toLowerCase().includes(keyword) ||
        issue.body?.toLowerCase().includes(keyword) ||
        issue.repository.full_name.toLowerCase().includes(keyword)
    );
  }

  return issues;
});

// 计算属性：按仓库分组的Issues
const groupedIssues = computed(() => {
  const grouped: { [key: string]: GithubIssue[] } = {};

  filteredIssues.value.forEach((issue) => {
    const repoName = issue.repository.full_name;
    if (!grouped[repoName]) {
      grouped[repoName] = [];
    }
    grouped[repoName].push(issue);
  });

  return grouped;
});

// 计算属性：仓库选项（用于筛选器）
const repoOptions = computed(() => {
  return repositories.value.map((repo) => ({
    label: repo.full_name,
    value: repo.id,
  }));
});

// 切换展开状态
const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value;
  if (
    isExpanded.value &&
    allIssues.value.length === 0 &&
    isGithubConnected.value
  ) {
    loadGithubData();
  }
};

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === "flat" ? "grouped" : "flat";
};

// 清空仓库筛选
const clearRepoFilter = () => {
  selectedRepos.value = [];
};

// 加载GitHub数据
const loadGithubData = async () => {
  if (!isGithubConnected.value) return;

  isLoading.value = true;
  try {
    const [repos, user] = await Promise.all([
      githubStore.getRepos(),
      githubStore.getUser(),
    ]);

    const subscribed = githubStore.getSubscribedRepos();
    repositories.value = repos.map((repo: any) => ({
      ...repo,
      is_subscribed: subscribed.some((subRepo) => subRepo.id === repo.id),
    }));

    githubUsername.value = user?.login || "";
    await loadGithubIssues();
  } catch (error) {
    console.error("加载 GitHub 数据失败:", error);
  } finally {
    isLoading.value = false;
  }
};

// 加载GitHub Issues
const loadGithubIssues = async () => {
  if (!isGithubConnected.value) return;

  try {
    const issues = await githubStore.getAllIssues();
    allIssues.value = issues;

    myIssues.value = issues.filter(
      (issue) => issue.assignee && issue.assignee.login === githubUsername.value
    );

    unassignedIssues.value = issues.filter((issue) => !issue.assignee);
  } catch (error) {
    console.error("加载 GitHub Issues 失败:", error);
  }
};

// 切换仓库订阅状态
const toggleRepoSubscription = async (repoId: number) => {
  try {
    const repo = repositories.value.find((r) => r.id === repoId);
    if (!repo) return;

    if (repo.is_subscribed) {
      githubStore.unsubscribeRepo(repoId);
    } else {
      githubStore.subscribeRepo(repo);
    }

    repo.is_subscribed = !repo.is_subscribed;
    await loadGithubIssues();
  } catch (error) {
    console.error("切换仓库订阅状态失败:", error);
  }
};

// 处理连接账号 - 修改为显示配置对话框
const handleConnectAccount = () => {
  isConfigDialogVisible.value = true;
};

// 处理解除绑定
const handleDisconnectAccount = () => {
  githubStore.clearToken();
  isGithubConnected.value = false;
  githubUsername.value = "";
  myIssues.value = [];
  unassignedIssues.value = [];
  repositories.value = [];
  allIssues.value = [];
  isExpanded.value = false;
};

// 检查GitHub账号状态
const checkGithubAccountStatus = () => {
  isGithubConnected.value =
    githubStore.isAuthenticated && !githubStore.isTokenExpired();

  if (isGithubConnected.value) {
    githubUsername.value = "GitHub用户";
  }
};

// 获取issue状态样式
const getIssueStatusBadge = (state: string) => {
  if (state === "open") {
    return { text: "开放", class: "status-open", icon: AlertCircle };
  } else if (state === "closed") {
    return { text: "已关闭", class: "status-closed", icon: CheckCircle };
  }
  return { text: "未知", class: "status-unknown", icon: Circle };
};

// 监听GitHub access token事件
listen<Omit<GithubToken, "timestamp">>("github-access-token", (event) => {
  console.log("github access token:", event.payload);
  githubStore.setToken(event.payload);
  setTimeout(() => {
    checkGithubAccountStatus();
  }, 100);
});

onMounted(() => {
  checkGithubAccountStatus();
});
</script>

<template>
  <div class="github-integration-card">
    <div class="integration-header" @click="toggleExpansion">
      <Github class="integration-icon" />
      <span class="integration-title">GitHub</span>
      <span v-if="isGithubConnected" class="status-badge connected"
        >已绑定</span
      >
      <span v-else class="status-badge">未绑定</span>
      <span v-if="isGithubConnected" class="username-badge">{{
        githubUsername
      }}</span>
      <span class="expand-icon">
        <ChevronDown v-if="isExpanded" />
        <ChevronUp v-else />
      </span>
    </div>

    <p class="integration-description">
      连接GitHub账号，同步issues和Pull Requests作为任务。
    </p>

    <!-- 未绑定状态显示绑定按钮 -->
    <NButton
      v-if="!isGithubConnected"
      type="primary"
      class="connect-button"
      @click.stop="handleConnectAccount"
    >
      绑定账号
    </NButton>

    <!-- 已绑定状态显示解除绑定按钮 -->
    <div v-else class="connected-actions">
      <NPopconfirm @positive-click="handleDisconnectAccount">
        <template #trigger>
          <NButton type="error" class="disconnect-button">
            <LogOut class="logout-icon" />
            解除绑定
          </NButton>
        </template>
        <template #default>
          <p>确定要解除GitHub账号绑定吗？</p>
        </template>
      </NPopconfirm>
    </div>

    <!-- GitHub 展开区域 -->
    <div v-if="isExpanded && isGithubConnected" class="github-expand-section">
      <!-- 视图切换和筛选器 -->
      <div class="github-controls">
        <!-- 视图模式切换 -->
        <div class="view-mode-toggle">
          <button
            :class="['view-button', { active: viewMode === 'flat' }]"
            @click="viewMode = 'flat'"
          >
            <Grid3X3 :size="16" />
            扁平化
          </button>
          <button
            :class="['view-button', { active: viewMode === 'grouped' }]"
            @click="viewMode = 'grouped'"
          >
            <Layers :size="16" />
            按仓库分组
          </button>
        </div>

        <!-- 筛选器 -->
        <div class="filters-section">
          <!-- 搜索框 -->
          <div class="search-filter">
            <NInput
              v-model:value="searchKeyword"
              placeholder="搜索 Issues..."
              clearable
            >
              <template #prefix>
                <Search :size="16" />
              </template>
            </NInput>
          </div>

          <!-- 状态筛选 -->
          <div class="state-filter">
            <button
              :class="['state-button', { active: issueState === 'open' }]"
              @click="issueState = 'open'"
            >
              开放
            </button>
            <button
              :class="['state-button', { active: issueState === 'closed' }]"
              @click="issueState = 'closed'"
            >
              已关闭
            </button>
            <button
              :class="['state-button', { active: issueState === 'all' }]"
              @click="issueState = 'all'"
            >
              全部
            </button>
          </div>

          <!-- 仓库筛选 -->
          <div class="repo-filter">
            <NSelect
              v-model:value="selectedRepos"
              :options="repoOptions"
              placeholder="选择仓库"
              multiple
              clearable
              :max-tag-count="2"
              class="repo-select"
            />
            <NButton
              v-if="selectedRepos.length > 0"
              quaternary
              size="small"
              @click="clearRepoFilter"
            >
              <X :size="14" />
            </NButton>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <p>加载中...</p>
      </div>

      <!-- 扁平化视图 -->
      <div v-else-if="viewMode === 'flat'" class="flat-view">
        <div class="issues-summary">
          <p>共找到 {{ filteredIssues.length }} 个 Issues</p>
        </div>

        <div class="issues-list">
          <div
            v-for="issue in filteredIssues"
            :key="issue.id"
            class="issue-item"
          >
            <div class="issue-header">
              <div class="issue-title">
                <span class="repo-name">{{ issue.repository.full_name }}</span>
                <span class="issue-number">#{{ issue.number }}</span>
                {{ issue.title }}
              </div>
              <span
                :class="[
                  'issue-status',
                  getIssueStatusBadge(issue.state).class,
                ]"
              >
                <component
                  :is="getIssueStatusBadge(issue.state).icon"
                  :size="14"
                />
                {{ getIssueStatusBadge(issue.state).text }}
              </span>
            </div>

            <div class="issue-meta">
              <span class="issue-owner">
                <User :size="14" />
                {{ issue.user.login }}
              </span>
              <span v-if="issue.assignee" class="issue-assignee">
                经办人: {{ issue.assignee.login }}
              </span>
              <span
                v-if="issue.type"
                class="issue-type"
                :style="{
                  backgroundColor: issue.type.color + '20',
                  color: issue.type.color,
                }"
              >
                {{ issue.type.name }}
              </span>
            </div>

            <div v-if="issue.body" class="issue-description">
              {{
                issue.body.length > 150
                  ? issue.body.substring(0, 150) + "..."
                  : issue.body
              }}
            </div>
          </div>
        </div>

        <!-- 无数据状态 -->
        <div v-if="filteredIssues.length === 0" class="no-data">
          <p>没有找到匹配的 Issues</p>
        </div>
      </div>

      <!-- 分组视图 -->
      <div v-else class="grouped-view">
        <div
          v-for="(issues, repoName) in groupedIssues"
          :key="repoName"
          class="repo-group"
        >
          <div class="repo-group-header">
            <h4 class="repo-group-title">{{ repoName }}</h4>
            <span class="repo-issue-count">{{ issues.length }} 个 Issues</span>
          </div>

          <div class="repo-issues-list">
            <div v-for="issue in issues" :key="issue.id" class="issue-item">
              <div class="issue-header">
                <div class="issue-title">
                  <span class="issue-number">#{{ issue.number }}</span>
                  {{ issue.title }}
                </div>
                <span
                  :class="[
                    'issue-status',
                    getIssueStatusBadge(issue.state).class,
                  ]"
                >
                  <component
                    :is="getIssueStatusBadge(issue.state).icon"
                    :size="14"
                  />
                  {{ getIssueStatusBadge(issue.state).text }}
                </span>
              </div>

              <div class="issue-meta">
                <span class="issue-owner">
                  <User :size="14" />
                  {{ issue.user.login }}
                </span>
                <span v-if="issue.assignee" class="issue-assignee">
                  经办人: {{ issue.assignee.login }}
                </span>
                <span
                  v-if="issue.type"
                  class="issue-type"
                  :style="{
                    backgroundColor: issue.type.color + '20',
                    color: issue.type.color,
                  }"
                >
                  {{ issue.type.name }}
                </span>
              </div>

              <div v-if="issue.body" class="issue-description">
                {{
                  issue.body.length > 100
                    ? issue.body.substring(0, 100) + "..."
                    : issue.body
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- 无数据状态 -->
        <div v-if="Object.keys(groupedIssues).length === 0" class="no-data">
          <p>没有找到匹配的 Issues</p>
        </div>
      </div>
    </div>

    <!-- GitHub 配置对话框 -->
    <NModal
      v-model:show="isConfigDialogVisible"
      title="GitHub OAuth 配置"
      preset="dialog"
      :style="{ width: '500px' }"
    >
      <NForm>
        <NFormItem label="Client ID" required>
          <NInput
            v-model:value="clientId"
            placeholder="请输入 GitHub OAuth App Client ID"
            :show-count="true"
            maxlength="100"
          />
        </NFormItem>
        <NFormItem label="Client Secret" required>
          <NInput
            v-model:value="clientSecret"
            placeholder="请输入 GitHub OAuth App Client Secret"
            type="password"
            :show-count="true"
            maxlength="100"
          />
        </NFormItem>
        <NFormItem label="Redirect URI" required>
          <NInput
            v-model:value="redirectUri"
            placeholder="请输入重定向 URI"
            :show-count="true"
            maxlength="200"
          />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="isConfigDialogVisible = false">取消</NButton>
        <NButton type="primary" @click="handleConfigConfirm">确认</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="less">
.github-integration-card {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
  cursor: pointer;
  height: fit-content;
}

.github-integration-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.integration-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.integration-icon {
  color: #333;
  font-size: 24px;
}

.integration-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.status-badge {
  margin-left: auto;
  font-size: 12px;
  color: #999;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f5f5f5;
}

.status-badge.connected {
  color: #52c41a;
  background: #f6ffed;
}

.username-badge {
  margin-left: 8px;
  font-size: 12px;
  color: #666;
}

.expand-icon {
  margin-left: 8px;
  font-size: 16px;
  color: #999;
  transition: transform 0.3s;
}

.integration-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.connect-button {
  width: 100%;
  height: 40px;
  background: #fff;
  color: #1890ff;
  border: 1px solid #d9d9d9;
  transition: all 0.3s;
}

.connect-button:hover {
  border-color: #1890ff;
}

.connected-actions {
  display: flex;
  justify-content: flex-end;
}

.disconnect-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
}

.logout-icon {
  font-size: 14px;
}

/* GitHub 展开区域样式 */
.github-expand-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

/* 控制区域样式 */
.github-controls {
  margin-bottom: 20px;
}

.view-mode-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.view-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.view-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.view-button.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.filters-section {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-filter {
  flex: 1;
  min-width: 200px;
}

.state-filter {
  display: flex;
  gap: 8px;
}

.state-button {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.state-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.state-button.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.repo-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.repo-select {
  flex: 1;
}

/* 加载状态样式 */
.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  border-radius: 6px;
  background: #fafafa;
}

/* 扁平化视图样式 */
.flat-view {
  //   max-height: 600px;
  //   overflow-y: auto;
}

.issues-summary {
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f0f8ff;
  border-radius: 6px;
  font-size: 14px;
  color: #1890ff;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.issue-item {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

.issue-item:hover {
  background: #f0f0f0;
  border-color: #1890ff;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
}

.issue-title {
  font-size: 14px;
  font-weight: 500;
  color: #222;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.repo-name {
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.issue-number {
  color: #1890ff;
  font-weight: 500;
}

.issue-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.issue-status.status-open {
  background: #fff7e6;
  color: #fa8c16;
}

.issue-status.status-closed {
  background: #f6ffed;
  color: #52c41a;
}

.issue-status.status-unknown {
  background: #f5f5f5;
  color: #999;
}

.issue-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.issue-owner {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.issue-assignee {
  color: #1890ff;
  font-weight: 500;
}

.issue-type {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
}

.issue-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  word-break: break-word;
}

/* 分组视图样式 */
.grouped-view {
  max-height: 600px;
  overflow-y: auto;
}

.repo-group {
  margin-bottom: 24px;
}

.repo-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0f8ff;
  border-radius: 6px;
  border-left: 4px solid #1890ff;
}

.repo-group-title {
  font-size: 15px;
  font-weight: 600;
  color: #1890ff;
  margin: 0;
}

.repo-issue-count {
  font-size: 12px;
  color: #666;
  background: #fff;
  padding: 2px 8px;
  border-radius: 12px;
}

.repo-issues-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 16px;
}

/* 无数据状态 */
.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  background: #fafafa;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-filter,
  .repo-filter {
    min-width: auto;
  }

  .state-filter {
    justify-content: center;
  }

  .issue-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .issue-meta {
    flex-direction: column;
    gap: 6px;
  }
}
</style>

.form-hint { margin-top: 8px; font-size: 12px; color: #999; margin-bottom: 0; }
