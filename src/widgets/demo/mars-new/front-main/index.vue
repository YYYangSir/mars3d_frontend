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

    <!-- 添加事件展示区域 -->
    <div class="event-display-container">
      <div v-if="events.length > 0" class="event-list">
        <div
          v-for="event in events"
          :key="event.id"
          class="event-item"
          :class="{ 'selected': selectedEvent && selectedEvent.id === event.id }"
          @click="selectEvent(event)"
        >
          <div class="event-header">
            <div class="event-tags">
              <span class="event-type-tag">{{ event.label }}</span>
              <span class="event-source-tag">{{ event.source || '未知来源' }}</span>
            </div>
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
            <div class="message-footer">
              <span v-if="message.processingTime">处理时间: {{ message.processingTime }}</span>
              <!-- 添加复制按钮 -->
              <button
                v-if="!message.isError"
                class="copy-button"
                @click="copyMessageContent(message.content)"
                title="复制内容"
              >
                <span class="copy-icon">📋</span>
                <span class="copy-text">复制</span>
              </button>
            </div>
          </div>
          <div v-if="isLoading" class="loading-indicator">
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- 输入区域 - 修改为具有内部按钮的结构 -->
        <div class="input-area">
          <div class="input-container">
            <textarea
              v-model="userInput"
              class="user-input"
              placeholder="输入您的指令..."
              @keydown.enter.ctrl="sendMessage"
              ref="userInputArea"
            ></textarea>

            <!-- 按钮组移至输入框内部 -->
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
                    :class="{ 'selected': selectedModel === model.id }"
                    @click="selectModel(model)"
                  >
                    <div class="model-name">{{ model.name }}</div>
                    <div class="model-description">{{ model.description || '本地模型' }}</div>
                    <div class="model-status" :class="{ 'loaded': model.isLoaded }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="right-box">
    <!-- 在右侧盒子顶部添加风险详情展示标题 -->
    <div class="right-top-content">
      <part-title title="风险详情展示"></part-title>

      <!-- 事件详情展示区域 -->
      <div v-if="selectedEvent" class="event-details-container">

        <!-- 事件描述区域 -->
        <div class="event-description-section">
          <div class="section-header">
            <h4>事件描述</h4>
          </div>
          <div class="section-content scrollable-content">
            <div class="event-meta">
              <div class="meta-item">
                <span class="meta-label">事件类型:</span>
                <span class="meta-value">{{ selectedEvent.label }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">发生时间:</span>
                <span class="meta-value">{{ formatTime(selectedEvent.time) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">数据来源:</span>
                <span class="meta-value">{{ selectedEvent.source || "未知来源" }}</span>
              </div>
            </div>
            <div class="event-summary">
              <p>{{ selectedEvent.summary || "暂无事件描述" }}</p>
            </div>
          </div>
        </div>

        <!-- 四宫格图像展示区域 -->
        <div class="image-section">
          <div class="section-header">
            <h4>事件图像</h4>
          </div>
          <div class="section-content">
            <div v-if="selectedEvent.imagePaths && selectedEvent.imagePaths.length > 0" class="grid-image-wrapper">
              <div class="image-grid">
                <div
                  v-for="(imagePath, index) in getDisplayImages()"
                  :key="index"
                  class="grid-image-item"
                  @click="openFullImage('grid', index)"
                >
                  <img
                    :src="getImageUrl(imagePath)"
                    class="grid-image"
                    :alt="`事件图像 ${index + 1}`"
                  />
                  <div class="image-overlay">
                    <span class="image-number">{{ index + 1 }}</span>
                  </div>
                </div>
              </div>
              <button class="zoom-button grid-zoom-button" @click="openFullImage('grid', 0)">
                <i class="zoom-icon">🔍</i>
              </button>
            </div>
            <div v-else class="no-image">
              <p>暂无图像数据</p>
            </div>
          </div>
        </div>

        <!-- 检测目标信息区域 -->
        <div class="detection-targets-section">
          <div class="section-header">
            <h4>检测目标信息</h4>
          </div>
          <div class="section-content scrollable-content">
            <div v-if="detectionTargets.length > 0" class="targets-list">
              <div
                v-for="(target, index) in detectionTargets"
                :key="index"
                class="target-item"
                @click="selectTarget(target)"
                :class="{ active: selectedTarget && selectedTarget.object_type === target.object_type }"
              >
                <div class="target-header">
                  <span class="target-name">{{ target.object_type }}</span>
                  <div class="target-actions">
                    <span class="target-confidence">置信度: {{ (target.confidence * 100).toFixed(1) }}%</span>
                    <!-- 添加三合一展示按钮 -->
                    <button
                      class="target-combined-view-button"
                      @click.stop="openCombinedTargetView(target)"
                      title="查看目标综合信息"
                    >
                      详情
                    </button>
                  </div>
                </div>
                <div class="target-details">
                  <span class="target-position">
                    位置: [{{ target.bounding_box.map(v => v.toFixed(1)).join(", ") }}]
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="no-targets">
              <p>当前事件未检测到目标</p>
            </div>
          </div>
        </div>



      </div>

      <!-- 未选择事件时的提示 -->
      <div v-else class="no-event-selected">
        <p>请从左侧选择一个事件以查看详细信息</p>
      </div>
    </div>
  </div>

  <!-- 全屏图像预览 -->
  <div v-if="fullScreenImage" class="fullscreen-overlay" @click="closeFullScreen">
    <div class="fullscreen-container" @click.stop>
      <button class="close-fullscreen" @click="closeFullScreen">×</button>

      <!-- 单张图像显示模式 -->
      <div v-if="fullScreenViewMode === 'single'" class="fullscreen-single-view">
        <img
          :src="getCurrentFullScreenImageUrl()"
          class="fullscreen-image"
          :style="{
            transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="stopDrag"
          @mouseleave="stopDrag"
          @wheel="handleZoom"
          alt="全屏图像"
        />
      </div>

      <!-- 四宫格显示模式 -->
      <div v-else class="fullscreen-grid-view">
        <div class="fullscreen-image-grid">
          <div
            v-for="(imagePath, index) in getDisplayImages()"
            :key="index"
            class="fullscreen-grid-item"
            @click="switchToSingleView(index)"
          >
            <img
              :src="getImageUrl(imagePath)"
              class="fullscreen-grid-image"
              :alt="`事件图像 ${index + 1}`"
            />
            <div class="fullscreen-image-overlay">
              <span class="fullscreen-image-number">{{ index + 1 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 缩放控制按钮 -->
      <div class="zoom-controls-vertical">
        <button class="zoom-in" @click="zoomIn">+</button>
        <button class="zoom-out" @click="zoomOut">−</button>
      </div>

      <!-- 视图切换按钮 -->
      <div class="view-mode-controls">
        <button
          v-if="fullScreenViewMode === 'grid'"
          class="view-mode-button"
          @click="switchToSingleView(0)"
        >
          单张查看
        </button>
        <button
          v-else
          class="view-mode-button"
          @click="switchToGridView"
        >
          四宫格查看
        </button>
      </div>

    </div>
  </div>

  <!-- 目标图像全屏预览 -->
  <div v-if="fullScreenTargetImage" class="fullscreen-overlay" @click="closeTargetFullScreen">
    <div class="fullscreen-container" @click.stop>
      <button class="close-fullscreen" @click="closeTargetFullScreen">×</button>

      <!-- 添加图像切换按钮 -->
      <div class="target-image-switch">
        <button
          class="target-switch-button"
          :class="{ 'active': !showTargetGraphImage }"
          @click="switchTargetImageType(false)"
        >
          真实影像
        </button>
        <button
          class="target-switch-button"
          :class="{ 'active': showTargetGraphImage }"
          @click="switchTargetImageType(true)"
        >
          知识图谱
        </button>
      </div>

      <img
        :src="getCurrentTargetImageUrl()"
        class="fullscreen-image"
        :style="{
          transform: `scale(${targetZoomLevel}) translate(${targetImagePosition.x}px, ${targetImagePosition.y}px)`,
          cursor: isTargetDragging ? 'grabbing' : 'grab'
        }"
        @mousedown="startTargetDrag"
        @mousemove="onTargetDrag"
        @mouseup="stopTargetDrag"
        @mouseleave="stopTargetDrag"
        @wheel="handleTargetZoom"
        alt="目标图像"
      />
      <div class="zoom-controls-vertical">
        <button class="zoom-in" @click="targetZoomIn">+</button>
        <button class="zoom-out" @click="targetZoomOut">−</button>
      </div>
    </div>
  </div>

  <!-- 全屏知识图谱预览 -->
  <div v-if="fullScreenGraph" class="fullscreen-graph-overlay" @click="closeFullGraph">
    <div class="fullscreen-graph-container" @click.stop>
      <div class="fullscreen-graph-header">
        <h3>{{ selectedTarget ? selectedTarget.object_type : "目标" }}知识图谱</h3>
        <button class="close-fullscreen-graph" @click="closeFullGraph">×</button>
      </div>

      <div class="fullscreen-graph-content">
        <KnowledgeGraph
          :graphData="targetKnowledgeGraph"
          :isFullscreen="true"
        />
      </div>
    </div>
  </div>

  <!-- 目标综合信息展示视窗 -->
  <div v-if="showCombinedTargetView" class="combined-target-overlay" @click="closeCombinedTargetView">
    <div class="combined-target-container" @click.stop>
      <button class="close-combined-view" @click="closeCombinedTargetView">×</button>

      <div class="combined-target-header">
        <h3>{{ currentTargetName }} - 综合信息</h3>
      </div>

      <div class="combined-target-content">
        <!-- 左侧区域 -->
        <div class="combined-left-section">
          <!-- 真实影像 - 左上 -->
          <div class="real-image-section">
            <h4>真实影像</h4>
            <div class="image-container">
              <img
                v-if="combinedTargetData.realImage"
                :src="combinedTargetData.realImage"
                class="combined-real-image"
                alt="目标真实影像"
                @error="handleImageError('real')"
                @click="openCombinedImageFullscreen('real')"
              />
              <!-- 添加放大图标提示 -->
              <div v-if="combinedTargetData.realImage" class="image-zoom-hint">
                <span class="zoom-icon">🔍</span>
              </div>
              <div v-else class="no-image-placeholder">
                <p>暂无真实影像</p>
              </div>
            </div>
          </div>

          <!-- 目标介绍 - 左下 -->
          <div class="intro-section">
            <h4>目标介绍</h4>
            <div class="intro-content-scrollable">
              <div v-if="combinedTargetData.introduction && Object.keys(combinedTargetData.introduction).length > 0" class="intro-details">
                <div v-for="(value, key) in combinedTargetData.introduction" :key="key" class="intro-detail-item">
                  <span class="intro-detail-label">{{ key }}:</span>
                  <span class="intro-detail-value">{{ value }}</span>
                </div>
              </div>
              <div v-else class="no-intro-placeholder">
                <p>暂无目标介绍信息</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧知识图谱区域 -->
        <div class="combined-right-section">
          <h4>知识图谱</h4>
          <div class="graph-container">
            <!-- 优先显示动态知识图谱 -->
            <KnowledgeGraph
              v-if="combinedTargetData.graphData"
              :graphData="combinedTargetData.graphData"
              :isFullscreen="false"
              @request-fullscreen="openCombinedImageFullscreen('graph')"
            />
            <!-- 降级显示静态图片 -->
            <img
              v-else-if="combinedTargetData.graphImage"
              :src="combinedTargetData.graphImage"
              class="combined-graph-image"
              alt="目标知识图谱"
              @error="handleImageError('graph')"
            />

            <!-- 全屏查看按钮 (仅针对静态图片显示) -->
            <button
              v-if="!combinedTargetData.graphData && combinedTargetData.graphImage"
              class="graph-fullscreen-btn"
              @click.stop="openCombinedImageFullscreen('graph')"
              title="全屏查看"
            >
              <span class="fullscreen-icon">⛶</span> 全屏查看
            </button>

            <div v-if="!combinedTargetData.graphData && !combinedTargetData.graphImage" class="no-graph-placeholder">
              <p>暂无知识图谱</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 综合展示图像全屏预览 -->
  <div v-if="fullScreenCombinedImage" class="fullscreen-overlay" @click="closeCombinedImageFullscreen">
    <div class="fullscreen-container" @click.stop>
      <button class="close-fullscreen" @click="closeCombinedImageFullscreen">×</button>

      <img
        v-if="currentCombinedImageUrl"
        :src="currentCombinedImageUrl"
        class="fullscreen-image"
        :style="{
          transform: `scale(${combinedImageZoomLevel}) translate(${combinedImagePosition.x}px, ${combinedImagePosition.y}px)`,
          cursor: isCombinedImageDragging ? 'grabbing' : 'grab'
        }"
        @mousedown="startCombinedImageDrag"
        @mousemove="onCombinedImageDrag"
        @mouseup="stopCombinedImageDrag"
        @mouseleave="stopCombinedImageDrag"
        @wheel="handleCombinedImageZoom"
        alt="综合展示图像"
      />

      <!-- 图像加载失败时的提示 -->
      <div v-if="!currentCombinedImageUrl" class="fullscreen-error">
        <p>图像加载失败或不存在</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from "vue"
import * as mars3d from "mars3d" // Ensure mars3d is installed and imported
import * as Cesium from "cesium" // Import Cesium library
import PartTitle from "./part-title.vue"
import MyTitle from "../my-title/title.vue"
import KnowledgeGraph from "./KnowledgeGraph.vue" // 导入知识图谱组件
import axios from "axios"
import qs from "qs"
declare global {
  interface Window {
    mars3d?: any;
    map?: any; // Explicitly declare the 'map' property
  }
}

export default defineComponent({
  name: "my-3group",
  components: {
    PartTitle,
    MyTitle,
    KnowledgeGraph // 注册知识图谱组件
  },
  data() {
    return {
      refreshInterval: null, // 定时器引用
      events: [], // 存储事件数据
      showtext: "", // 用于显示后端消息
      selectedEvent: null, // 当前选中的事件
      fullScreenImage: false, // 是否全屏显示图像
      zoomLevel: 1, // 图像缩放级别

      // 优化图像拖动相关数据
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      imagePosition: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 }, // 添加上一次位置记录

      // 大模型对话相关数据 - 修改为本地模型列表
      userInput: "",
      chatMessages: [],
      isLoading: false,
      selectedModel: "DeepSeek-R1-Distill-Qwen-7b", // 默认选择的模型
      showModelDropdown: false,
      availableModels: [
        { id: "DeepSeek-R1-Distill-Qwen-7b", name: "DeepSeek-R1-Distill-Qwen-7b", isLoaded: false, description: "正在加载..." }
      ],
      modelStatus: {
        loading: false,
        error: null
      },

      // 添加地图标记相关属性
      mapInstance: null, // 地图实例引用
      eventMarkerLayer: null, // 用于存储事件标记的图层
      currentEventMarker: null, // 当前选中的事件标记
      currentEventArrow: null, // 当前事件箭头标记

      // 修改目标信息相关数据
      detectionTargets: [], // 存储检测到的目标列表
      selectedTarget: null, // 当前选择的目标
      targetKnowledgeGraph: [], // 目标的知识图谱数据
      isLoadingKnowledgeGraph: false, // 知识图谱加载状态

      // 新增目标详情相关数据
      targetDetailInfo: null, // 目标详细信息
      isLoadingTargetDetail: false, // 目标详情加载状态

      // 目标图像全屏相关数据
      fullScreenTargetImage: false,
      targetZoomLevel: 1,
      isTargetDragging: false,
      targetDragStartX: 0,
      targetDragStartY: 0,
      targetImagePosition: { x: 0, y: 0 },
      targetLastPosition: { x: 0, y: 0 },

      // 新增：目标图像类型切换
      showTargetGraphImage: false, // false为真实影像，true为知识图谱影像

      // 全屏知识图谱相关数据
      fullScreenGraph: false,

      // 修改全屏图像相关数据
      fullScreenImageType: "grid", // 只使用grid模式
      fullScreenViewMode: "grid", // 'grid' 或 'single'
      currentGridImageIndex: 0, // 当前查看的四宫格图像索引

      // 图像显示控制
      showDetectionImage: false, // 是否显示检测图像

      // 新增：综合展示相关数据
      showCombinedTargetView: false,
      currentTargetName: "",
      combinedTargetData: {
        realImage: null,
        graphImage: null,
        introduction: null,
        graphData: null
      },
      isLoadingCombinedData: false,

      // 新增：综合展示图像全屏相关数据
      fullScreenCombinedImage: false,
      currentCombinedImageType: "real", // "real" 或 "graph"
      currentCombinedImageUrl: "",
      combinedImageZoomLevel: 1,
      isCombinedImageDragging: false,
      combinedImageDragStartX: 0,
      combinedImageDragStartY: 0,
      combinedImagePosition: { x: 0, y: 0 },
      combinedImageLastPosition: { x: 0, y: 0 }
    }
  },
  mounted() {
    // 组件挂载时自动获取事件数据
    this.getEvents()

    // 每60秒刷新一次事件数据，检查是否有新事件
    this.refreshInterval = setInterval(() => {
      this.refreshEvents()
    }, 60000)

    // 获取地图实例
    this.initMapInstance()

    // 获取可用的本地模型列表
    this.fetchAvailableModels()

    // 预加载默认模型
    this.preloadModel(this.selectedModel)
  },
  beforeUnmount() {
    // 组件卸载前清除定时器
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    // 清除地图上的标记
    this.clearEventMarkers()
  },
  methods: {
      // 获取当前显示的图像URL
      getCurrentImageUrl() {
        if (!this.selectedEvent) {
          return ""
        }

        // 根据showDetectionImage状态决定显示哪张图片
        if (this.showDetectionImage && this.selectedEvent.detectionImagePath) {
          return `/RZtest/${this.selectedEvent.detectionImagePath}`
        } else if (this.selectedEvent.imagePaths && this.selectedEvent.imagePaths.length > 0) {
          // 为了兼容性，返回第一张图像
          return `/RZtest/${this.selectedEvent.imagePaths[0]}`
        }

        return ""
      },

      // 原有getImageUrl方法保留用于兼容性
      getImageUrl(imagePath) {
        if (!imagePath) {
          return ""
        }
        return `/RZtest/${imagePath}`
      },

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

    // 刷新事件数据（检查新事件）
    refreshEvents() {
      axios.get("event-add/")
        .then(response => {
          if (response.data.events && response.data.events.length > this.events.length) {
            console.log("发现新事件，更新事件列表")
            // 只有当事件数量增加时才更新
            this.events = response.data.events
          }
        })
        .catch(error => {
          console.error("刷新事件数据失败:", error)
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


    // 新增加载目标详细信息方法
    async loadTargetDetailInfo(targetName) {
      if (this.isLoadingTargetDetail) {
        return
      }

      this.isLoadingTargetDetail = true
      this.targetDetailInfo = null

      try {
        console.log(`正在加载${targetName}的详细信息...`)

        const response = await axios.get(`target-detail/${targetName}/`)

        if (response.data && response.data.status === "OK") {
          this.targetDetailInfo = response.data
          console.log("目标详情加载成功:", this.targetDetailInfo)
        } else {
          console.warn("目标详情加载失败:", response.data)
          this.targetDetailInfo = null
        }

      } catch (error) {
        console.error("加载目标详情时出错:", error)
        this.targetDetailInfo = null
      } finally {
        this.isLoadingTargetDetail = false
      }
    },

    // 新增获取目标图像URL方法
    getTargetImageUrl(imagePath) {
      if (!imagePath) {
        return ""
      }
      return `/${imagePath}`
    },

    // 新增获取当前显示的目标图像URL（支持切换）
    getCurrentTargetImageUrl() {
      if (!this.targetDetailInfo || !this.targetDetailInfo.targetImage) {
        return ""
      }

      let imagePath = this.targetDetailInfo.targetImage

      if (this.showTargetGraphImage) {
        // 如果要显示知识图谱影像，添加_graph后缀
        const lastDotIndex = imagePath.lastIndexOf(".")
        if (lastDotIndex !== -1) {
          const basePath = imagePath.substring(0, lastDotIndex)
          const extension = imagePath.substring(lastDotIndex)
          imagePath = `${basePath}_graph${extension}`
        } else {
          imagePath = `${imagePath}_graph`
        }
      }

      return `/${imagePath}`
    },

    // 新增：切换目标图像类型
    switchTargetImageType(showGraph) {
      this.showTargetGraphImage = showGraph
      // 切换图像时重置缩放和位置
      this.targetZoomLevel = 1
      this.targetImagePosition = { x: 0, y: 0 }
      this.targetLastPosition = { x: 0, y: 0 }
    },

    // 新增打开目标图像全屏方法
    openTargetFullImage() {
      this.fullScreenTargetImage = true
      this.targetZoomLevel = 1
      this.targetImagePosition = { x: 0, y: 0 }
      this.targetLastPosition = { x: 0, y: 0 }
      this.showTargetGraphImage = false // 默认显示真实影像
    },

    // 新增关闭目标图像全屏方法
    closeTargetFullScreen() {
      this.fullScreenTargetImage = false
    },

    // 新增目标图像拖动相关方法
    startTargetDrag(event) {
      this.isTargetDragging = true
      this.targetDragStartX = event.clientX
      this.targetDragStartY = event.clientY
      this.targetLastPosition = { ...this.targetImagePosition }
      event.target.style.cursor = "grabbing"
    },

    onTargetDrag(event) {
      if (!this.isTargetDragging) { return }

      const deltaX = (event.clientX - this.targetDragStartX) / this.targetZoomLevel
      const deltaY = (event.clientY - this.targetDragStartY) / this.targetZoomLevel

      this.targetImagePosition = {
        x: this.targetLastPosition.x + deltaX,
        y: this.targetLastPosition.y + deltaY
      }
    },

    stopTargetDrag(event) {
      if (this.isTargetDragging) {
        this.isTargetDragging = false
        this.targetLastPosition = { ...this.targetImagePosition }
        if (event.target) {
          event.target.style.cursor = "grab"
        }
      }
    },

    // 新增目标图像缩放方法
    handleTargetZoom(event) {
      event.preventDefault()
      if (event.deltaY > 0) {
        this.targetZoomOut()
      } else {
        this.targetZoomIn()
      }
    },

    targetZoomIn() {
      if (this.targetZoomLevel < 3) {
        this.targetZoomLevel += 0.1
      }
    },

    targetZoomOut() {
      if (this.targetZoomLevel > 0.5) {
        this.targetZoomLevel -= 0.1
      }
    },

    // 新增打开目标知识图谱方法
    async openTargetKnowledgeGraph() {
      if (!this.selectedTarget) {
        return
      }

      this.isLoadingKnowledgeGraph = true

      try {
        console.log(`正在加载${this.selectedTarget.object_type}的知识图谱...`)

        const response = await axios.get(`target-info/${this.selectedTarget.object_type}/`)

        if (response.data && response.data.status === "OK") {
          this.targetKnowledgeGraph = response.data.knowledgeGraph || []
          console.log("知识图谱加载成功:", this.targetKnowledgeGraph.length, "个路径")

          // 打开全屏知识图谱
          this.fullScreenGraph = true
        } else {
          console.warn("知识图谱加载失败:", response.data)
          this.targetKnowledgeGraph = []
        }

      } catch (error) {
        console.error("加载知识图谱时出错:", error)
        this.targetKnowledgeGraph = []
      } finally {
        this.isLoadingKnowledgeGraph = false
      }
    },

    // 获取Mars3D地图实例
    initMapInstance() {
      const checkMapInstance = () => {
        let map = null

        if (window.mars3d && window.mars3d._map) {
          map = window.mars3d._map
        } else if (window.mapInstance) {
          map = window.mapInstance
        } else if (window.map) {
          map = window.map
        }

        if (map) {
          this.mapInstance = map

          // 创建用于存放事件标记的图层
          this.createEventMarkerLayer()

          console.log("获取到地图实例")
        } else {
          // 如果地图实例还未创建，等待100ms后再次尝试
          setTimeout(checkMapInstance, 100)
        }
      }

      setTimeout(checkMapInstance, 500)
    },


    // 选择事件
    selectEvent(event) {
      this.selectedEvent = event

      // 清除之前的标记和目标信息
      this.clearEventMarkers()
      this.resetTargetSelection()

      // 如果选择了事件，获取事件详细信息
      if (event) {
        console.log("选择事件:", event.label, event.eventDir)

        // 获取事件详细信息，包括检测目标
        this.getEventDetails(event)
      }
    },

    // 重置目标选择状态
    resetTargetSelection() {
      this.detectionTargets = []
      this.selectedTarget = null
      this.targetKnowledgeGraph = []
    },

    // 选择检测目标
    selectTarget(target) {
      this.selectedTarget = target
      console.log("选择目标:", target.object_type)

      // 重置目标详情信息
      this.targetDetailInfo = null
      this.targetKnowledgeGraph = []

      // 获取目标的详细信息
      this.loadTargetDetailInfo(target.object_type)
    },

    // 获取事件详细信息 - 修改为提取检测目标信息
    getEventDetails(event) {
      if (!event.eventDir) {
        console.error("事件缺少目录信息，无法获取详细数据")
        return
      }

      axios.get("event-detail/", {
        params: {
          eventDir: event.eventDir
        }
      })
        .then(response => {
          if (response.data.status === "OK" && response.data.eventData) {
            const eventData = response.data.eventData

            // 查找检测事件并提取目标信息
            const detectionEvent = eventData.find(item => item.type === "Detection")

            if (detectionEvent) {
              // 提取检测目标
              this.detectionTargets = detectionEvent.detections || []

              // 如果有检测目标，自动选择第一个
              if (this.detectionTargets.length > 0) {
                this.selectTarget(this.detectionTargets[0])
              }

              // 处理坐标信息用于地图定位
              if (detectionEvent.coordinates) {
                const { longitude, latitude } = detectionEvent.coordinates
                if (longitude !== undefined && latitude !== undefined) {
                  this.flyToEventLocation(longitude, latitude)
                  try {
                    this.addEventMarker(longitude, latitude, event.label, event.summary)
                  } catch (error) {
                    console.error("添加事件标记失败:", error)
                  }
                }
              }
            } else {
              console.log("事件数据中没有找到检测信息")
              this.detectionTargets = []
            }
          } else {
            console.error("获取事件详情失败:", response.data.message)
          }
        })
        .catch(error => {
          console.error("获取事件详细信息失败:", error)
        })
    },

    // 创建事件标记图层
    createEventMarkerLayer() {
      if (!this.mapInstance) { return }

      try {
        if (this.eventMarkerLayer) {
          this.mapInstance.removeLayer(this.eventMarkerLayer)
        }

        const GraphicLayer = mars3d.layer.GraphicLayer || window.mars3d.layer.GraphicLayer

        this.eventMarkerLayer = new GraphicLayer({
          name: "事件标记图层"
        })

        this.mapInstance.addLayer(this.eventMarkerLayer)
      } catch (error) {
        console.error("创建事件标记图层失败:", error)
      }
    },


    // 修改飞行定位方法，增加更平滑的动画效果
    flyToEventLocation(longitude, latitude) {
      if (!this.mapInstance) { return }

      console.log(`飞行定位到坐标: ${longitude}, ${latitude}`)

      // 定义增强版飞行参数
      const options = {
        duration: 3.5, // 略微增加飞行时间，使动画更流畅
        radius: 8000, // 视距高度
        heading: 0,
        pitch: -50, // 倾斜视角
        roll: 0,
        complete: () => {
          // 飞行结束后的回调，可以添加额外效果
          console.log("飞行定位完成")

          // 让位置短暂闪烁以突出显示
          this.highlightLocation(longitude, latitude)
        }
      }

      try {
        // 先切换到3D视图(如果当前不是)
        if (this.mapInstance.scene && this.mapInstance.scene.mode !== 3) {
          this.mapInstance.scene.mode = 3 // 3 = 3D模式
        }

        // 执行飞行动画 - 使用更稳定的方法
        if (this.mapInstance.setCameraView) {
          this.mapInstance.setCameraView({
            lat: latitude,
            lng: longitude,
            ...options
          })
        } else if (this.mapInstance.flyToPoint) {
          this.mapInstance.flyToPoint([longitude, latitude], options)
        } else if (this.mapInstance.camera && this.mapInstance.camera.flyTo) {
          // 备用方案
          this.mapInstance.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 8000),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-50),
              roll: 0
            },
            duration: 3.5
          })
        }
      } catch (error) {
        console.error("飞行定位出错:", error)
      }
    },

    // 添加位置高亮效果
    highlightLocation(longitude, latitude) {
      if (!this.mapInstance || !this.eventMarkerLayer) { return }

      try {
        // 创建一个短暂的闪烁效果
        const mars3dInstance = window.mars3d || mars3d

        // 创建一个圆形扩散动画
        const highlightCircle = new mars3dInstance.graphic.CircleEntity({
          position: [longitude, latitude],
          style: {
            radius: 100, // 初始半径100米
            height: 10, // 离地高度
            color: "#ff0000",
            opacity: 0.6,
            outline: true,
            outlineWidth: 2,
            outlineColor: "#ffffff"
          }
        })

        // 添加到图层
        this.eventMarkerLayer.addGraphic(highlightCircle)

        // 创建动画效果
        let radius = 100
        let opacity = 0.6

        // 使用定时器创建扩散效果
        const timer = setInterval(() => {
          radius += 100
          opacity -= 0.1

          highlightCircle.setStyle({
            radius,
            opacity: opacity > 0 ? opacity : 0
          })

          if (opacity <= 0) {
            clearInterval(timer)
            this.eventMarkerLayer.removeGraphic(highlightCircle)
          }
        }, 100)
      } catch (error) {
        console.error("创建高亮效果失败:", error)
      }
    },

    // 在地图上添加事件标记
    addEventMarker(longitude, latitude, title, description) {
      if (!this.mapInstance || !this.eventMarkerLayer) {
        console.error("地图实例或事件图层未初始化")
        return
      }

      try {
        // 获取合适的API
        const mars3dInstance = window.mars3d || mars3d

        // 创建主标记
        this.currentEventMarker = new mars3dInstance.graphic.PointEntity({
          position: [longitude, latitude],
          style: {
            color: "#FF0000",
            pixelSize: 10,
            outlineColor: "#FFFFFF",
            outlineWidth: 2,
            clampToGround: true,
            label: {
              text: title || "事件位置",
              font_size: 18,
              color: "#ffffff",
              background: true,
              backgroundColor: "rgba(0,0,0,0.5)",
              backgroundPadding: [7, 5],
              outlineWidth: 2,
              pixelOffsetY: -30,
              distanceDisplayCondition: true,
              distanceDisplayCondition_far: 100000,
              distanceDisplayCondition_near: 0
            },
            popup: {
              html: `<div class="mars3d-template-titile">${title || "事件详情"}</div>
                   <div class="mars3d-template-content">
                     <div>${description || "暂无详细说明"}</div>
                     <div>经度: ${longitude.toFixed(6)}</div>
                     <div>纬度: ${latitude.toFixed(6)}</div>
                   </div>`,
              closeButton: true
            }
          }
        })

        // 添加向下指示的箭头
        this.currentEventArrow = new mars3dInstance.graphic.GeoEntity({
          name: "事件箭头",
          position: [longitude, latitude, 1000], // 在点上方1000米
          style: {
            shape: "cylinder",
            color: "#FF0000",
            opacity: 0.6,
            heightReference: mars3dInstance.HeightReference.NONE,
            length: 1000, // 箭头高度
            topRadius: 0, // 顶部尖
            bottomRadius: 200, // 底部宽
            heading: 0,
            pitch: 180, // 倒置圆锥形状
            roll: 0
          }
        })

        // 添加动画效果
        if (this.mapInstance.clock) {
          // 添加闪烁效果
          this.currentEventMarker.setStyle({
            animation: true,
            animationType: "scale",
            animationScale: [1, 1.5],
            animationDuration: 1000,
            animationLoop: true
          })
        }

        // 将标记添加到图层
        this.eventMarkerLayer.addGraphic(this.currentEventMarker)
        this.eventMarkerLayer.addGraphic(this.currentEventArrow)
      } catch (error) {
        console.error("添加事件标记失败:", error)

        // 降级方案：如果高级标记失败，使用简单标记
        try {
          this.addSimpleMarker(longitude, latitude, title, description)
        } catch (e) {
          console.error("添加简单标记也失败:", e)
        }
      }
    },

    // 添加简单标记 (降级方案)
    addSimpleMarker(longitude, latitude, title, description) {
      if (!this.mapInstance || !this.eventMarkerLayer) { return }

      const mars3dInstance = window.mars3d || mars3d

      this.currentEventMarker = new mars3dInstance.graphic.DivGraphic({
        position: [longitude, latitude],
        style: {
          html: `
            <div style="
              background-color: rgba(255, 0, 0, 0.8);
              color: white;
              padding: 5px 10px;
              border-radius: 5px;
              font-weight: bold;
              transform: translate(-50%, -100%);
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            ">
              <div>${title || "事件位置"}</div>
              <div style="
                width: 0;
                height: 0;
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-top: 10px solid rgba(255, 0, 0, 0.8);
                position: absolute;
                bottom: -10px;
                left: calc(50% - 10px);
              "></div>
            </div>
          `,
          horizontalOrigin: mars3dInstance.HorizontalOrigin?.CENTER,
          verticalOrigin: mars3dInstance.VerticalOrigin?.BOTTOM
        }
      })

      this.eventMarkerLayer.addGraphic(this.currentEventMarker)
    },

    // 清除地图上的事件标记
    clearEventMarkers() {
      if (this.eventMarkerLayer) {
        this.eventMarkerLayer.clear()
        this.currentEventMarker = null
        this.currentEventArrow = null
      }
    },

    // 关闭图像
    closeImage() {
      this.selectedEvent = null
      this.clearEventMarkers()
    },

    // 打开全屏图像
    openFullImage(type = "grid", index = 0) {
      this.fullScreenImage = true
      this.currentGridImageIndex = index

      // 重置缩放和位置
      this.zoomLevel = 1
      this.imagePosition = { x: 0, y: 0 }
      this.lastPosition = { x: 0, y: 0 }

      // 默认为四宫格模式
      this.fullScreenViewMode = "grid"
    },

    // 新增获取显示图像的方法，确保总是返回4张图像
    getDisplayImages() {
      if (!this.selectedEvent || !this.selectedEvent.imagePaths) {
        return []
      }

      const images = this.selectedEvent.imagePaths
      const displayImages = []

      // 确保有4张图像显示，不足的用第一张图像填充
      for (let i = 0; i < 4; i++) {
        if (i < images.length) {
          displayImages.push(images[i])
        } else if (images.length > 0) {
          // 如果图像数量不足4张，重复使用已有图像
          displayImages.push(images[i % images.length])
        }
      }

      return displayImages
    },

    // 修改获取当前全屏图像URL方法
    getCurrentFullScreenImageUrl() {
      if (!this.selectedEvent) {
        return ""
      }

      const displayImages = this.getDisplayImages()
      const imagePath = displayImages[this.currentGridImageIndex]
      return imagePath ? `/RZtest/${imagePath}` : ""
    },


    // 修改发送消息方法，增强错误处理
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

      nextTick(() => {
        this.scrollToBottom()
      })

      // 添加错误映射表，用于更友好的错误提示
      const errorMessages = {
        connection_error: "无法连接到大模型服务，请检查网络连接和服务状态",
        timeout_error: "大模型服务响应超时，请稍后再试",
        request_error: "请求大模型服务失败，请检查网络连接",
        response_format_error: "大模型返回了无效格式的响应",
        generation_error: "生成回复时出错，请稍后再试",
        null_response: "大模型未返回有效响应",
        server_error: "服务器处理错误，请联系管理员",
        invalid_request: "发送了无效的请求格式"
      }

      // 发送请求到后端
      axios.post("llm-dialogue/", {
        message: userMessage,
        model: this.selectedModel
      })
        .then(response => {
          if (response.data && response.data.status === "OK") {
            // 添加AI回复到对话历史
            this.chatMessages.push({
              role: "assistant",
              content: response.data.response || "无回复内容",
              time: new Date().toLocaleTimeString(),
              processingTime: response.data.processing_time || null
            })
          } else {
            // 处理返回的错误状态
            console.warn("LLM响应异常状态:", response.data)
            throw new Error(response.data.message || "响应数据异常")
          }

          nextTick(() => {
            this.scrollToBottom()
          })
        })
        .catch(error => {
          console.error("大模型请求失败:", error)

          // 获取详细错误信息
          let errorMessage = "请求处理失败，请稍后再试"
          let errorDetails = ""

          if (error.response) {
            const errorType = error.response.data?.error_type
            const serverMessage = error.response.data?.message

            // 使用预定义的错误消息或服务器返回的消息
            errorMessage = errorMessages[errorType] || serverMessage || errorMessage
            errorDetails = `状态码: ${error.response.status}`

            // 记录更多调试信息
            console.error("错误响应详情:", {
              status: error.response.status,
              data: error.response.data,
              error_type: errorType
            })
          } else if (error.request) {
            // 请求发出但没有收到响应
            errorMessage = "请求已发送，但未收到服务器响应，请检查网络连接"
            errorDetails = "无响应"
            console.error("请求无响应:", error.request)
          } else {
            // 请求设置时发生错误
            errorMessage = `请求设置错误: ${error.message}`
            console.error("请求设置错误:", error.message)
          }

          // 添加错误消息到对话
          this.chatMessages.push({
            role: "assistant",
            content: `<div class="error-message">
                    <strong>😔 对话请求错误</strong><br>
                    ${errorMessage}
                    ${errorDetails ? `<br><small>(${errorDetails})</small>` : ""}
                  </div>`,
            time: new Date().toLocaleTimeString(),
            isError: true
          })
        })
        .finally(() => {
          this.isLoading = false
          nextTick(() => {
            this.scrollToBottom()
          })
        })
    },

    // 选择模型 - 更新为支持本地模型选择
    selectModel(model) {
      this.selectedModel = model.id
      this.showModelDropdown = false

      // 如果选择了一个未加载的模型，预加载它
      if (!model.isLoaded) {
        this.preloadModel(model.id)
      }
    },

    // 修改预加载模型方法，去除不必要的分号
    preloadModel(modelId) {
      this.modelStatus.loading = true
      this.modelStatus.error = null

      // 设置超时时间
      const timeoutId = setTimeout(() => {
        if (this.modelStatus.loading) {
          this.modelStatus.loading = false
          this.modelStatus.error = "预加载请求超时，模型可能仍在加载中"
          console.warn(`模型${modelId}预加载请求超时`)
        }
      }, 10000) // 10秒超时

      axios.post("llm-preload/", {
        model: modelId
      })
        .then(response => {
          clearTimeout(timeoutId)
          console.log("模型预加载请求成功:", response.data.message)

          // 更新模型状态 - 修改为使用Vue3兼容方式
          const modelIndex = this.availableModels.findIndex(m => m.id === modelId)
          if (modelIndex >= 0) {
            // 创建新对象来更新模型的isLoaded状态
            const updatedModel = { ...this.availableModels[modelIndex], isLoaded: true }
            // 使用数组变异方法替换目标索引的项
            this.availableModels.splice(modelIndex, 1, updatedModel)
          }
        })
        .catch(error => {
          clearTimeout(timeoutId)
          console.error("模型预加载失败:", error)
          this.modelStatus.error = error.response?.data?.message || "模型加载失败，请稍后再试"
        })
        .finally(() => {
          this.modelStatus.loading = false
        })
    },

    // 修改处理缩放方法适应拖动变换
    handleZoom(event) {
      event.preventDefault()

      if (event.deltaY > 0) {
        this.zoomOut()
      } else {
        this.zoomIn()
      }
    },

    // 放大图像
    zoomIn() {
      if (this.zoomLevel < 3) {
        this.zoomLevel += 0.1
      }
    },

    // 缩小图像
    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel -= 0.1
      }
    },

    // 获取可用模型列表
    fetchAvailableModels() {
      axios.get("llm-models/")
        .then(response => {
          if (response.data.status === "OK" && response.data.models) {
            this.availableModels = response.data.models

            // 如果默认选择的模型不在列表中，选择第一个可用的模型
            if (!this.availableModels.some(model => model.id === this.selectedModel) && this.availableModels.length > 0) {
              this.selectedModel = this.availableModels[0].id
            }
          }
        })
        .catch(error => {
          console.error("获取模型列表失败:", error)
        })
    },

    // 修改formatMessage方法以支持错误消息的HTML格式
    formatMessage(content) {
      if (!content) { return "" }

      // 如果内容包含HTML标记(通常是错误消息)，则直接返回
      if (content.startsWith('<div class="error-message">')) {
        return content
      }

      // 否则执行通常的转义处理
      const sanitized = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
      return sanitized.replace(/\n/g, "<br>")
    },

    scrollToBottom() {
      const chatHistoryEl = this.$refs.chatHistory as HTMLElement
      if (chatHistoryEl) {
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight
      }
    },

    toggleModelDropdown() {
      this.showModelDropdown = !this.showModelDropdown
    },

    // 添加复制消息内容到剪贴板的方法
    copyMessageContent(content) {
      try {
        // 如果内容包含HTML标记(例如错误消息)，先提取纯文本
        let textToCopy = content
        if (content.startsWith('<div class="error-message">')) {
          // 创建临时DOM元素解析HTML并提取文本
          const tempDiv = document.createElement("div")
          tempDiv.innerHTML = content
          textToCopy = tempDiv.textContent || tempDiv.innerText || ""
        } else {
          // 对于普通文本，替换<br>为换行符
          textToCopy = content.replace(/<br\s*\/?>/gi, "\n")
          // 还原HTML实体
          textToCopy = textToCopy
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
        }

        // 使用现代异步剪贴板API
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            this.showCopyNotification("已复制到剪贴板")
          })
          .catch(() => {
            // 如果新API失败，尝试传统方法
            this.fallbackCopy(textToCopy)
          })
      } catch (error) {
        console.error("复制失败:", error)
        this.showCopyNotification("复制失败，请手动选择文本复制")
      }
    },

    // 使用传统方法复制文本的后备方案
    fallbackCopy(text) {
      try {
        // 创建临时textarea元素
        const textarea = document.createElement("textarea")
        textarea.value = text
        textarea.style.position = "fixed" // 避免滚动到底部
        document.body.appendChild(textarea)
        textarea.select()

        // 执行复制命令
        const successful = document.execCommand("copy")
        document.body.removeChild(textarea)

        if (successful) {
          this.showCopyNotification("已复制到剪贴板")
        } else {
          this.showCopyNotification("复制命令失败，请手动复制")
        }
      } catch (err) {
        console.error("后备复制方法失败:", err)
        this.showCopyNotification("复制失败，请手动选择文本复制")
      }
    },

    // 显示通知
    showCopyNotification(message) {
      // 创建通知元素
      const notification = document.createElement("div")
      notification.className = "copy-notification"
      notification.textContent = message

      // 添加到页面
      document.body.appendChild(notification)

      // 动画显示
      setTimeout(() => {
        notification.classList.add("show")
      }, 10)

      // 自动关闭
      setTimeout(() => {
        notification.classList.remove("show")
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 300) // 等待淡出动画完成后移除元素
      }, 2000)
    },

    // 打开全屏知识图谱
    openFullGraph() {
      if (this.targetKnowledgeGraph && this.targetKnowledgeGraph.length > 0) {
        this.fullScreenGraph = true
      }
    },

    // 关闭全屏知识图谱
    closeFullGraph() {
      this.fullScreenGraph = false
    },

    // 关闭全屏图像
    closeFullScreen() {
      this.fullScreenImage = false
      this.zoomLevel = 1
      this.imagePosition = { x: 0, y: 0 }
      this.lastPosition = { x: 0, y: 0 }
    },

    // 开始拖动图像
    startDrag(event) {
      this.isDragging = true
      this.dragStartX = event.clientX
      this.dragStartY = event.clientY
      this.lastPosition = { ...this.imagePosition }
      event.target.style.cursor = "grabbing"
    },

    // 拖动图像过程中
    onDrag(event) {
      if (!this.isDragging) { return }

      const deltaX = (event.clientX - this.dragStartX) / this.zoomLevel
      const deltaY = (event.clientY - this.dragStartY) / this.zoomLevel

      this.imagePosition = {
        x: this.lastPosition.x + deltaX,
        y: this.lastPosition.y + deltaY
      }
    },

    // 停止拖动图像
    stopDrag(event) {
      if (this.isDragging) {
        this.isDragging = false
        this.lastPosition = { ...this.imagePosition }
        if (event.target) {
          event.target.style.cursor = "grab"
        }
      }
    },

    // 切换到单张视图模式
    switchToSingleView(index = 0) {
      this.fullScreenViewMode = "single"
      this.currentGridImageIndex = index
    },

    // 切换到四宫格视图模式
    switchToGridView() {
      this.fullScreenViewMode = "grid"
    },

    // 打开目标综合信息展示
    async openCombinedTargetView(target) {
      console.log("打开综合目标视图") // 添加调试日志
      this.currentTargetName = target.object_type
      this.showCombinedTargetView = true
      this.isLoadingCombinedData = true

      // 重置数据
      this.combinedTargetData = {
        realImage: null,
        graphImage: null,
        introduction: null,
        graphData: null
      }

      try {
        // 加载综合数据
        await this.loadCombinedTargetData(target.object_type)
      } catch (error) {
        console.error("加载目标综合数据失败:", error)
      } finally {
        this.isLoadingCombinedData = false
      }
    },

    // 关闭综合展示视窗
    closeCombinedTargetView() {
      this.showCombinedTargetView = false
      this.currentTargetName = ""
      this.combinedTargetData = {
        realImage: null,
        graphImage: null,
        introduction: null,
        graphData: null
      }
    },

    // 加载目标综合数据
    async loadCombinedTargetData(targetName) {
      try {
        console.log(`正在加载${targetName}的综合信息...`)

        // 1. 获取基本信息（图片、介绍）
        const detailResponse = await axios.get(`target-detail/${targetName}/`)

        if (detailResponse.data && detailResponse.data.status === "OK") {
          // 设置真实影像路径
          if (detailResponse.data.targetImage) {
            this.combinedTargetData.realImage = `/${detailResponse.data.targetImage}`
          }

          // 设置知识图谱影像路径 (作为后备)
          if (detailResponse.data.graphImage) {
            this.combinedTargetData.graphImage = `/${detailResponse.data.graphImage}`
          }

          // 设置目标介绍
          this.combinedTargetData.introduction = detailResponse.data.introduction

          console.log("目标综合数据基本信息加载完成")
        }

        // 2. 获取动态知识图谱数据
        const eventId = this.selectedEvent ? this.selectedEvent.id : null
        if (eventId) {
             try {
                console.log(`正在加载动态图谱: target=${targetName}, event=${eventId}`)
                const graphResponse = await axios.get("knowledge-graph/generate/", {
                    params: {
                        target_name: targetName,
                        event_id: eventId
                    }
                })
                if (graphResponse.data && !graphResponse.data.error) {
                    this.combinedTargetData.graphData = graphResponse.data
                    console.log("动态图谱加载成功", this.combinedTargetData.graphData)
                }
             } catch (e) {
                 console.error("加载动态图谱失败:", e)
             }
        }

      } catch (error) {
        console.error("加载目标综合数据时出错:", error)
        throw error
      }
    },

    // 处理图像加载错误
    handleImageError(imageType) {
      console.warn(`${imageType === "real" ? "真实影像" : "知识图谱影像"}加载失败`)
      if (imageType === "real") {
        this.combinedTargetData.realImage = null
      } else {
        this.combinedTargetData.graphImage = null
      }
    },

    // 新增：打开综合展示图像全屏
    openCombinedImageFullscreen(imageType) {
      console.log("打开综合展示图像全屏:", imageType) // 添加调试日志

      // 验证图像数据是否存在
      if (imageType === "real" && !this.combinedTargetData.realImage) {
        console.warn("真实影像数据不存在")
        return
      }

      // 特殊处理知识图谱全屏
      if (imageType === "graph") {
          if (this.combinedTargetData.graphData) {
              // 如果有动态数据，使用 KnowledgeGraph 全屏模式
              this.targetKnowledgeGraph = this.combinedTargetData.graphData
              this.fullScreenGraph = true
              return
          } else if (!this.combinedTargetData.graphImage) {
              console.warn("知识图谱数据不存在")
              return
          }
      }

      this.currentCombinedImageType = imageType
      this.fullScreenCombinedImage = true

      // 设置当前图像URL
      if (imageType === "real") {
        this.currentCombinedImageUrl = this.combinedTargetData.realImage
      } else if (imageType === "graph") {
        this.currentCombinedImageUrl = this.combinedTargetData.graphImage
      }


      console.log("设置图像URL:", this.currentCombinedImageUrl) // 添加调试日志
      console.log("全屏状态:", this.fullScreenCombinedImage) // 查看全屏状态

      // 重置缩放和位置
      this.combinedImageZoomLevel = 1
      this.combinedImagePosition = { x: 0, y: 0 }
      this.combinedImageLastPosition = { x: 0, y: 0 }
    },

    // 新增：关闭综合展示图像全屏
    closeCombinedImageFullscreen() {
      console.log("关闭综合展示图像全屏")
      this.fullScreenCombinedImage = false
      this.currentCombinedImageUrl = ""
      this.currentCombinedImageType = "real"
      this.combinedImageZoomLevel = 1
      this.combinedImagePosition = { x: 0, y: 0 }
      this.combinedImageLastPosition = { x: 0, y: 0 }
      this.isCombinedImageDragging = false
    },

    // 新增：开始拖动综合展示图像
    startCombinedImageDrag(event) {
      this.isCombinedImageDragging = true
      this.combinedImageDragStartX = event.clientX
      this.combinedImageDragStartY = event.clientY
      this.combinedImageLastPosition = { ...this.combinedImagePosition }
      event.target.style.cursor = "grabbing"
    },

    // 新增：拖动综合展示图像过程中
    onCombinedImageDrag(event) {
      if (!this.isCombinedImageDragging) { return }

      const deltaX = (event.clientX - this.combinedImageDragStartX) / this.combinedImageZoomLevel
      const deltaY = (event.clientY - this.combinedImageDragStartY) / this.combinedImageZoomLevel

      this.combinedImagePosition = {
        x: this.combinedImageLastPosition.x + deltaX,
        y: this.combinedImageLastPosition.y + deltaY
      }
    },

    // 新增：停止拖动综合展示图像
    stopCombinedImageDrag(event) {
      if (this.isCombinedImageDragging) {
        this.isCombinedImageDragging = false
        this.combinedImageLastPosition = { ...this.combinedImagePosition }
        if (event.target) {
          event.target.style.cursor = "grab"
        }
      }
    },

    // 新增：处理综合展示图像缩放
    handleCombinedImageZoom(event) {
      event.preventDefault()
      if (event.deltaY > 0) {
        this.combinedImageZoomOut()
      } else {
        this.combinedImageZoomIn()
      }
    },

    // 新增：放大综合展示图像
    combinedImageZoomIn() {
      if (this.combinedImageZoomLevel < 3) {
        this.combinedImageZoomLevel += 0.1
      }
    },

    // 新增：缩小综合展示图像
    combinedImageZoomOut() {
      if (this.combinedImageZoomLevel > 0.5) {
        this.combinedImageZoomLevel -= 0.1
      }
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
  overflow-y: auto; /* 添加垂直滚动条 */
}

/* 事件展示区域样式优化 */
.event-display-container {
  position: relative;
  width: 100%;
  height: 35%;
  overflow: hidden;
  margin-top: 5px;
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
  cursor: pointer;
}

.event-item:hover {
  background-color: rgba(70, 70, 70, 0.9);
  transform: translateX(3px);
}

.event-item.selected {
  background-color: rgba(42, 141, 243, 0.3);
  border-left: 3px solid #1c7ad7;
}

.event-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.event-tags {
  display: flex;
  gap: 8px;
}

.event-type-tag {
  background-color: #2a8df3;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8rem;
}

.event-source-tag {
  background-color: #555;
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

/* 图像显示相关样式 */
.image-container {
  width: 100%;
  margin-top: 10px;
  background-color: rgba(40, 40, 40, 0.8);
  border-radius: 6px;
  overflow: hidden;
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(60, 60, 60, 0.8);
  flex-wrap: wrap; /* 允许在小屏幕上换行 */
}

.image-title {
  font-size: 0.9rem;
  color: #eee;
  margin-right: 10px; /* 添加右侧间距 */
  flex: 1; /* 让标题占据剩余空间 */
}

/* 添加图像切换按钮样式 */
.image-switch-buttons {
  display: flex;
  gap: 5px;
  margin-right: 10px;
}

.image-switch-button {
  background-color: rgba(80, 80, 80, 0.8);
  color: #ddd;
  border: none;
  border-radius: 3px;
  padding: 3px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-switch-button.active {
  background-color: #2a8df3;
  color: white;
}

.image-switch-button:hover:not(.active) {
  background-color: rgba(100, 100, 100, 0.9);
  color: white;
}

.close-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 5px;
}

.close-button:hover {
  color: #fff;
}

.image-wrapper {
  position: relative;
  width: 100%;
  padding: 8px;
}

.event-image {
  width: 100%;
  border-radius: 4px;
  cursor: pointer;
}

.zoom-button {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.zoom-button:hover {
  background-color: rgba(42, 141, 243, 0.8);
}

.zoom-icon {
  font-style: normal;
  font-size: 14px;
}

/* 全屏图像样式 */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 3000; /* 提高z-index，确保在综合展示界面之上 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.fullscreen-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  margin: auto;
}

.close-fullscreen {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.7);
  color: white;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-fullscreen:hover {
  background: rgba(255, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
}

/* 添加全屏模式下的图像切换按钮 */
.fullscreen-image-switch {
  position: absolute;
  top: -40px;
  left: 0;
  display: flex;
  gap: 10px;
  z-index: 1001;
}

.fullscreen-image-switch .image-switch-button {
  padding: 5px 12px;
  font-size: 0.9rem;
  background-color: rgba(50, 50, 50, 0.8);
  border: 1px solid rgba(80, 80, 80, 0.6);
}

/* 优化全屏图像拖动相关样式 */
.fullscreen-image {
  max-width: 100%;
  max-height: 80vh;
  display: block;
  transition: transform 0.1s ease; /* 缩短过渡时间使拖动更流畅 */
  transform-origin: center center;
  user-select: none; /* 防止拖动时选中图像 */
  -webkit-user-drag: none; /* 防止原生拖动行为 */
  touch-action: none; /* 改善触摸设备上的拖动 */
}

/* 使图像在拖动时不再使用过渡效果，提升响应速度 */
.fullscreen-image:active {
  transition: none;
}

/* 隐藏原有的水平缩放控制 */
.zoom-controls {
  display: none;
}

/* 左侧盒子顶部内容容器 */
.left-top-content {
  position: relative;
  width: 100%;
  top:0%;
  padding: 5px;
  margin-bottom: 0; /* 确保没有底部边距 */
}
/* 左侧盒子中间内容容器调整 - 扩展到页面底部 */
.left-middle-content {
  position: absolute;
  width: 100%;
  top: calc(35% + 45px); /* 事件展示容器的高度 + 边距 + 标题高度 */
  bottom: 0;
  padding: 5px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 右侧盒子顶部内容容器 */
.right-top-content {
  position: relative;
  width: 100%;
  padding: 5px;
  }

/* 优化大模型对话相关样式 */
.llm-chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100% - 30px); /* 减去标题高度 */
  margin-top: 10px;
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 8px;
  overflow: hidden;
  position: relative; /* 为绝对定位的输入区域提供参考 */
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  padding-bottom: 120px; /* 为底部输入区域预留空间 */
}

.user-input {
  width: 100%;
  min-height: 80px;
  max-height: 150px;
  resize: none;
  padding: 10px;
  padding-right: 190px; /* 为右侧按钮预留空间 */
  padding-bottom: 45px; /* 为底部按钮预留空间 */
  background-color: rgba(50, 50, 50, 0.8);
  border: 1px solid rgba(100, 100, 100, 0.6);
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;
  box-sizing: border-box;
  overflow-y: auto; /* 允许内容超出时滚动 */
}

.user-input:focus {
  outline: none;
  border-color: rgba(42, 141, 243, 0.8);
}

/* 按钮放置在输入框内部右下角 */
.input-buttons {
  position: absolute;
  bottom: 8px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px; /* 按钮之间的间距 */
}

.send-button {
  background-color: #2a8df3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 0.85rem;
  height: 28px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  white-space: nowrap;
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
  padding: 4px 8px;
  font-size: 0.85rem;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.model-select-button:hover {
  background-color: rgba(70, 70, 70, 0.9);
}

.dropdown-arrow {
  margin-left: 6px;
  font-size: 0.7rem;
}

/* 下拉菜单向上展开 */
.model-dropdown {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 5px;
  background-color: rgba(50, 50, 50, 0.95);
  border: 1px solid rgba(100, 100, 100, 0.6);
  border-radius: 6px;
  width: 150px;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.model-option {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.model-option .model-name {
  font-weight: bold;
  margin-bottom: 2px;
}

.model-option .model-description {
  font-size: 0.8rem;
  color: #aaa;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 40px;
}

.model-option .model-status {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #aaa;
}

.model-option .model-status.loaded {
  background-color: #4caf50;
}

.model-option:hover {
  background-color: rgba(70, 70, 70, 0.9);
}

.model-option.selected {
  background-color: rgba(42, 141, 243, 0.3);
}

/* 添加处理时间显示 */
.message-footer {
  font-size: 0.7rem;
  color: #888;
  text-align: right;
  margin-top: 5px;
}

/* 错误消息样式 */
:deep(.error-message) {
  background-color: rgba(240, 128, 128, 0.2);
  border-left: 3px solid #ff4d4d;
  padding: 10px;
  margin: 5px 0;
  border-radius: 4px;
  font-size: 0.9rem;
}

:deep(.error-message strong) {
  color: #ff4d4d;
  display: block;
  margin-bottom: 5px;
}

:deep(.error-message small) {
  color: #aaa;
  font-size: 0.8rem;
}

/* 加载指示器样式 */
.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

.loading-dots {
  display: flex;
  align-items: center;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  margin: 0 4px;
  border-radius: 50%;
  background-color: rgba(42, 141, 243, 0.8);
  display: inline-block;
  animation: loadingDots 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.empty-chat {
  text-align: center;
  color: #aaa;
  padding: 20px;
  font-style: italic;
}

/* 消息样式优化 */
.chat-message {
  animation: fadeIn 0.3s ease-in-out;
  margin-bottom: 15px;
  position: relative;
}

.chat-message.user {
  align-self: flex-end;
  background-color: rgba(42, 141, 243, 0.1);
  border-radius: 12px 12px 0 12px;
  padding: 10px 15px;
  max-width: 80%;
}

.chat-message.assistant {
  align-self: flex-start;
  background-color: rgba(70, 70, 70, 0.5);
  border-radius: 12px 12px 12px 0;
  padding: 10px 15px;
  max-width: 85%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.8rem;
}

.role-badge {
  font-weight: bold;
  color: #2a8df3;
}

.message-time {
  color: #aaa;
}

.message-content {
  line-height: 1.4;
  word-break: break-word;
  user-select: text; /* 允许文本选择 */
  -webkit-user-select: text;
  -moz-user-select: text;
 -ms-user-select: text;
  cursor: text;
}

/* 添加复制按钮样式 */
.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: #888;
  margin-top: 5px;
}

.copy-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  opacity: 0.5;
}

.chat-message:hover .copy-button {
  opacity: 1;
}

.copy-button:hover {
  background-color: rgba(42, 141, 243, 0.1);
  color: #2a8df3;
}

.copy-icon {
  font-size: 0.85rem;
}

/* 复制成功通知样式 */
:deep(.copy-notification) {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.9rem;
  z-index: 10000;
  opacity: 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

:deep(.copy-notification.show) {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* 连接状态指示器 */
.connection-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding:  3px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.connection-status.show {
  opacity: 1;
}

.connection-status.connected {
  background-color: rgba(40, 167, 69, 0.7);
  color: white;
}

.connection-status.disconnected {
  background-color: rgba(220, 53, 69, 0.7);
  color: white;
}

/* 目标信息容器样式 */
.target-info-container {
  width: 100%;
  margin-top: 15px;
  background-color: rgba(40, 40, 40, 0.8);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(100, 100, 100, 0.3);
}

.target-info-header {
  padding: 12px 15px;
  background-color: rgba(60, 60, 60, 0.8);
  border-bottom: 1px solid rgba(100, 100, 100, 0.2);
}

.target-info-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #eee;
  font-weight: 600;
}

/* 关键信息区域样式 */
.key-info-section {
  padding: 15px;
  border-bottom: 1px solid rgba(100, 100, 100, 0.2);
}

.key-info-section h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #ddd;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(100, 100, 100, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #bbb;
  font-size: 0.9rem;
  min-width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #eee;
  font-size: 0.9rem;
  text-align: right;
  word-break: break-word;
  flex: 1;
  margin-left: 10px;
}

/* 知识图谱区域样式 */
.knowledge-graph-section {
  padding: 15px;
}

.knowledge-graph-section h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #ddd;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-value {
    text-align: left;
    margin-left: 0;
    margin-top: 4px;
  }
}

/* 加载状态样式 */
.target-info-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #aaa;
  font-style: italic;
}

.target-info-error {
  padding: 15px;
  background-color: rgba(220, 53, 69, 0.1);
  border-left: 3px solid #dc3545;
  color: #dc3545;
  font-size: 0.9rem;
}

/* 右侧事件详情容器 - 调整布局让知识图谱占据底部 */
.event-details-container {
  display: flex;
  flex-direction: column;
  height: calc(100% - 35px);
  gap: 1px; /* 进一步缩小间距 */
  overflow: hidden;
}

/* 重新分配区域高度，让图像区域更大 */
.event-description-section {
  height: 8%;
  min-height: 50px;
  flex-shrink: 0;
}

.image-section {
  height: 35%; /* 增加图像区域高度 */
  min-height: 180px;
  flex-shrink: 0;
}

.detection-targets-section {
  flex: 1; /* 占据剩余空间 */
  min-height: 90px;
  flex-shrink: 0;
}

/* 优化四宫格图像样式 */
.grid-image-wrapper {
  position: relative;
  width: 100%;
  padding: 6px; /* 减少内边距 */
}

.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 3px; /* 增加网格间距使图像更清晰 */
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.grid-image-item {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.grid-image-item:hover {
  transform: scale(1.05);
  border-color: rgba(42, 141, 243, 0.6);
  z-index: 2;
  box-shadow: 0 4px 12px rgba(42, 141, 243, 0.4);
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: filter 0.3s ease;
}

.grid-image-item:hover .grid-image {
  filter: brightness(1.1);
}

/* 图像编号叠加层 */
.image-overlay {
  position: absolute;
  top: 4px;
  left: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.image-number {
  font-size: 0.7rem;
}

/* 优化全屏四宫格视图 */
.fullscreen-grid-view {
  width: 85vw;
  height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 6px;
  width: 100%;
  height: 100%;
  max-width: 85vh;
  max-height: 85vh;
  border-radius: 8px;
  overflow: hidden;
}

.fullscreen-grid-item {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
}

.fullscreen-grid-item:hover {
  transform: scale(1.03);
  border-color: rgba(42, 141, 243, 0.8);
  box-shadow: 0 6px 20px rgba(42, 141, 243, 0.4);
}

.fullscreen-grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fullscreen-grid-item:hover .fullscreen-grid-image {
  filter: brightness(1.1);
}

/* 全屏模式下的图像编号叠加层 */
.fullscreen-image-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

/* 优化区域标题样式 */
.section-header {
  padding: 6px 10px; /* 减少内边距 */
  background-color: rgba(60, 60, 60, 0.8);
  border-bottom: 1px solid rgba(100, 100, 100, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.section-header h4 {
  margin: 0;
  font-size: 0.85rem; /* 稍微减小字体 */
  color: #eee;
  font-weight: 500;
}

/* 优化内容区域 */
.section-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scrollable-content {
  overflow-y: auto;
  padding: 6px; /* 减少内边距 */
}

/* 优化事件描述样式 */
.event-meta {
  margin-bottom: 6px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px; /* 减少间距 */
  font-size: 0.8rem; /* 稍微减小字体 */
}

.event-summary {
  padding-top: 6px;
  border-top: 1px solid rgba(100, 100, 100, 0.1);
}

.event-summary p {
  margin: 0;
  color: #ddd;
  font-size: 0.85rem;
  line-height: 1.3; /* 紧凑行距 */
}

/* 优化目标列表样式 */
.target-item {
  background-color: rgba(60, 60, 60, 0.6);
  border-radius: 4px;
  padding: 6px; /* 减少内边距 */
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  margin-bottom: 4px; /* 减少间距 */
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px; /* 减少间距 */
}

.target-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 目标项中的综合查看按钮 */
.target-combined-view-button {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  margin-left: 8px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.target-combined-view-button:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(42, 141, 243, 0.6);
  transform: scale(1.05);
}

.target-name {
  font-weight: 600;
  color: #eee;
  font-size: 0.85rem; /* 稍微减小字体 */
}

.target-confidence {
  font-size: 0.75rem; /* 减小字体 */
  color: #aaa;
}

.target-details {
  font-size: 0.75rem; /* 减小字体 */
  color: #bbb;
}

/* 响应式调整 */
.combined-target-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.combined-target-container {
  width: 90vw;
  height: 85vh;
  background-color: rgba(15, 15, 20, 0.9);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  border: 2px solid rgba(100, 100, 100, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.close-combined-view {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 2001;
  transition: color 0.2s ease;
}

.close-combined-view:hover {
  color: #ff4444;
}

.combined-target-header {
  padding: 20px 25px 15px 25px;
  border-bottom: 2px solid rgba(100, 100, 100, 0.3);
  background-color: rgba(40, 40, 45, 0.8);
  backdrop-filter: blur(8px);
}

.combined-target-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.4rem;
  font-weight: 600;
}

.combined-target-content {
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

/* 左侧区域样式 - 动态高度分配 */
.combined-left-section {
  flex: 2; /* 占比 40% */
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow: hidden;
}

.real-image-section {
  /* 动态分配：真实影像区域根据内容自适应，但至少占40% */
  flex: 2;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.intro-section {
  /* 动态分配：介绍区域根据内容量自适应，默认较小 */
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 120px;
  max-height: 300px; /* 限制最大高度避免过大 */
}

/* 右侧知识图谱区域样式 */
.combined-right-section {
  flex: 3; /* 占比 60% */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 区域标题样式 */
.combined-left-section h4,
.combined-right-section h4 {
  margin: 0 0 10px 0;
  color: #ddd;
  font-size: 1.1rem;
  font-weight: 500;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(100, 100, 100, 0.2);
  flex-shrink: 0;
}

/* 图像容器样式 - 半透明背景 */
.image-container,
.graph-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(30, 30, 35, 0.6);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  border: 1px solid rgba(100, 100, 100, 0.2);
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.image-container:hover,
.graph-container:hover {
  border-color: rgba(42, 141, 243, 0.5);
  box-shadow: 0 2px 8px rgba(42, 141, 243, 0.3);
}

.combined-real-image,
.combined-graph-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.combined-real-image:hover,
.combined-graph-image:hover {
  transform: scale(1.02);
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(42, 141, 243, 0.4);
}

/* 介绍内容区域 - 半透明背景和动态高度 */
.intro-content-scrollable {
  flex: 1;
  background-color: rgba(30, 30, 35, 0.6);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  border: 1px solid rgba(100, 100, 100, 0.2);
  padding: 15px;
  overflow-y: auto;
  min-height: 0;
  /* 添加渐变滚动指示器 */
  background: linear-gradient(rgba(30, 30, 35, 0.6) 30%, transparent),
             linear-gradient(transparent, rgba(30, 30, 35, 0.6) 70%) 0 100%,
             radial-gradient(farthest-side at 50% 0, rgba(0,0,0,.2), transparent),
             radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,.2), transparent) 0 100%;
  background-repeat: no-repeat;
  background-size: 100% 40px, 100% 40px, 100% 14px, 100% 14px;
  background-attachment: local, local, scroll, scroll;
}

.intro-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.intro-detail-item {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  border-bottom: 1px solid rgba(100, 100, 100, 0.1);
  transition: background-color 0.2s ease;
}

.intro-detail-item:hover {
  background-color: rgba(50, 50, 55, 0.3);
  border-radius: 4px;
  padding-left: 8px;
  padding-right: 8px;
}

.intro-detail-item:last-child {
  border-bottom: none;
}

.intro-detail-label {
  font-weight: 600;
  color: #ccc;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.intro-detail-value {
  color: #eee;
  font-size: 0.85rem;
  line-height: 1.4;
  word-break: break-word;
}

/* 占位符样式 - 半透明背景 */
.no-image-placeholder,
.no-graph-placeholder,
.no-intro-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-style: italic;
  height: 100%;
  background-color: rgba(50, 50, 55, 0.3);
  border-radius: 6px;
  border: 1px dashed rgba(100, 100, 100, 0.3);
}

.no-intro-placeholder {
  height: auto;
  padding: 20px;
  min-height: 60px;
}

/* 响应式调整 - 保持动态分配 */
@media (max-width: 1200px) {
  .combined-target-container {
    width: 95vw;
    height: 90vh;
  }

  .combined-target-content {
    flex-direction: column;
    padding: 15px;
  }

  .combined-left-section {
    flex-direction: row;
    height: 50%;
    gap: 20px;
  }

  .real-image-section {
    flex: 1.5; /* 在水平布局中给图像更多空间 */
  }

  .intro-section {
    flex: 1;
    max-height: none;
  }

  .combined-right-section {
    height: 50%;
  }
}

@media (max-width: 768px) {
  .combined-target-content {
    padding: 10px;
    gap: 10px;
  }

  .combined-left-section {
    flex-direction: column;
    gap: 10px;
  }

  .combined-target-header h3 {
    font-size: 1.2rem;
  }

  .real-image-section {
    min-height: 150px;
  }

  .intro-section {
    min-height: 100px;
    max-height: 200px;
  }
}

/* 图像放大提示图标 */
.image-zoom-hint {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

.image-container:hover .image-zoom-hint,
.graph-container:hover .image-zoom-hint {
  opacity: 1;
}

.zoom-icon {
  font-size: 16px;
}

/* 全屏错误提示样式 */
.fullscreen-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 400px;
  height: 300px;
  background-color: rgba(50, 50, 50, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(100, 100, 100, 0.3);
  color: #ccc;
  font-size: 1.1rem;
}

.fullscreen-error p {
  margin: 0;
  text-align: center;
}

/* 全屏查看按钮样式 */
.graph-fullscreen-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  z-index: 10;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.graph-fullscreen-btn:hover {
  background-color: rgba(42, 141, 243, 0.8);
  border-color: rgba(42, 141, 243, 1);
  transform: scale(1.05);
}

.fullscreen-icon {
  font-size: 14px;
}

/* 全屏图谱覆盖层 - 确保层级高于综合展示界面(2000) */
.fullscreen-graph-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.95);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
}

.fullscreen-graph-container {
  width: 95vw;
  height: 95vh;
  background-color: #1a1a1a;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #444;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
}

.fullscreen-graph-header {
  padding: 15px 20px;
  background-color: #2a2a2a;
  border-bottom: 1px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fullscreen-graph-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
}

.close-fullscreen-graph {
  background: none;
  border: none;
  color: #aaa;
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  padding: 0 5px;
  transition: color 0.2s;
}

.close-fullscreen-graph:hover {
  color: #ff4444;
}

.fullscreen-graph-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #111 0%, #222 100%);
}
</style>


