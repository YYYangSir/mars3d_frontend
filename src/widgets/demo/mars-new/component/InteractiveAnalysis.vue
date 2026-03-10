<template>
  <div class="div7">
    <div class="div8">交互式情报分析</div>
    <div class="child8"></div>
    <div class="child9"></div>
    <div class="child10"></div>
    <img class="subtract-icon" alt="" src="../images/Subtract.svg" />
    <div class="child11"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
export default defineComponent({
  name: "InteractiveAnalysis"
})
</script>

<style scoped>
.div7 {
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
  margin-bottom: 20px;
}

.div8 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.child8,
.child9,
.child10,
.child11 {
  width: 30px;
  height: 30px;
  background-color: #d0d0d0;
  margin-right: 5px;
  display: inline-block;
}

.subtract-icon {
  width: 20px;
  height: 20px;
  margin-left: 10px;
}
</style>
