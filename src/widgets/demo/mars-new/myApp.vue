<template>
  <div>
    <!-- 使用注册的键名my-title作为标签名 -->
    <my-title />
    <!-- 使用 my-3group 组件 -->
    <my-3group />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
// 导入 my-title 组件，变量名可以任意
import MyTitle from "./my-title/index.vue"
// 导入 my-3group 组件
import My3Group from "./my-3group/index.vue"

export default defineComponent({
  components: {
    // 注册名为 my-title（键名） 的组件
    "my-title": MyTitle,
    // 注册名为 my-3group 的组件
    "my-3group": My3Group
  }
})
</script>

<style scoped>
/* 可以在这里添加 App.vue 的全局样式 */
</style>
