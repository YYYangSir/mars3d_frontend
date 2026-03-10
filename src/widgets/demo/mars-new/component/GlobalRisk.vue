<template>
  <div class="div5">
    <div class="div4">全球风险统计</div>
    <div class="rectangle-div"></div>
    <div class="child1"></div>
    <div class="child2"></div>
    <img class="subtract-icon" alt="" src="../images/Subtract.svg" />
    <div class="child3"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
export default defineComponent({
  name: "GlobalRisk"
})
</script>

<style scoped>
.div5 {
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
  margin-bottom: 20px;
}

.div4 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.rectangle-div {
  width: 100%;
  height: 50px;
  background-color: #e0e0e0;
  margin-bottom: 10px;
}

.child1,
.child2,
.child3 {
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
