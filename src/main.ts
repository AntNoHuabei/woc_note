import { createApp } from "vue";
import App from "./App.vue";
import pinia, { usePingCodeStore } from "./store/index";

import { useNotesStore } from "./store/notes";
import { useGithubStore } from "./store/github"; // 导入 github store

import naive from "naive-ui";

const app = createApp(App);
app.use(naive);
app.use(pinia); // 先于其他插件使用Pinia
app.mount("#app");

// 初始化加载数据
const notesStore = useNotesStore();
notesStore.loadFromDatabase();

// 初始化 GitHub store
const githubStore = useGithubStore();
githubStore.initialize();

const pingcodeStore = usePingCodeStore();
pingcodeStore.initialize();
