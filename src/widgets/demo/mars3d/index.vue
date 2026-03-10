<template>
  <div class="container">
    <!--事件预警框 -->
    <div class="dialog alert-dialog">
      <h3 class="dialog-title">事件预警框</h3>
      <div class="dialog-content">
        <div class="dialog-content">
          <table class="alert-table">
            <tbody>
              <tr v-for="(row, rowIndex) in Array.from({length:12}, (_,i)=>i+1)" :key="rowIndex">
                <td v-for="(col, colIndex) in Array.from({length:3}, (_,i)=>i+1)" :key="colIndex">
                  行{{ rowIndex }}列{{ colIndex }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 大模型对话框 -->
    <div class="dialog model-dialog">
      <h3 class="dialog-title">大模型对话框</h3>
      <div class="dialog-content">
        <!-- 内容占位 -->
        <mars-button type="primary" icon="ios-person-add" long @click="test_function()">新增数据</mars-button>
        <p style="color: #333; font-size: 14px; margin: 10px 0;">
          AI 对话区域
          <span style="color: #900">（测试标记 111）</span>
        </p>
      </div>
    </div>

    <!-- 详情展示框 -->
    <div class="dialog detail-dialog">
      <h3 class="dialog-title">界面详情展示框</h3>
      <div class="dialog-content">
        <!-- 内容占位 -->
        <!-- 在详情展示框中添加图片展示区域 -->
        <div class="dialog detail-dialog">
          <h3 class="dialog-title">界面详情展示框</h3>
          <div class="dialog-content">
            <!-- 图片上传组件 -->
            <div class="image-uploader">
              <button @click="handleUploadClick" class="upload-btn">上传图片</button>
              <input type="file" accept="image/*" @change="handleFileUpload" ref="fileInput" class="hidden-input">
            </div>

            <!-- 图片展示容器 -->
            <div class="image-container">
              <img :src="previewImage" alt="预览" v-if="previewImage" class="responsive-image">
              <div v-if="previewImage" class="zoom-btn" @click="showZoom = true">+</div>
            </div>

            <!-- 放大查看遮罩层 -->
            <div v-if="showZoom" class="zoom-overlay" @click="showZoom = false">
              <img :src="previewImage" alt="放大查看" class="zoomed-image">
            </div>
          </div>
        </div>
        <!-- # 前端表格 -->
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
// 暂时不需要逻辑代码

import { ref, onMounted } from "vue"
import * as mapWork from "./map"
import useLifecycle from "@mars/common/uses/use-lifecycle"
import { useWidget } from "@mars/common/store/widget"
import { extendChartView } from "echarts"
import qs from "qs"
import axios from "axios"

useLifecycle(mapWork)

// 文件上传功能
const previewImage = ref<string | null>(null)
const showZoom = ref<boolean>(false)
// 显式声明ref类型 [[3]][[4]][9]
const fileInput = ref<HTMLInputElement | null>(null)

// 新增点击处理函数
const handleUploadClick = () => {
  fileInput.value?.click() // 使用可选链操作符 [[9]]
}

// 文件上传处理 [[2]][[5]]
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target?.result as string
    }
    reader.readAsDataURL(target.files[0])
  }
}

</script>

<style lang="less"></style>
<style scoped>
/* 基础容器 */
.container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #f0f2f5;
}

/* 通用对话框样式 */
.dialog {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 16px;
  overflow: hidden;
}

.dialog-title {
  margin: 0 0 12px 0;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.dialog-content {
  height: calc(100% - 40px);
  overflow-y: auto;
}

/* 事件预警框定位 */
.alert-dialog {
  width: 25vw;  /* 页面宽度1/4 */
  height: 47vh; /* 页面高度1/2 */
  left: 60px;
  top: 20px;
}
/* 事件预警中的表格样式 */
.alert-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.alert-table td {
  border: 1px solid #eee;
  padding: 8px;
  text-align: center;
  color: #000; /* 文字颜色改为黑色 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-table tr:nth-child(odd) {
  background-color: #e6f3ff; /* 浅蓝色 */
}

.alert-table tr:nth-child(even) {
  background-color: #ffffff; /* 白色 */
}


/* 大模型对话框定位 */
.model-dialog {
  width: 25vw;
  height: 47vh;
  left: 60px;
  bottom: 20px;
}

/* 详情展示框定位 */
.detail-dialog {
  width: 25vw;
  height: calc(100vh - 40px); /* 上下留20px边距 */
  right: 20px;
  top: 20px;
}
/* 图片上传组件样式 */
.image-uploader {
  margin-bottom: 16px;
}

.upload-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.hidden-input {
  display: none; /* 隐藏原生文件选择框 [[3]] */
}

.image-container {
  position: relative;
  max-width: 100%;
  margin: 0 auto;
}

.responsive-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 4px; /* 保持与设计系统一致 */
}

.zoom-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
}

.zoom-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.zoomed-image {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  animation: zoomIn 0.3s ease;
}

@keyframes zoomIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}


/* 响应式处理 */
@media (max-width: 768px) {
  .dialog {
    width: 90vw !important;
    height: auto !important;
    position: static !important;
    margin: 10px auto;
  }
}
</style>

/* 大模型窗口的增加数据按钮 */
<script lang="ts">
export default {
  name: "AddressModalForDir",
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      createDirName: "/path/demo",
      creatDirShow: false,
      showtext: "成功接受到请求",
      selectedFilename: null,
      list: {},
      hoverActive: 0,
      clickActive: 0
    }
  },

  mounted() {
    // this.loadMenu("/share/rbh", null, "nextDir")
  },

  methods: {
            test_function() {
      const postData = qs.stringify({
        imagePath: this.createDirName
      })
      console.log("发送的数据：", postData) // 调试日志

      axios.post("file-test/", postData)
        .then(response => {
          console.log("响应数据：", response.data) // 调试日志
          if (response.data.result && response.data.result.message) {
            this.showtext = response.data.result.message
          } else {
            this.showtext = "后端返回数据格式不正确"
          }
        })
        .catch(error => {
          console.error("请求失败：", error)
          this.showtext = "请求失败，请检查网络或后端服务"
        })
      }
  }
}
</script>
