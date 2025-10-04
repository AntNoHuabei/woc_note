<script setup lang="ts">
import { onMounted } from "vue";
import { useThemeStore, type Theme } from "../../store/theme";
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from "element-plus";
import { SunMoon, Moon, Sun } from "lucide-vue-next";
const themeStore = useThemeStore();

// 切换主题
const changeTheme = (theme: Theme) => {
  themeStore.changeTheme(theme);
};

onMounted(() => {
  // 在组件挂载时初始化主题
  themeStore.initTheme();
});

// 获取当前主题文字
const getThemeTitle = () => {
  switch (themeStore.currentTheme) {
    case "system":
      return "跟随系统";
    case "light":
      return "明亮主题";
    case "dark":
      return "黑暗主题";
    default:
      return "切换主题";
  }
};
</script>

<template>
  <ElDropdown
    @command="(theme: Theme) => changeTheme(theme)"
    class="status-bar-item"
  >
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem command="system" icon="Monitor">
          <SunMoon :size="18" />
        </ElDropdownItem>
        <ElDropdownItem command="light" icon="Sun">
          <Sun :size="18" />
        </ElDropdownItem>
        <ElDropdownItem command="dark" icon="Moon">
          <Moon :size="18" />
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped>
.el-dropdown-link {
  display: flex;
  align-items: center;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.el-dropdown-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 调整下拉菜单样式以适应状态栏 */
:deep(.el-dropdown-menu) {
  min-width: 120px;
  background-color: rgba(30, 30, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.el-dropdown-menu__item) {
  color: #fff;
  padding: 8px 16px;
  font-size: 12px;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: rgba(255, 255, 255, 0.1);
}

:deep(.el-dropdown-menu__item.is-active) {
  background-color: rgba(52, 152, 219, 0.7);
}

/* 黑暗主题适配 */
:global(body.theme-dark) :deep(.el-dropdown-menu) {
  background-color: rgba(26, 26, 26, 0.95);
}
</style>
