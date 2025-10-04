import { createApp } from "vue";
import App from "./App.vue";
import pinia from "./store/index";

import { useNotesStore } from "./store/notes";

import naive from "naive-ui";

const app = createApp(App);
app.use(naive);
app.use(pinia); // 先于其他插件使用Pinia
app.mount("#app");

// 初始化加载数据
const notesStore = useNotesStore();
notesStore.loadFromDatabase();
