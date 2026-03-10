<template>
  <div class="zg-logo-2-parent">
      <img class="logo" alt="" src="../images/ZG_logo 2.png" />
      <div class="parent">
          <img class="icon" alt="" src="../images/未标题-1.png" />
          <div class="n-name">多模态数据智能融合与分析系统</div>
      </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent } from "vue"
  export default defineComponent({ name: "my-title" })
</script>

<style scoped>
.zg-logo-2-parent {
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
}

.logo {
  position: relative;
  left: 2%;
  top: 10%;
  height:80%;
  width: auto;
  object-fit: contain;
}

.parent {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  margin-left: 25px;
}

.icon {
  height: 70%;
  width: auto;
  object-fit: contain;  /* 保持图片的纵横比 */
  align-self: flex-start; /* 确保在最左侧对齐 */
}

.n-name {
  margin-top: 2%;
  height: 10%;
  white-space: nowrap;
  display: flex;
  align-items: center;
  font-size: clamp(1px, 2vw, 1.5rem); /* 自适应字体大小 */
  align-self: flex-start; /* 确保在最左侧对齐 */
}
</style>
