import type { RouteRecordRaw } from "vue-router"
import { createRouter, createWebHashHistory } from "vue-router"

const routes: RouteRecordRaw[] = [
  { name: "home", path: "/111", component: () => import("./views/home.vue") },
  { name: "map", path: "/map", component: () => import("./views/map.vue") },
  { name: "widget", path: "/", component: () => import("./views/widget.vue") }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})
