<template>
  <div class="title">
    <div class="title-inner">
      <div class="zg-logo-2-parent">
        <img class="zg-logo-2-icon" alt="" src="../images/ZG_logo 2.png" />
        <div class="parent">
          <img class="icon" alt="" src="../images/未标题-1.png" />
          <div class="div2">多模态数据智能融合与分析系统</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
export default defineComponent({
  name: "toptitle"
})
</script>

<style scoped>
.title {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  background-color: #f5f5f5;
}

.zg-logo-2-icon {
  width: 80px;
  margin-right: 10px;
}

.icon {
  width: 50px;
  margin-right: 10px;
}

.div2 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
</style>
