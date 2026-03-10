<template>
  <div class="div9">
    <div class="div10">
      <div class="div11">
        <div class="wrapper">
          <img class="icon2" alt="" src="../images/1.png" />
        </div>
        <div class="frame-div">
          <div class="container">
            <div class="div12">
              这里是多模态数据智能融合与分析系统智能助手，你可以咨询我你想问的一切问题，我会尽量回答你。
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
export default defineComponent({
  name: "Assistant"
})
</script>

<style scoped>
.div9 {
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
}

.div10 {
  display: flex;
  align-items: center;
}

.div11 {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wrapper {
  margin-bottom: 10px;
}

.icon2 {
  width: 50px;
  height: 50px;
}

.frame-div {
  width: 100%;
  background-color: #e0e0e0;
  padding: 10px;
  border-radius: 8px;
}

.container {
  font-size: 14px;
  color: #333;
}

.div12 {
  text-align: center;
}
</style>
