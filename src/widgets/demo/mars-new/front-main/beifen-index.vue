<template>
  <div class="top-box">
    <div class="top-title">
      <my-title></my-title>
    </div>
  </div>
  <div class="left-box" >
    <!-- 在左侧盒子顶部位置添加事件概要标题 -->
    <div class="left-top-content">
      <part-title title="事件概要"></part-title>
    </div>

    <!-- 表格容器移至此处，位于left-top-content下方 -->
    <!-- <div class="sit-table-container">
        <div class="div">
          <div class="wrapper">
            <div class="div1">
              <div class="table-header">
                <div class="header-item">事件标签</div>
                <div class="header-item">时间</div>
                <div class="header-item">相关目标</div>
                <div class="header-item">事件概述</div>
              </div>
           </div>
          </div>
        </div>
      </div> -->

    <!-- 添加事件展示区域 -->
    <div class="event-display-container">
      <div v-if="events.length > 0" class="event-list">
        <div v-for="event in events" :key="event.id" class="event-item">
          <div class="event-header">
            <span class="event-label-tag">{{ event.label }}</span>
            <span class="event-time-tag">{{ formatTime(event.time) }}</span>
          </div>
          <div class="event-content">
            <div class="event-target">相关目标: {{ event.target }}</div>
            <div class="event-summary">{{ event.summary }}</div>
          </div>
        </div>
      </div>
      <div v-else class="no-events">加载事件数据中...</div>
    </div>

    <!-- 在左侧盒子中间位置添加交互式情报分析标题 -->
    <div class="left-middle-content">
      <part-title title="交互式情报分析"></part-title>

      <!-- 添加大模型对话界面 -->
      <div class="llm-chat-container">
        <!-- 对话历史区域 -->
        <div class="chat-history" ref="chatHistory">
          <div v-if="chatMessages.length === 0" class="empty-chat">
            <p>与AI助手开始对话，获取情报分析支持</p>
          </div>
          <div v-for="(message, index) in chatMessages" :key="index" class="chat-message" :class="message.role">
            <div class="message-header">
              <span class="role-badge">{{ message.role === 'user' ? '我' : selectedModel }}</span>
              <span class="message-time">{{ message.time }}</span>
            </div>
            <div class="message-content" v-html="formatMessage(message.content)"></div>
          </div>
          <div v-if="isLoading" class="loading-indicator">
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <textarea
            v-model="userInput"
            class="user-input"
            placeholder="输入您的指令..."
            @keydown.enter.ctrl="sendMessage"
            ref="userInputArea"
          ></textarea>
          <div class="input-buttons">
            <button class="send-button" @click="sendMessage" :disabled="isLoading || !userInput.trim()">
              <span>发送</span>
            </button>
            <div class="model-selector">
              <button class="model-select-button" @click="toggleModelDropdown">
                {{ selectedModel }} <span class="dropdown-arrow">▼</span>
              </button>
              <div class="model-dropdown" v-if="showModelDropdown">
                <div
                  v-for="model in availableModels"
                  :key="model.id"
                  class="model-option"
                  :class="{ 'selected': selectedModel === model.name }"
                  @click="selectModel(model)"
                >
                  {{ model.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加 sousuo 组件在底部 -->
    <div class="left-bottom-content">
      <sousuo-component></sousuo-component>
    </div>
  </div>
  <div class="right-box">
    <!-- 在右侧盒子顶部添加风险详情展示标题 -->
    <div class="right-top-content">
      <part-title title="风险详情展示"></part-title>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from "vue"
import PartTitle from "./part-title.vue"
import sousuoComponent from "./sousuo.vue"
import MyTitle from "../my-title/title.vue"
import axios from "axios"
import qs from "qs"

export default defineComponent({
  name: "my-3group",
  components: {
    PartTitle,
    sousuoComponent,
    MyTitle
  },
  data() {
    return {
      events: [], // 存储事件数据
      showtext: "", // 用于显示后端消息

      // 新增大模型对话相关数据
      userInput: "",
      chatMessages: [],
      isLoading: false,
      selectedModel: "deepseekR1", // 默认选择的模型
      showModelDropdown: false,
      availableModels: [
        { id: "deepseekR1", name: "deepseekR1" },
        { id: "deepseekv3", name: "deepseekv3" },
        { id: "dboua", name: "豆包" },
        { id: "qwen2.5-max", name: "qwen2.5-max" },
        { id: "gpt-4o", name: "gpt-4o" },
        { id: "claude3.5", name: "Claude3.5" },
        { id: "claude3.7", name: "Claude3.7" }
      ]
    }
  },
  mounted() {
    // 组件挂载时自动获取事件数据
    this.getEvents()
  },
  methods: {
    getEvents() {
      console.log("开始获取事件数据")
      // 向后端API发送GET请求
      axios.get("event-add/")
        .then(response => {
          console.log("事件数据响应：", response.data)

          if (response.data.events) {
            // 数据获取成功，更新组件状态
            this.events = response.data.events
            this.showtext = response.data.message || "获取事件数据成功"
          } else {
            // 响应格式不符合预期
            this.events = []
            this.showtext = "后端返回数据格式不正确"
            console.error("事件数据格式错误：", response.data)
          }
        })
        .catch(error => {
          // 请求失败处理
          console.error("获取事件数据失败：", error)
          this.showtext = "请求失败，请检查网络或后端服务"
          this.events = []
        })
    },

    // 格式化时间显示
    formatTime(timeStr) {
      if (!timeStr || timeStr === "当前" || timeStr === "未知时间") { return timeStr }
      try {
        const date = new Date(timeStr)
        return date.toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      } catch (e) {
        return timeStr
      }
    },

    // 修正大模型对话相关方法
    sendMessage() {
      if (!this.userInput.trim() || this.isLoading) { return }

      const userMessage = this.userInput.trim()
      const currentTime = new Date().toLocaleTimeString()

      // 添加用户消息到对话历史
      this.chatMessages.push({
        role: "user",
        content: userMessage,
        time: currentTime
      })

      // 清空输入框
      this.userInput = ""

      // 设置加载状态
      this.isLoading = true

      // 使用导入的nextTick而不是this.$nextTick
      nextTick(() => {
        this.scrollToBottom()
      })

      // 发送请求到后端
      axios.post("llm-dialogue/", {
        message: userMessage,
        model: this.selectedModel
      })
        .then(response => {
          // 添加AI回复到对话历史
          this.chatMessages.push({
            role: "assistant",
            content: response.data.response || "无回复内容",
            time: new Date().toLocaleTimeString()
          })

          // 使用导入的nextTick
          nextTick(() => {
            this.scrollToBottom()
          })
        })
        .catch(error => {
          console.error("大模型请求失败:", error)
          // 添加错误消息
          this.chatMessages.push({
            role: "assistant",
            content: "抱歉，请求处理时发生错误，请稍后再试。",
            time: new Date().toLocaleTimeString()
          })
        })
        .finally(() => {
          this.isLoading = false
          // 使用导入的nextTick
          nextTick(() => {
            this.scrollToBottom()
          })
        })
    },

    // 格式化消息内容，安全处理HTML
    formatMessage(content) {
      if (!content) { return "" }
      // 将换行符转换为HTML换行，同时确保内容安全
      const sanitized = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
      return sanitized.replace(/\n/g, "<br>")
    },

    // 优化滚动方法
    scrollToBottom() {
      // 安全地获取DOM元素引用
      const chatHistoryEl = this.$refs.chatHistory as HTMLElement
      if (chatHistoryEl) {
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight
      }
    },

    // 切换模型下拉菜单显示状态
    toggleModelDropdown() {
      this.showModelDropdown = !this.showModelDropdown
    },

    // 选择模型
    selectModel(model) {
      this.selectedModel = model.name
      this.showModelDropdown = false
    }
  }
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
      rgba(0, 0, 0, 0.3)
    ), /* 上到下渐变 */
    linear-gradient(
      to right,
      rgba(0, 0, 0, 0.9),
      rgba(0, 0, 0, 0.5),
      rgba(0, 0, 0, 0.9)
    ); /* 左右渐变 */
  background-blend-mode: overlay; /* 混合模式 */
  color: white;
  z-index: 1;
  display: flex; /* 使用flex布局使子元素居中 */
  align-items: center;

}

/* 顶部标题容器 */
.top-title {
  position: absolute;
  top: 0.5%;
  left: 1%;
  height: 98%;
  display: flex;
  align-items: center;
}

/* 左侧框：由左至右渐变 */
.left-box {
  position: absolute;
  top: 8%;
  left: 0;
  width: 25%;
  height: 92%;
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
  height: 92%;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.5)); /* 右到左渐变 */
  color: white;
  z-index: 1; /* 设置较低的层级 */
}


/* 表格容器 */
/* .sit-table-container {
  position: relative;
  top: auto;
  left: 0;
  width: 100%;
  margin-top: 0.2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 20px;
}

.wrapper {
  position: absolute;
  top: -1px;
  left: -1px;
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}

.div1 {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
}

.table-header {
  width: 100%;
  height: 30px;
  display: flex;
  flex-direction: row;
  background-color: rgba(70, 70, 70, 0.35);
}

.header-item {
  width: 25%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  position: relative;
  background: linear-gradient(to right, rgba(70, 70, 70, 0.9), rgba(70, 70, 70, 0.2));
  font-size: clamp(0.7rem, 1vw, 1rem);
} */

/* 事件展示区域样式优化 */
.event-display-container {
  position: relative;
  width: 100%;
  height: 35%;
  overflow: hidden;
  margin-top: 5px; /* 减少顶部边距，使其更靠近标题 */
  margin-bottom: 15px;
  background-color: rgba(40, 40, 40, 0.6);
  border-radius: 6px;
}

.event-list {
  height: 100%;
  overflow-y: auto;
  padding: 8px;
}

.event-item {
  margin-bottom: 10px;
  padding: 8px;
  background-color: rgba(60, 60, 60, 0.7);
  border-left: 3px solid #2a8df3;
  border-radius: 4px;
  transition: all 0.3s;
}

.event-item:hover {
  background-color: rgba(70, 70, 70, 0.9);
  transform: translateX(3px);
}

.event-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.event-label-tag {
  background-color: #2a8df3;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8rem;
}

.event-time-tag {
  color: #aaa;
  font-size: 0.8rem;
}

.event-content {
  padding: 3px 0;
}

.event-target {
  font-size: 0.9rem;
  color: #ddd;
  margin-bottom: 4px;
}

.event-summary {
  font-size: 0.85rem;
  color: #bbb;
  line-height: 1.4;
}

.no-events {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #aaa;
  font-style: italic;
}

/* 左侧盒子顶部内容容器 */
.left-top-content {
  position: relative;
  width: 100%;
  top:0%;
  padding: 5px;
  margin-bottom: 0; /* 确保没有底部边距 */
}
/* 左侧盒子中间内容容器调整 */
.left-middle-content {
  position: relative;
  width: 100%;
  padding: 5px;
  margin-top: 10px;
}

/* 左侧盒子底部大模型搜索栏容器 */
.left-bottom-content {
  position: absolute;
  width: 100%;
  bottom: 3%;
}

/* 右侧盒子顶部内容容器 */
.right-top-content {
  position: relative;
  width: 100%;
  padding: 5px;
  }

/* 新增大模型对话相关样式 */
.llm-chat-container {
  display: flex;
  flex-direction: column;
  height: 50vh; /* 调整为合适的高度 */
  margin-top: 10px;
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 8px;
  overflow: hidden;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.empty-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
  font-style: italic;
}

.chat-message {
  margin-bottom: 12px;
  max-width: 90%;
  padding: 10px;
  border-radius: 8px;
  animation: fadeIn 0.3s ease-in-out;
}

.chat-message.user {
  align-self: flex-end;
  background-color: rgba(42, 141, 243, 0.3);
  border: 1px solid rgba(42, 141, 243, 0.6);
}

.chat-message.assistant {
  align-self: flex-start;
  background-color: rgba(60, 60, 60, 0.8);
  border: 1px solid rgba(80, 80, 80, 0.6);
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.8rem;
}

.role-badge {
  font-weight: bold;
  color: #ddd;
}

.message-time {
  color: #888;
}

.message-content {
  color: #eee;
  line-height: 1.5;
  word-break: break-word;
}

.input-area {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: rgba(40, 40, 40, 0.9);
  border-top: 1px solid rgba(80, 80, 80, 0.6);
}

.user-input {
  resize: none;
  height: 80px; /* 适合三行文本的高度 */
  padding: 10px;
  background-color: rgba(50, 50, 50, 0.8);
  border: 1px solid rgba(100, 100, 100, 0.6);
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.user-input:focus {
  outline: none;
  border-color: rgba(42, 141, 243, 0.8);
}

.input-buttons {
  display: flex;
  justify-content: flex-end;
}

.send-button {
  background-color: #2a8df3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 10px;
}

.send-button:hover {
  background-color: #1c7ad7;
}

.send-button:disabled {
  background-color: #555;
  cursor: not-allowed;
}

.model-selector {
  position: relative;
}

.model-select-button {
  background-color: rgba(60, 60, 60, 0.9);
  color: white;
  border: 1px solid rgba(100, 100, 100, 0.6);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.model-select-button:hover {
  background-color: rgba(70, 70, 70, 0.9);
}

.dropdown-arrow {
  margin-left: 6px;
  font-size: 0.7rem;
}

.model-dropdown {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 5px;
  background-color: rgba(50, 50, 50, 0.95);
  border: 1px solid rgba(100, 100, 100, 0.6);
  border-radius: 6px;
  width: 150px;
  z-index: 100;
  max-height: 250px;
  overflow-y: auto;
}

.model-option {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.model-option:hover {
  background-color: rgba(70, 70, 70, 0.9);
}

.model-option.selected {
  background-color: rgba(42, 141, 243, 0.3);
}

.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 10px;
}

.loading-dots {
  display: flex;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  margin: 0 3px;
  background-color: #2a8df3;
  border-radius: 50%;
  opacity: 0.6;
  animation: loadingDots 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loadingDots {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

