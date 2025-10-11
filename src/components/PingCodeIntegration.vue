<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { PingCodeToken, usePingCodeStore } from "../store/pingcode";
import {
  Clock,
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
  Settings,
  Key,
} from "lucide-vue-next";
import {
  NButton,
  NPopconfirm,
  NSelect,
  NInput,
  NModal,
  NForm,
  NFormItem,
  NInputGroup,
} from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const pingCodeStore = usePingCodeStore();

// 基础状态
const isPingCodeConnected = ref(false);
const isExpanded = ref(false);
const isLoading = ref(false);

// 数据状态
const projects = ref<any[]>([]);
const workItems = ref<any[]>([]);
const allWorkItems = ref<any[]>([]);
const ideas = ref<any[]>([]);
const allIdeas = ref<any[]>([]);
const products = ref<any[]>([]);

// 视图和筛选状态
const activeTab = ref<"ideas" | "workItems">("ideas");
const viewMode = ref<"flat" | "grouped">("flat");
const selectedProjects = ref<string[]>([]);
const selectedProducts = ref<string[]>([]);
const searchKeyword = ref("");
const workItemStatus = ref<"open" | "closed" | "all">("open");
const ideaStatus = ref<"open" | "closed" | "all">("open");

// 配置弹窗状态
const showConfigModal = ref(false);
const configForm = ref({
  client_id: "",
  client_secret: "",
  api_root: "https://open.pingcode.com",
});

// 计算属性：过滤后的工作项
const filteredWorkItems = computed(() => {
  let items = [...allWorkItems.value];

  // 按状态筛选
  if (workItemStatus.value !== "all") {
    items = items.filter((item) => {
      const statusName = item.state?.type?.toLowerCase() || "";
      if (workItemStatus.value === "open") {
        return (
          statusName.includes("pending") || statusName.includes("in_progress")
        );
      } else if (workItemStatus.value === "closed") {
        return (
          statusName.includes("completed") || statusName.includes("closed")
        );
      }
      return true;
    });
  }

  // 按项目筛选
  if (selectedProjects.value.length > 0) {
    items = items.filter((item) =>
      selectedProjects.value.includes(item.project?.id)
    );
  }

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    items = items.filter(
      (item) =>
        item.title?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword) ||
        item.project?.name?.toLowerCase().includes(keyword) ||
        item.identifier?.toLowerCase().includes(keyword)
    );
  }

  return items;
});

// 计算属性：按项目分组的工作项
const groupedWorkItems = computed(() => {
  const grouped: { [key: string]: any[] } = {};

  filteredWorkItems.value.forEach((item) => {
    const projectKey = item.project?.name || "未分配";
    if (!grouped[projectKey]) {
      grouped[projectKey] = [];
    }
    grouped[projectKey].push(item);
  });

  return grouped;
});

// 计算属性：过滤后的需求
const filteredIdeas = computed(() => {
  let items = [...allIdeas.value];

  // 按状态筛选
  if (ideaStatus.value !== "all") {
    items = items.filter((item) => {
      const stateName = item.state?.name?.toLowerCase() || "";
      if (ideaStatus.value === "open") {
        return (
          !stateName.includes("closed") &&
          !stateName.includes("done") &&
          !stateName.includes("resolved")
        );
      } else if (ideaStatus.value === "closed") {
        return (
          stateName.includes("closed") ||
          stateName.includes("done") ||
          stateName.includes("resolved")
        );
      }
      return true;
    });
  }

  // 按产品筛选
  if (selectedProducts.value.length > 0) {
    items = items.filter((item) =>
      selectedProducts.value.includes(item.product?.id)
    );
  }

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    items = items.filter(
      (item) =>
        item.title?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword) ||
        item.product?.name?.toLowerCase().includes(keyword) ||
        item.identifier?.toLowerCase().includes(keyword)
    );
  }

  return items;
});

// 计算属性：项目选项
const projectOptions = computed(() => {
  return projects.value.map((project) => ({
    label: `${project.name} (${project.identifier})`,
    value: project.id,
  }));
});

// 计算属性：产品选项
const productOptions = computed(() => {
  return products.value.map((product) => ({
    label: `${product.name} (${product.identifier})`,
    value: product.id,
  }));
});

// 切换展开状态
const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value;
  if (
    isExpanded.value &&
    (allWorkItems.value.length === 0 || allIdeas.value.length === 0) &&
    isPingCodeConnected.value
  ) {
    loadPingCodeData();
  }
};

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === "flat" ? "grouped" : "flat";
};

// 获取当前状态筛选值
const getStatusFilter = () => {
  return activeTab.value === "ideas" ? ideaStatus.value : workItemStatus.value;
};

// 设置状态筛选
const setStatusFilter = (status: "open" | "closed" | "all") => {
  if (activeTab.value === "ideas") {
    ideaStatus.value = status;
  } else {
    workItemStatus.value = status;
  }
};

// 清空筛选
const clearFilter = () => {
  if (activeTab.value === "ideas") {
    selectedProducts.value = [];
  } else {
    selectedProjects.value = [];
  }
};

// 加载PingCode数据
const loadPingCodeData = async () => {
  if (!isPingCodeConnected.value) return;

  isLoading.value = true;
  try {
    const [projectsData, workItemsData, productsData, ideasData] =
      await Promise.all([
        pingCodeStore.getProjects(),
        pingCodeStore.getWorkItems(),
        pingCodeStore.getProducts(),
        pingCodeStore.getIdeas(),
      ]);

    projects.value = projectsData;
    allWorkItems.value = workItemsData;
    workItems.value = workItemsData;
    products.value = productsData;
    allIdeas.value = ideasData;
    ideas.value = ideasData;
  } catch (error) {
    console.error("加载 PingCode 数据失败:", error);
  } finally {
    isLoading.value = false;
  }
};

// 处理连接账号
const handleConnectAccount = async () => {
  showConfigModal.value = true;
};

// 处理配置保存
const handleSaveConfig = async () => {
  if (
    !configForm.value.client_id ||
    !configForm.value.client_secret ||
    !configForm.value.api_root
  ) {
    console.error("请填写完整的配置信息");
    return;
  }

  try {
    pingCodeStore.setCredentials({
      client_id: configForm.value.client_id,
      client_secret: configForm.value.client_secret,
    });

    showConfigModal.value = false;
    await invoke("open_pingcode_login_window", {
      clientId: configForm.value.client_id,
      clientSecret: configForm.value.client_secret,
      redirectUri: "tauri://callback.wocnote.com",
    });
  } catch (error) {
    console.error("连接 PingCode 失败:", error);
  }
};

// 处理解除绑定
const handleDisconnectAccount = () => {
  pingCodeStore.clearCredentials();
  isPingCodeConnected.value = false;
  projects.value = [];
  workItems.value = [];
  allWorkItems.value = [];
  ideas.value = [];
  allIdeas.value = [];
  products.value = [];
  isExpanded.value = false;
};

// 检查PingCode账号状态
const checkPingCodeAccountStatus = () => {
  isPingCodeConnected.value =
    pingCodeStore.isAuthenticated && !pingCodeStore.isTokenExpired();
};

// 获取工作项状态样式
const getWorkItemStatusBadge = (status: any) => {
  if (!status) {
    return { text: "未知", class: "status-unknown", icon: AlertCircle };
  }

  const statusName = status.name?.toLowerCase() || "";
  const statusCategory = status.status_category?.key;

  if (
    statusCategory === "done" ||
    statusName.includes("closed") ||
    statusName.includes("done") ||
    statusName.includes("resolved")
  ) {
    return { text: status.name, class: "status-closed", icon: CheckCircle };
  } else if (
    statusCategory === "in_progress" ||
    statusName.includes("progress")
  ) {
    return { text: status.name, class: "status-progress", icon: Clock };
  } else {
    return { text: status.name, class: "status-open", icon: AlertCircle };
  }
};

// 获取需求状态样式
const getIdeaStatusBadge = (state: any) => {
  if (!state) {
    return { text: "未知", class: "status-unknown", icon: AlertCircle };
  }

  const stateName = state.name?.toLowerCase() || "";
  const stateType = state.type?.toLowerCase();

  if (
    stateType === "done" ||
    stateName.includes("closed") ||
    stateName.includes("done") ||
    stateName.includes("resolved")
  ) {
    return { text: state.name, class: "status-closed", icon: CheckCircle };
  } else if (stateType === "in_progress" || stateName.includes("progress")) {
    return { text: state.name, class: "status-progress", icon: Clock };
  } else {
    return { text: state.name, class: "status-open", icon: AlertCircle };
  }
};

// 获取优先级颜色
const getPriorityColor = (priority: any) => {
  if (!priority) return "#999";

  const priorityName = priority.name?.toLowerCase() || "";
  if (priorityName.includes("high") || priorityName.includes("高")) {
    return "#ff4d4f";
  } else if (priorityName.includes("medium") || priorityName.includes("中")) {
    return "#fa8c16";
  } else if (priorityName.includes("low") || priorityName.includes("低")) {
    return "#52c41a";
  }
  return "#999";
};

// 监听PingCode access token事件
listen<Omit<PingCodeToken, "timestamp">>("pingcode-access-token", (event) => {
  console.log("pingcode access token:", event.payload);
  showConfigModal.value = false;
  pingCodeStore.setToken(event.payload);
  setTimeout(() => {
    checkPingCodeAccountStatus();
  }, 100);
});

onMounted(() => {
  checkPingCodeAccountStatus();
});
</script>

<template>
  <div class="pingcode-integration-card">
    <div class="integration-header" @click="toggleExpansion">
      <div class="pingcode-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.5 15.5C15.5 16.03 15.28 16.53 14.9 16.9C14.52 17.28 13.99 17.5 13.5 17.5H10.5C9.5 17.5 8.68 16.97 8.43 16.11L7.6 13.88C7.35 13.02 7.88 12.2 8.74 11.95L11 11.3V8.5C11 7.95 11.45 7.5 12 7.5C12.55 7.5 13 7.95 13 8.5V11.3L15.26 11.95C16.12 12.2 16.65 13.02 16.4 13.88L15.5 16.11C15.47 16.21 15.44 16.3 15.4 16.39C15.48 16.22 15.5 16.05 15.5 15.88V15.5Z"
            fill="#0066FF"
          />
        </svg>
      </div>
      <span class="integration-title">PingCode</span>
      <span v-if="isPingCodeConnected" class="status-badge connected">
        已绑定
      </span>
      <span v-else class="status-badge">未绑定</span>
      <span class="expand-icon">
        <ChevronDown v-if="isExpanded" />
        <ChevronUp v-else />
      </span>
    </div>

    <p class="integration-description">
      连接PingCode账号，同步项目任务和进度。
    </p>

    <!-- 未绑定状态显示绑定按钮 -->
    <NButton
      v-if="!isPingCodeConnected"
      type="primary"
      class="connect-button"
      @click.stop="handleConnectAccount"
    >
      <Key class="key-icon" />
      配置连接
    </NButton>

    <!-- 已绑定状态显示解除绑定按钮 -->
    <div v-else class="connected-actions">
      <NButton
        quaternary
        class="config-button"
        @click.stop="handleConnectAccount"
      >
        <Settings class="settings-icon" />
        重新配置
      </NButton>
      <NPopconfirm @positive-click="handleDisconnectAccount">
        <template #trigger>
          <NButton type="error" class="disconnect-button">
            <LogOut class="logout-icon" />
            解除绑定
          </NButton>
        </template>
        <template #default>
          <p>确定要解除PingCode账号绑定吗？</p>
        </template>
      </NPopconfirm>
    </div>

    <!-- PingCode 展开区域 -->
    <div
      v-if="isExpanded && isPingCodeConnected"
      class="pingcode-expand-section"
    >
      <!-- 选项卡切换 -->
      <div class="tab-navigation">
        <button
          :class="['tab-button', { active: activeTab === 'ideas' }]"
          @click="activeTab = 'ideas'"
        >
          <BookOpen :size="16" />
          产品需求 ({{ filteredIdeas.length }})
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'workItems' }]"
          @click="activeTab = 'workItems'"
        >
          <List :size="16" />
          项目任务 ({{ allWorkItems.length }})
        </button>
      </div>

      <!-- 视图切换和筛选器 -->
      <div class="pingcode-controls">
        <!-- 视图模式切换（仅对任务有效） -->
        <div v-if="activeTab === 'workItems'" class="view-mode-toggle">
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
            按项目分组
          </button>
        </div>

        <!-- 筛选器 -->
        <div class="filters-section">
          <!-- 搜索框 -->
          <div class="search-filter">
            <NInput
              v-model:value="searchKeyword"
              :placeholder="
                activeTab === 'ideas' ? '搜索需求...' : '搜索工作项...'
              "
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
              :class="[
                'state-button',
                { active: getStatusFilter() === 'open' },
              ]"
              @click="setStatusFilter('open')"
            >
              进行中
            </button>
            <button
              :class="[
                'state-button',
                { active: getStatusFilter() === 'closed' },
              ]"
              @click="setStatusFilter('closed')"
            >
              已完成
            </button>
            <button
              :class="['state-button', { active: getStatusFilter() === 'all' }]"
              @click="setStatusFilter('all')"
            >
              全部
            </button>
          </div>

          <!-- 项目/产品筛选 -->
          <div class="project-filter">
            <NSelect
              v-if="activeTab === 'workItems'"
              v-model:value="selectedProjects"
              :options="projectOptions"
              placeholder="选择项目"
              multiple
              clearable
              :max-tag-count="2"
              class="project-select"
            />
            <NSelect
              v-else
              v-model:value="selectedProducts"
              :options="productOptions"
              placeholder="选择产品"
              multiple
              clearable
              :max-tag-count="2"
              class="project-select"
            />
            <NButton
              v-if="
                (activeTab === 'workItems' && selectedProjects.length > 0) ||
                (activeTab === 'ideas' && selectedProducts.length > 0)
              "
              quaternary
              size="small"
              @click="clearFilter()"
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

      <!-- 需求列表 -->
      <div v-else-if="activeTab === 'ideas'" class="ideas-view">
        <div class="work-items-summary">
          <p>共找到 {{ filteredIdeas.length }} 个需求</p>
        </div>

        <div class="ideas-list">
          <div v-for="idea in filteredIdeas" :key="idea.id" class="idea-item">
            <div class="idea-header">
              <div class="idea-title">
                <span class="product-name">{{ idea.product?.name }}</span>
                <span class="idea-identifier">{{ idea.identifier }}</span>
                {{ idea.title }}
              </div>
              <span
                :class="['idea-status', getIdeaStatusBadge(idea.state).class]"
              >
                <component
                  :is="getIdeaStatusBadge(idea.state).icon"
                  :size="14"
                />
                {{ getIdeaStatusBadge(idea.state).text }}
              </span>
            </div>

            <div class="idea-meta">
              <span class="idea-reporter">
                <User :size="14" />
                {{ idea.created_by?.display_name }}
              </span>
              <span v-if="idea.assignee" class="idea-assignee">
                负责人: {{ idea.assignee.display_name }}
              </span>
              <span
                v-if="idea.priority"
                class="idea-priority"
                :style="{ color: getPriorityColor(idea.priority) }"
              >
                优先级: {{ idea.priority.name }}
              </span>
              <span v-if="idea.score" class="idea-score">
                评分: {{ idea.score }}
              </span>
              <span v-if="idea.progress" class="idea-progress">
                进度: {{ idea.progress }}%
              </span>
            </div>

            <div v-if="idea.description" class="idea-description">
              {{
                idea.description.length > 150
                  ? idea.description.substring(0, 150) + "..."
                  : idea.description
              }}
            </div>
          </div>
        </div>

        <!-- 无数据状态 -->
        <div v-if="filteredIdeas.length === 0" class="no-data">
          <p>没有找到匹配的需求</p>
        </div>
      </div>

      <!-- 工作项列表 -->
      <div
        v-else-if="activeTab === 'workItems' && viewMode === 'flat'"
        class="flat-view"
      >
        <div class="work-items-summary">
          <p>共找到 {{ filteredWorkItems.length }} 个工作项</p>
        </div>

        <div class="work-items-list">
          <div
            v-for="item in filteredWorkItems"
            :key="item.id"
            class="work-item"
          >
            <div class="work-item-header">
              <div class="work-item-title">
                <span class="project-name">{{ item.project?.name }}</span>
                <span class="work-item-key">{{ item.identifier }}</span>
                {{ item.title }}
              </div>
              <span
                :class="[
                  'work-item-status',
                  getWorkItemStatusBadge(item.state).class,
                ]"
              >
                <component
                  :is="getWorkItemStatusBadge(item.state).icon"
                  :size="14"
                />
                {{ getWorkItemStatusBadge(item.state).text }}
              </span>
            </div>

            <div class="work-item-meta">
              <span class="work-item-reporter">
                <User :size="14" />
                {{ item.created_by?.display_name }}
              </span>
              <span v-if="item.assignee" class="work-item-assignee">
                经办人: {{ item.assignee.display_name }}
              </span>
              <span
                v-if="item.priority"
                class="work-item-priority"
                :style="{ color: getPriorityColor(item.priority) }"
              >
                优先级: {{ item.priority.name }}
              </span>
              <span v-if="item.type" class="work-item-type">
                {{ item.type }}
              </span>
            </div>

            <div v-if="item.description" class="work-item-description">
              {{
                item.description.length > 150
                  ? item.description.substring(0, 150) + "..."
                  : item.description
              }}
            </div>
          </div>
        </div>

        <!-- 无数据状态 -->
        <div v-if="filteredWorkItems.length === 0" class="no-data">
          <p>没有找到匹配的工作项</p>
        </div>
      </div>

      <!-- 分组视图 -->
      <div v-else class="grouped-view">
        <div
          v-for="(items, projectKey) in groupedWorkItems"
          :key="projectKey"
          class="project-group"
        >
          <div class="project-group-header">
            <h4 class="project-group-title">{{ projectKey }}</h4>
            <span class="project-item-count">{{ items.length }} 个工作项</span>
          </div>

          <div class="project-items-list">
            <div v-for="item in items" :key="item.id" class="work-item">
              <div class="work-item-header">
                <div class="work-item-title">
                  <span class="work-item-key">{{ item.identifier }}</span>
                  {{ item.title }}
                </div>
                <span
                  :class="[
                    'work-item-status',
                    getWorkItemStatusBadge(item.state).class,
                  ]"
                >
                  <component
                    :is="getWorkItemStatusBadge(item.state).icon"
                    :size="14"
                  />
                  {{ getWorkItemStatusBadge(item.state).text }}
                </span>
              </div>

              <div class="work-item-meta">
                <span class="work-item-reporter">
                  <User :size="14" />
                  {{ item.created_by?.display_name }}
                </span>
                <span v-if="item.assignee" class="work-item-assignee">
                  经办人: {{ item.assignee.display_name }}
                </span>
                <span
                  v-if="item.priority"
                  class="work-item-priority"
                  :style="{ color: getPriorityColor(item.priority) }"
                >
                  优先级: {{ item.priority.name }}
                </span>
                <span v-if="item.type" class="work-item-type">
                  {{ item.type }}
                </span>
              </div>

              <div v-if="item.description" class="work-item-description">
                {{
                  item.description.length > 100
                    ? item.description.substring(0, 100) + "..."
                    : item.description
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- 无数据状态 -->
        <div v-if="Object.keys(groupedWorkItems).length === 0" class="no-data">
          <p>没有找到匹配的工作项</p>
        </div>
      </div>
    </div>

    <!-- 配置弹窗 -->
    <NModal
      v-model:show="showConfigModal"
      preset="card"
      title="配置 PingCode 连接"
      style="width: 600px"
    >
      <NForm :model="configForm" label-placement="left" label-width="120px">
        <NFormItem label="API 根地址" path="api_root">
          <NInput
            v-model:value="configForm.api_root"
            placeholder="https://your-pingcode-instance.pingcode.com"
          />
        </NFormItem>
        <NFormItem label="Client ID" path="client_id">
          <NInput
            v-model:value="configForm.client_id"
            placeholder="请输入 Client ID"
          />
        </NFormItem>
        <NFormItem label="Client Secret" path="client_secret">
          <NInput
            v-model:value="configForm.client_secret"
            type="password"
            placeholder="请输入 Client Secret"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <NButton @click="showConfigModal = false">取消</NButton>
          <NButton type="primary" @click="handleSaveConfig">保存配置</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="less">
.pingcode-integration-card {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
  cursor: pointer;
  height: fit-content;
}

.pingcode-integration-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.integration-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.pingcode-icon {
  width: 24px;
  height: 24px;
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
  color: #0066ff;
  border: 1px solid #d9d9d9;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.connect-button:hover {
  border-color: #0066ff;
}

.key-icon {
  font-size: 16px;
}

.connected-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.config-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
}

.settings-icon {
  font-size: 14px;
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

/* PingCode 展开区域样式 */
.pingcode-expand-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

/* 选项卡导航 */
.tab-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 16px;
}

.tab-button {
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

.tab-button:hover {
  border-color: #0066ff;
  color: #0066ff;
}

.tab-button.active {
  background: #0066ff;
  color: #fff;
  border-color: #0066ff;
}

/* 控制区域样式 */
.pingcode-controls {
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
  border-color: #0066ff;
  color: #0066ff;
}

.view-button.active {
  background: #0066ff;
  color: #fff;
  border-color: #0066ff;
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
  border-color: #0066ff;
  color: #0066ff;
}

.state-button.active {
  background: #0066ff;
  color: #fff;
  border-color: #0066ff;
}

.project-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.project-select {
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
}

.work-items-summary {
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f0f8ff;
  border-radius: 6px;
  font-size: 14px;
  color: #0066ff;
}

.work-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.work-item {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

.work-item:hover {
  background: #f0f0f0;
  border-color: #0066ff;
}

.work-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
}

.work-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #222;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-name {
  font-size: 12px;
  color: #0066ff;
  background: #e6f7ff;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.work-item-key {
  color: #0066ff;
  font-weight: 500;
}

.work-item-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.work-item-status.status-open {
  background: #fff7e6;
  color: #fa8c16;
}

.work-item-status.status-progress {
  background: #e6f7ff;
  color: #1890ff;
}

.work-item-status.status-closed {
  background: #f6ffed;
  color: #52c41a;
}

.work-item-status.status-unknown {
  background: #f5f5f5;
  color: #999;
}

.work-item-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.work-item-reporter {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.work-item-assignee {
  color: #0066ff;
  font-weight: 500;
}

.work-item-priority {
  font-weight: 500;
}

.work-item-type {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  background: #f0f0f0;
  color: #666;
}

.work-item-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  word-break: break-word;
}

/* 分组视图样式 */
.grouped-view {
}

.project-group {
  margin-bottom: 24px;
}

.project-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0f8ff;
  border-radius: 6px;
  border-left: 4px solid #0066ff;
}

.project-group-title {
  font-size: 15px;
  font-weight: 600;
  color: #0066ff;
  margin: 0;
}

.project-item-count {
  font-size: 12px;
  color: #666;
  background: #fff;
  padding: 2px 8px;
  border-radius: 12px;
}

.project-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 16px;
}

/* 需求列表样式 */
.ideas-view {
  max-height: 600px;
  overflow-y: auto;
}

.ideas-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.idea-item {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

.idea-item:hover {
  background: #f0f0f0;
  border-color: #0066ff;
}

.idea-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
}

.idea-title {
  font-size: 14px;
  font-weight: 500;
  color: #222;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.idea-identifier {
  color: #0066ff;
  font-weight: 500;
}

.idea-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.idea-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.idea-reporter {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.idea-assignee {
  color: #0066ff;
  font-weight: 500;
}

.idea-priority {
  font-weight: 500;
}

.idea-score {
  font-weight: 500;
  color: #1890ff;
}

.idea-progress {
  font-weight: 500;
  color: #52c41a;
}

.idea-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  word-break: break-word;
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
  .project-filter {
    min-width: auto;
  }

  .state-filter {
    justify-content: center;
  }

  .work-item-header,
  .idea-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .work-item-meta,
  .idea-meta {
    flex-direction: column;
    gap: 6px;
  }

  .tab-navigation {
    flex-direction: column;
  }
}
</style>
