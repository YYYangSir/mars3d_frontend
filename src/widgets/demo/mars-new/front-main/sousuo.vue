<template>
  <div class="child">
    <img class="chevron-right-icon" alt="" src="../images/Chevron right.svg" />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from "vue"
  export default defineComponent({ name: "Group" })
</script>

<style scoped>
      .child {
        position: relative;
        border-radius: 10px;
        background-color: #fff;
        width: 95%; /* 减少宽度以容纳间隔 */
        margin-left: 2.5%; /* 左侧间隔 */
        margin-right: 2.5%; /* 右侧间隔 */
        height: 2.05rem;
        display: flex;
        align-items: center;
      }
      .chevron-right-icon {
          position: absolute;
          right: 0.5rem;
          width: 2.275rem;
          height: 2.188rem;
      }
</style>
