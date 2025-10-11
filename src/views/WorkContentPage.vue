<script setup lang="ts">
import { ref } from "vue";
// import { useAppStore } from "../store/app"; // 暂时注释，后续可能需要使用
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-vue-next";
import { NButton } from "naive-ui";
import GitHubIntegration from "../components/GitHubIntegration.vue";
import PingCodeIntegration from "../components/PingCodeIntegration.vue";

// const appStore = useAppStore(); // 暂时注释，后续可能需要使用

// 模拟数据 - 今日推荐工作安排，添加来源和完成状态
const workSchedule = ref<WorkItem[]>([
  {
    id: "1",
    time: "09:00 - 10:30",
    title: "修复移动端响应式布局问题",
    description: "优先处理逾期任务，解决移动端显示问题",
    source: "系统任务",
    sourceType: "system",
    completed: false,
  },
  {
    id: "2",
    time: "10:30 - 12:00",
    title: "完成优化方案开发和测试",
    description: "继续进行数据可视化模块的优化工作",
    source: "PingCode",
    sourceType: "pingcode",
    completed: false,
  },
  {
    id: "3",
    time: "14:00 - 16:00",
    title: "集成第三方平台数据同步功能",
    description: "开始进行GitHub/PingCode的集成工作",
    source: "GitHub",
    sourceType: "github",
    completed: false,
  },
]);

// 获取当前日期
const currentDate =
  new Date()
    .toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "年")
    .replace(/\//, "月") + "日";


// 处理生成工作安排
const handleGenerateSchedule = () => {
  // 实际项目中这里会调用相关API生成工作安排
  console.log("生成工作安排");
};


// 处理添加更多集成
// const handleAddMoreIntegration = () => {
//   // 实际项目中这里会打开添加集成的弹窗或页面
//   console.log("添加更多集成");
// };

// 处理任务完成状态切换
const toggleTaskCompletion = (id: string) => {
  const task = workSchedule.value.find((item) => item.id === id);
  if (task) {
    task.completed = !task.completed;
  }
};

// 获取来源图标颜色
const getSourceColor = (sourceType: string): string => {
  switch (sourceType) {
    case "github":
      return "#24292e";
    case "pingcode":
      return "#0066FF";
    case "system":
      return "#1890ff";
    default:
      return "#999";
  }
};

</script>

<template>
  <div class="main-container">
    <!-- 第三方平台集成区域 -->
    <div class="integration-section">
      <h2>第三方平台绑定</h2>
      <div class="integration-cards">
        <!-- GitHub 集成组件 -->
        <GitHubIntegration />

        <!-- PingCode 集成组件 -->
        <PingCodeIntegration />

        <!-- 添加更多集成卡片 -->
        <!-- <div class="integration-card add-integration">
          <div class="add-icon-container" @click="handleAddMoreIntegration">
            <Plus class="add-icon" />
          </div>
          <p class="add-integration-text">添加更多集成</p>
        </div> -->
      </div>
    </div>

    <!-- 智能工作安排区域 -->
    <div class="work-schedule-section">
      <h2>智能工作安排</h2>
      <div class="schedule-intro">
        <p>基于您的工作习惯，为您智能生成工作计划</p>
        <p class="schedule-description">
          根据您的任务优先级、截止日期和工作模式，智能推荐最优工作安排
        </p>
        <NButton
          type="primary"
          class="generate-button"
          @click="handleGenerateSchedule"
        >
          <Calendar class="calendar-icon" />
          生成工作安排
        </NButton>
      </div>

      <!-- 今日推荐工作安排 -->
      <div class="today-schedule">
        <div class="today-schedule-header">
          <h3>今日推荐工作安排</h3>
          <span class="current-date">{{ currentDate }}</span>
        </div>
        <div class="schedule-list">
          <div
            v-for="item in workSchedule"
            :key="item.id"
            class="schedule-item"
            :class="{ completed: item.completed }"
          >
            <div
              class="schedule-checkbox"
              @click.stop="toggleTaskCompletion(item.id)"
            >
              <CheckCircle2 v-if="item.completed" class="checkbox-checked" />
              <Circle v-else class="checkbox-unchecked" />
            </div>
            <div class="schedule-time">{{ item.time }}</div>
            <div class="schedule-content">
              <div class="schedule-title-container">
                <h4 class="schedule-title">{{ item.title }}</h4>
                <span class="source-badge">
                  <span
                    class="source-icon"
                    :style="{ color: getSourceColor(item.sourceType) }"
                  >
                    <Github v-if="item.sourceType === 'github'" :size="14" />
                    <Clock
                      v-else-if="item.sourceType === 'system'"
                      :size="14"
                    />
                    <svg
                      v-else
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.5 15.5C15.5 16.03 15.28 16.53 14.9 16.9C14.52 17.28 13.99 17.5 13.5 17.5H10.5C9.5 17.5 8.68 16.97 8.43 16.11L7.6 13.88C7.35 13.02 7.88 12.2 8.74 11.95L11 11.3V8.5C11 7.95 11.45 7.5 12 7.5C12.55 7.5 13 7.95 13 8.5V11.3L15.26 11.95C16.12 12.2 16.65 13.02 16.4 13.88L15.5 16.11C15.47 16.21 15.44 16.3 15.4 16.39C15.48 16.22 15.5 16.05 15.5 15.88V15.5Z"
                      />
                    </svg>
                  </span>
                  {{ item.source }}
                </span>
              </div>
              <p class="schedule-desc">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.main-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  // gap: 32px;
}

/* 第三方平台集成样式 */
.integration-section {
  background: #fff;
  // border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.integration-section h2 {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: #222;
}

.integration-cards {
  display: flex;
  flex-direction: column; /* 将水平排列改为垂直排列 */
  gap: 16px; /* 减小卡片之间的间距 */
}

.integration-card {
  flex: none; /* 取消弹性伸缩 */
  width: 100%; /* 宽度占满父容器 */
  // max-width: 600px; /* 可选：限制最大宽度，使卡片在宽屏下不会太宽 */
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
  cursor: pointer;
  height: fit-content; // 确保卡片高度一致
}

.integration-card:hover {
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

.add-integration {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  border: 1px dashed #d9d9d9;
  background: #fafafa;
}

.add-icon-container {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d9d9d9;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.add-icon-container:hover {
  border-color: #1890ff;
}

.add-icon {
  color: #999;
  font-size: 20px;
}

.add-integration-text {
  font-size: 14px;
  color: #999;
}


/* 智能工作安排样式 */
.work-schedule-section {
  background: #fff;
  // border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.work-schedule-section h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: #222;
}

.schedule-intro {
  background: #e6f7ff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.schedule-intro p:first-child {
  font-size: 16px;
  font-weight: 500;
  color: #222;
  margin: 0 0 8px 0;
}

.schedule-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.generate-button {
  background: #1890ff;
  height: 44px;
  padding: 0 20px;
  font-size: 14px;
  transition: all 0.3s;
}

.generate-button:hover {
  background: #40a9ff;
}

.calendar-icon {
  margin-right: 6px;
  font-size: 16px;
}

.today-schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.today-schedule-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  margin: 0;
}

.current-date {
  font-size: 14px;
  color: #999;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
  align-items: flex-start;
}

.schedule-item:hover {
  background: #f0f0f0;
}

/* 完成状态样式 */
.schedule-item.completed {
  background: #f6ffed;
}

.schedule-item.completed .schedule-title,
.schedule-item.completed .schedule-desc {
  text-decoration: line-through;
  color: #999;
}

/* 复选框样式 */
.schedule-checkbox {
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
  color: #d9d9d9;
  transition: all 0.3s;
}

.schedule-checkbox:hover {
  color: #1890ff;
}

.checkbox-checked {
  color: #52c41a;
}

.checkbox-checked:hover {
  color: #73d13d;
}

.schedule-time {
  font-size: 14px;
  color: #666;
  min-width: 100px;
  flex-shrink: 0;
}

.schedule-content {
  flex: 1;
}

/* 任务标题和来源容器 */
.schedule-title-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;
  gap: 12px;
}

.schedule-title {
  font-size: 15px;
  font-weight: 500;
  color: #222;
  margin: 0;
  flex: 1;
}

/* 来源徽章样式 */
.source-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  border-radius: 4px;
  flex-shrink: 0;
  gap: 4px;
}

.source-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-container {
    padding: 16px;
    gap: 24px;
  }

  .integration-cards {
    flex-direction: column;
  }

  .integration-card {
    min-width: 100%;
  }

  .schedule-item {
    flex-direction: column;
    gap: 8px;
  }

  .schedule-time {
    min-width: auto;
  }

  .schedule-title-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .source-badge {
    align-self: flex-start;
  }
}
</style>
