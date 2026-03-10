<template>
  <div class="top-box" />
  <div class="left-box" />
  <div class="right-box" />
</template>

<script lang="ts">
import { defineComponent } from "vue"
export default defineComponent({
  name: "my-3group"
})
</script>

<style scoped>
/* 顶部框：由上至下渐变 */
.top-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8%;
  background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.9),
      rgba(0, 0, 0, 0.6)
    ), /* 上到下渐变 */
    linear-gradient(
      to right,
      rgba(0, 0, 0, 0.9),
      rgba(0, 0, 0, 0.5),
      rgba(0, 0, 0, 0.9)
    ); /* 左右渐变 */
  background-blend-mode: overlay; /* 混合模式 */
  color: white;
  z-index: 1; /* 设置较低的层级 */
}

/* 左侧框：由左至右渐变 */
.left-box {
  position: absolute;
  top: 8%;
  left: 0;
  width: 25%;
  height: 100%;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.5)); /* 左到右渐变 */
  color: white;
  z-index: 1; /* 设置较低的层级 */
}

/* 右侧框：由右至左渐变 */
.right-box {
  position: absolute;
  top: 8%;
  right: 0;
  width: 20%;
  height: 100%;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.5)); /* 右到左渐变 */
  color: white;
  z-index: 1; /* 设置较低的层级 */
}
</style>

<!-- .top-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 1; /* 设置较低的层级 */
}
.left-box {
  position: absolute;
  top: 8%;
  left: 0;
  width: 25%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 1; /* 设置较低的层级 */
}
.right-box {
  position: absolute;
  top: 8%;
  right: 0;
  width: 20%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 1; /* 设置较低的层级 */
}
</style> -->
