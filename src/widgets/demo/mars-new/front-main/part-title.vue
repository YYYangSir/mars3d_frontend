<template>
  <div class="part-title">
    <div class="header">
      <img class="subtract-icon" alt="" src="../images/Subtract.png" />
      <div class="title">{{ title }}</div>
    </div>
    <div class="divider-container">
      <div class="divider-main"></div>
      <div class="divider-accent"></div>
      <div class="divider-highlight"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "part-title",
  props: {
    title: {
      type: String,
      default: "事件概要"
    }
  }
})
</script>

<style scoped>
.part-title {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.title {
  font-weight: 600;
  font-size: clamp(14px, 1.2vw, 18px);
  color: #fff;
}

.subtract-icon {
  width: clamp(16px, 1.5vw, 20px);
  height: clamp(16px, 1.5vw, 20px);
  margin-right: 10px;
}

.divider-container {
  position: relative;
  width: 100%;
  height: 3px;
}

.divider-main {
  position: absolute;
  left: 0;
  top: 0;
  background-color: rgba(255, 255, 255, 0.5);
  width: 100%;
  height: 3px;
}

.divider-accent {
  position: absolute;
  right: 0;
  top: 0;
  background-color: #18fefe;
  width: 12px;
  height: 3px;
}

.divider-highlight {
  position: absolute;
  left: 0;
  top: 0;
  background-color: #fff;
  width: 34px;
  height: 3px;
}
</style>
