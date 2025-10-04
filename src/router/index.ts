import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import NotesPage from "../views/NotesPage.vue";
import WorkContentPage from "../views/WorkContentPage.vue";
import CodeRepositoryPage from "../views/CodeRepositoryPage.vue";
import WeeklyReportPage from "../views/WeeklyReportPage.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/notes",
  },
  {
    path: "/notes",
    name: "Notes",
    component: NotesPage,
  },
  {
    path: "/work-content",
    name: "WorkContent",
    component: WorkContentPage,
  },
  {
    path: "/code-repository",
    name: "CodeRepository",
    component: CodeRepositoryPage,
  },
  {
    path: "/weekly-report",
    name: "WeeklyReport",
    component: WeeklyReportPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
