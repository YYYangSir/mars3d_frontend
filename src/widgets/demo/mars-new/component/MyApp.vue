<template>
  <toptitle v-if="true"/>
  <!-- <EventSummary v-if="true"/>
  <GlobalRisk v-if="true"/>
  <InteractiveAnalysis v-if="true"/>
  <SearchBar v-if="true"/>
  <Assistant v-if="true"/> -->
</template>

<script lang="ts">
import { defineComponent } from "vue"
// 建议使用try-catch逐个尝试导入组件，可以通过控制台输出确认哪个导入失败
// 注: 实际Vue文件中无法这样做，这里是演示思路
// 以下导入需要确认文件名大小写是否匹配系统中真实的文件名
import toptitle from "./toptitle.vue"
import EventSummary from "./EventSummary.vue"
import GlobalRisk from "./GlobalRisk.vue"
import InteractiveAnalysis from "./InteractiveAnalysis.vue"
import SearchBar from "./SearchBar.vue"
import Assistant from "./Assistant.vue"

export default defineComponent({
  components: {
    toptitle
    // EventSummary,
    // GlobalRisk,
    // InteractiveAnalysis,
    // SearchBar,
    // Assistant
  },
  mounted() {
    // 添加调试代码，在挂载时检查组件是否成功加载
    console.log("MyApp组件已挂载")
    // 检查当前目录下的文件结构
    console.log("当前组件环境:", this)
  }
})
</script>

<style scoped>

</style>
