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

      <!-- 图像展示区域 -->
      <div v-if="selectedEvent && (selectedEvent.detectionImagePath || selectedEvent.imagePath)" class="image-container">
        <div class="image-header">
          <span class="image-title">{{ selectedEvent.label }} - {{ formatTime(selectedEvent.time) }}</span>
          <!-- 添加图像切换按钮 -->
          <div class="image-switch-buttons">
            <button
              class="image-switch-button"
              :class="{ 'active': showDetectionImage }"
              @click="showDetectionImage = true"
              title="查看检测结果图"
            >
              检测图
            </button>
            <button
              class="image-switch-button"
              :class="{ 'active': !showDetectionImage }"
              @click="showDetectionImage = false"
              title="查看原始图像"
            >
              原始图
            </button>
          </div>
          <button class="close-button" @click="closeImage">×</button>
        </div>
        <div class="image-wrapper">
          <img
            :src="getCurrentImageUrl()"
            class="event-image"
            @click="openFullImage"
            alt="事件图像"
          />
          <button class="zoom-button" @click="openFullImage">
            <i class="zoom-icon">🔍</i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 全屏图像预览 - 添加拖动功能和改变按钮位置 -->
  <div v-if="fullScreenImage" class="fullscreen-overlay" @click="closeFullScreen">
    <div
      class="fullscreen-container"
      @click.stop
    >
      <button class="close-fullscreen" @click="closeFullScreen">×</button>

      <!-- 全屏模式下也添加图像切换按钮 -->
      <div class="fullscreen-image-switch">
        <button
          class="image-switch-button"
          :class="{ 'active': showDetectionImage }"
          @click="showDetectionImage = true"
        >
          检测图
        </button>
        <button
          class="image-switch-button"
          :class="{ 'active': !showDetectionImage }"
          @click="showDetectionImage = false"
        >
          原始图
        </button>
      </div>

      <img
        :src="getCurrentImageUrl()"
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

      <!-- 右下角垂直排列的缩放按钮 -->
      <div class="zoom-controls-vertical">
        <button class="zoom-in" @click="zoomIn">+</button>
        <button class="zoom-out" @click="zoomOut">−</button>
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
    MyTitle
  },
  data() {
    return {
      refreshInterval: null, // 定时器引用
      events: [], // 存储事件数据
      showtext: "", // 用于显示后端消息
      selectedEvent: null, // 当前选中的事件
      fullScreenImage: false, // 是否全屏显示图像
      zoomLevel: 1, // 图像缩放级别
      showDetectionImage: true, // 是否显示检测结果图像，默认为true

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
      currentEventArrow: null // 当前事件箭头标记
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
        } else if (this.selectedEvent.imagePath) {
          return `/RZtest/${this.selectedEvent.imagePath}`
        }

        return "" // 如果没有图像路径则返回空字符串
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

    // 选择事件
    selectEvent(event) {
      this.selectedEvent = event
      // 选择事件时默认展示检测图像
      this.showDetectionImage = true

      // 清除之前的标记
      this.clearEventMarkers()

      // 如果选择了事件，尝试立即定位
      if (event) {
        console.log("选择事件:", event.label, event.eventDir)
        // 优先提取并显示经纬度
        this.getEventDetails(event)
      }
    },

    // 获取事件详细信息 - 修改为优先处理飞行定位
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

            // 查找事件中的坐标信息
            const detectionEvent = eventData.find(item => item.type === "Detection")

            if (detectionEvent && detectionEvent.coordinates) {
              const { longitude, latitude } = detectionEvent.coordinates

              if (longitude !== undefined && latitude !== undefined) {
                // 优先执行飞行定位，确保无论标记是否成功都会飞向目标点
                this.flyToEventLocation(longitude, latitude)

                // 然后尝试添加标记
                try {
                  this.addEventMarker(longitude, latitude, event.label, event.summary)
                } catch (error) {
                  console.error("添加事件标记失败:", error)
                  // 即使标记添加失败，已经飞向了目标位置
                }
              } else {
                console.log("坐标数据无效")
              }
            } else {
              console.log("事件数据中没有找到有效的坐标信息")
            }
          } else {
            console.error("获取事件详情失败:", response.data.message)
          }
        })
        .catch(error => {
          console.error("获取事件详细信息失败:", error)
        })
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
    openFullImage() {
      this.fullScreenImage = true
      // 重置缩放和位置
      this.zoomLevel = 1
      this.imagePosition = { x: 0, y: 0 }
      this.lastPosition = { x: 0, y: 0 }
    },

    // 优化图像拖动相关方法
    startDrag(event) {
      this.isDragging = true
      this.dragStartX = event.clientX
      this.dragStartY = event.clientY
      this.lastPosition = { ...this.imagePosition }

      event.target.style.cursor = "grabbing"
    },

    onDrag(event) {
      if (!this.isDragging) { return }

      const deltaX = (event.clientX - this.dragStartX) / this.zoomLevel
      const deltaY = (event.clientY - this.dragStartY) / this.zoomLevel

      this.imagePosition = {
        x: this.lastPosition.x + deltaX,
        y: this.lastPosition.y + deltaY
      }
    },

    stopDrag(event) {
      if (this.isDragging) {
        this.isDragging = false
        this.lastPosition = { ...this.imagePosition }

        if (event.target) {
          event.target.style.cursor = "grab"
        }
      }
    },

    // 关闭全屏图像
    closeFullScreen() {
      this.fullScreenImage = false
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
  z-index: 1000;
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
  top: -40px;
  right: -40px;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1001;
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

.fullscreen-image-switch .image-switch-button.active {
  background-color: #2a8df3;
  border-color: #1c7ad7;
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

/* 添加垂直排列的缩放控制按钮 */
.zoom-controls-vertical {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1002; /* 确保在图像上方 */
}

.zoom-in, .zoom-out {
  background-color: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.7);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.zoom-in:hover, .zoom-out:hover {
  background-color: rgba(42, 141, 243, 0.8);
  transform: scale(1.1);
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
  padding: 3px 6px;
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
</style>

