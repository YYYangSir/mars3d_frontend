<template>
  <div class="knowledge-graph-container" :class="{ 'fullscreen-mode': isFullscreen }">
    <div class="graph-canvas" ref="graphCanvas"></div>
    <div v-if="!hasValidData" class="no-data-message">
      暂无知识图谱数据
    </div>
    <!-- 添加缩放控制 -->
    <div v-if="hasValidData && !isFullscreen" class="graph-controls">
      <button class="control-button" @click="zoomIn" title="放大">+</button>
      <button class="control-button" @click="zoomOut" title="缩小">-</button>
      <button class="control-button" @click="resetZoom" title="重置">⌂</button>
      <button class="control-button" @click="$emit('request-fullscreen')" title="全屏">⛶</button>
    </div>
    <!-- 全屏模式下的缩放控制 -->
    <div v-if="hasValidData && isFullscreen" class="fullscreen-graph-controls">
      <button class="control-button" @click="zoomIn" title="放大">+</button>
      <button class="control-button" @click="zoomOut" title="缩小">-</button>
      <button class="control-button" @click="resetZoom" title="重置">⌂</button>
      <button class="control-button" @click="fitToView" title="适应视图">📐</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "KnowledgeGraph",
  props: {
    graphData: {
      type: [Object, Array],
      default: () => []
    },
    isFullscreen: {
      type: Boolean,
      default: false
    }
  },
  emits: ["request-fullscreen"],
  data() {
    return {
      nodes: [],
      relationships: [],
      hasValidData: false,
      svgElement: null,
      currentZoom: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      containerSize: { width: 300, height: 250 },
      simulation: null, // 物理模拟器
      animationFrameId: null
    }
  },
  mounted() {
    this.renderGraph()
    this.setupResizeObserver()
  },
  watch: {
    graphData: {
      handler() {
        this.renderGraph()
      },
      deep: true
    },
    isFullscreen: {
      handler() {
        this.$nextTick(() => {
          this.renderGraph()
        })
      }
    }
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    this.stopSimulation()
  },
  methods: {
    // 设置容器尺寸监听
    setupResizeObserver() {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.$nextTick(() => {
            // 仅更新尺寸，不完全重绘
            if (this.$refs.graphCanvas) {
              const rect = this.$refs.graphCanvas.getBoundingClientRect()
              this.containerSize.width = Math.max(rect.width || 300, 300)
              this.containerSize.height = Math.max(rect.height || 250, 250)
              if (this.simulation) {
                this.simulation.center = { x: this.containerSize.width / 2, y: this.containerSize.height / 2 }
                this.simulation.restart()
              }
            }
          })
        })
        this.resizeObserver.observe(this.$refs.graphCanvas)
      }
    },

    // 解析知识图谱数据
    parseGraphData() {
      if (!this.graphData) {
        this.hasValidData = false
        return
      }

      // 新格式支持: { nodes: [], links: [] }
      if (this.graphData.nodes && this.graphData.links) {
          this.nodes = this.graphData.nodes.map(n => ({
              id: n.id,
              label: n.name || n.label || "未知",
              type: n.label || "unknown",
              properties: n.properties || {},
              category: n.category,
              // 物理模拟属性初始化
              x: 0,
y: 0,
vx: 0,
vy: 0
          }))
          this.relationships = this.graphData.links.map(l => ({
              source: l.source,
              target: l.target,
              type: l.name || l.type || "关联",
              properties: l.properties || {}
          }))
          this.hasValidData = this.nodes.length > 0
          return
      }

      if (!Array.isArray(this.graphData)) {
        this.hasValidData = false
        return
      }

      const nodesMap = new Map()
      const relationships = []

      // 遍历路径数据，提取节点和关系
      this.graphData.forEach(item => {
        if (item.p && item.p.segments) {
          item.p.segments.forEach(segment => {
            // 添加起始节点
            if (segment.start) {
              const startId = segment.start.identity || segment.start.elementId
              if (!nodesMap.has(startId)) {
                nodesMap.set(startId, {
                  id: startId,
                  label: segment.start.properties.name || "未知",
                  type: segment.start.labels && segment.start.labels.length > 0 ? segment.start.labels[0] : "unknown",
                  properties: segment.start.properties || {},
                  x: 0,
y: 0,
vx: 0,
vy: 0
                })
              }
            }

            // 添加结束节点
            if (segment.end) {
              const endId = segment.end.identity || segment.end.elementId
              if (!nodesMap.has(endId)) {
                nodesMap.set(endId, {
                  id: endId,
                  label: segment.end.properties.name || "未知",
                  type: segment.end.labels && segment.end.labels.length > 0 ? segment.end.labels[0] : "unknown",
                  properties: segment.end.properties || {},
                  x: 0,
y: 0,
vx: 0,
vy: 0
                })
              }
            }

            // 添加关系
            if (segment.relationship && segment.start && segment.end) {
              const sourceId = segment.start.identity || segment.start.elementId
              const targetId = segment.end.identity || segment.end.elementId

              relationships.push({
                source: sourceId,
                target: targetId,
                type: segment.relationship.type || "关联",
                properties: segment.relationship.properties || {}
              })
            }
          })
        }
      })

      this.nodes = Array.from(nodesMap.values())
      this.relationships = relationships
      this.hasValidData = this.nodes.length > 0
    },

    // 渲染知识图谱
    renderGraph() {
      this.stopSimulation()
      this.parseGraphData()

      if (!this.hasValidData || !this.$refs.graphCanvas) {
        return
      }

      const canvas = this.$refs.graphCanvas
      canvas.innerHTML = ""

      // 获取容器尺寸
      const rect = canvas.getBoundingClientRect()
      this.containerSize.width = Math.max(rect.width || 300, 300)
      this.containerSize.height = Math.max(rect.height || 250, 250)

      // 创建SVG容器
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      svg.setAttribute("width", "100%")
      svg.setAttribute("height", "100%")
      svg.style.background = "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)"
      svg.style.cursor = "grab"

      this.addDefs(svg)
      this.addPanSupport(svg)

      canvas.appendChild(svg)
      this.svgElement = svg

      // 创建图层组
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g")
      g.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.currentZoom})`)
      svg.appendChild(g)

      // 创建连线组和节点组
      const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
      const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
      g.appendChild(linkGroup)
      g.appendChild(nodeGroup)

      // 初始化物理模拟
      this.initSimulation(linkGroup, nodeGroup)
    },

    // 初始化物理模拟
    initSimulation(linkGroup, nodeGroup) {
      const width = this.containerSize.width
      const height = this.containerSize.height
      const center = { x: width / 2, y: height / 2 }

      // 1. 找出核心节点（Event 或 武器系统）作为起始点
      const coreNode = this.nodes.find(n => n.type === "Event") ||
                       this.nodes.find(n => n.type === "武器系统") ||
                       this.nodes[0]

      // 2. 初始化所有节点状态：隐藏且位置在中心
      this.nodes.forEach(node => {
        node.x = center.x
        node.y = center.y
        node.vx = 0
        node.vy = 0
        node.radius = this.getNodeRadius(node)
        node.visible = false // 初始不可见
        node.level = -1 // 层级标记
        node.fixed = (node.id === coreNode.id) // 标记核心节点为固定
      })

      // 3. 构建邻接表用于广度优先搜索(BFS)
      const adjacency = {}
      this.relationships.forEach(rel => {
          if (!adjacency[rel.source]) { adjacency[rel.source] = [] }
          if (!adjacency[rel.target]) { adjacency[rel.target] = [] }
          adjacency[rel.source].push(rel.target)
          adjacency[rel.target].push(rel.source)
      })

      // 4. BFS 分层，确定显示顺序
      const queue = [{ id: coreNode.id, level: 0 }]
      const visited = new Set([coreNode.id])
      const levels = [[coreNode]] // 按层级存储节点

      while (queue.length > 0) {
          const { id, level } = queue.shift()
          const neighbors = adjacency[id] || []

          neighbors.forEach(neighborId => {
              if (!visited.has(neighborId)) {
                  visited.add(neighborId)
                  const neighborNode = this.nodes.find(n => n.id === neighborId)
                  if (neighborNode) {
                      neighborNode.level = level + 1
                      queue.push({ id: neighborId, level: level + 1 })

                      if (!levels[level + 1]) { levels[level + 1] = [] }
                      levels[level + 1].push(neighborNode)
                  }
              }
          })
      }

      // 处理孤立节点（如果有）
      this.nodes.forEach(node => {
          if (!visited.has(node.id)) {
              node.level = levels.length
              if (!levels[levels.length]) { levels[levels.length] = [] }
              levels[levels.length].push(node)
          }
      })

      // 5. 逐步显示动画逻辑
      let currentLevel = 0
      const showNextLevel = () => {
          if (currentLevel < levels.length) {
              levels[currentLevel].forEach(node => {
                  node.visible = true
                  // 给新出现的节点一个微小的随机初速度，打破平衡
                  node.x = center.x + (Math.random() - 0.5) * 10
                  node.y = center.y + (Math.random() - 0.5) * 10
              })
              currentLevel++
              setTimeout(showNextLevel, 1500) // 减慢生成速度：每1500ms显示下一层
          }
      }

      // 立即显示第一层
      showNextLevel()

      // 预处理连线索引
      const links = this.relationships.map(rel => {
        const sourceNode = this.nodes.find(n => n.id === rel.source)
        const targetNode = this.nodes.find(n => n.id === rel.target)
        return { ...rel, sourceNode, targetNode }
      }).filter(l => l.sourceNode && l.targetNode)

      // 物理参数 (调整为同心圆布局参数)
      const repulsion = 1500 // 斥力适中，主要靠轨道约束
      const springLength = 100 // 连线长度不宜过长，避免跨层级拉扯
      const springStrength = 0.05 // 连线强度
      const damping = 0.7 // 阻尼较大，减少震荡，快速稳定
      const ringSpacing = 180 // 同心圆半径间距

      // 动画循环
      const tick = () => {
        // 1. 计算斥力 (只计算可见节点)
        const visibleNodes = this.nodes.filter(n => n.visible)

        for (let i = 0; i < visibleNodes.length; i++) {
          const n1 = visibleNodes[i]
          for (let j = i + 1; j < visibleNodes.length; j++) {
            const n2 = visibleNodes[j]
            let dx = n1.x - n2.x
            let dy = n1.y - n2.y
            let distSq = dx * dx + dy * dy

            // 基础斥力
            if (distSq === 0) { distSq = 0.1; dx = Math.random(); dy = Math.random() }
            const dist = Math.sqrt(distSq)
            const force = repulsion / distSq
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force

            if (!n1.fixed) {
                n1.vx += fx
                n1.vy += fy
            }
            if (!n2.fixed) {
                n2.vx -= fx
                n2.vy -= fy
            }
          }

          // --- 核心修改：同心圆轨道约束力 ---
          if (n1.fixed) { continue } // 核心节点跳过轨道约束

          // 计算节点当前距离中心的距离
          const dx = n1.x - center.x
          const dy = n1.y - center.y
          const currentDist = Math.sqrt(dx * dx + dy * dy) || 1

          // 计算目标轨道半径 (层级 * 间距)
          // level 0 (核心) -> 半径 0
          // level 1 -> 半径 180
          // level 2 -> 半径 360
          const targetRadius = (n1.level || 0) * ringSpacing

          // 计算轨道校正力 (将节点拉向其所属的轨道圆环)
          // 强度设为 0.05，既有约束又有弹性
          const radialForce = (currentDist - targetRadius) * 0.05

          const rfx = (dx / currentDist) * radialForce
          const rfy = (dy / currentDist) * radialForce

          n1.vx -= rfx
          n1.vy -= rfy
        }

        // 2. 计算引力 (只计算两端都可见的连线)
        links.forEach(link => {
          if (!link.sourceNode.visible || !link.targetNode.visible) { return }

          const source = link.sourceNode
          const target = link.targetNode

          const dx = target.x - source.x
          const dy = target.y - source.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1

          // 仅当距离过大时才施加拉力，允许同层节点在轨道上自由分布
          if (dist > springLength) {
              const force = (dist - springLength) * springStrength
              const fx = (dx / dist) * force
              const fy = (dy / dist) * force

              if (!source.fixed) {
                  source.vx += fx
                  source.vy += fy
              }
              if (!target.fixed) {
                  target.vx -= fx
                  target.vy -= fy
              }
          }
        }) // 3. 更新位置 (只更新可见节点)
        let maxVelocity = 0

        // 动态阻尼：生成完成后增加阻尼，加速静止
        const isGenerating = currentLevel < levels.length
        const currentDamping = isGenerating ? damping : 0.5

        this.nodes.forEach(node => {
          if (!node.visible) { return }

          // 核心节点固定在中心，不更新位置
          if (this.isCoreNode(node) && node.level === 0) {
              node.x = center.x
              node.y = center.y
              node.vx = 0
              node.vy = 0
              return
          }

          node.vx *= currentDamping
          node.vy *= currentDamping
          node.x += node.vx
          node.y += node.vy
          maxVelocity = Math.max(maxVelocity, Math.abs(node.vx), Math.abs(node.vy))
        })

        // 4. 渲染
        this.drawFrame(linkGroup, nodeGroup, links)

        // 5. 继续循环
        // 如果生成完成，使用较高的速度阈值(0.2)来判定静止，避免微小震荡导致的持续计算
        const stopThreshold = isGenerating ? 0.1 : 0.2

        if (maxVelocity > stopThreshold || isGenerating) {
          this.animationFrameId = requestAnimationFrame(tick)
        }
      }

      this.simulation = {
        restart: () => {
           if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId) }
           tick()
        },
        center
      }
      tick()
    },

    stopSimulation() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
      this.simulation = null
    },

    // 绘制每一帧
    drawFrame(linkGroup, nodeGroup, links) {
      // 清空现有元素
      linkGroup.innerHTML = ""
      nodeGroup.innerHTML = ""

      const isLargeView = this.isFullscreen || this.containerSize.width > 400

      // 绘制连线 (只绘制两端都可见的连线)
      links.forEach(link => {
        if (!link.sourceNode.visible || !link.targetNode.visible) { return }

        const source = link.sourceNode
        const target = link.targetNode

        // 计算连线端点（减去节点半径）
        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        if (dist < source.radius + target.radius) { return }

        const ux = dx / dist
        const uy = dy / dist

        const x1 = source.x + ux * source.radius
        const y1 = source.y + uy * source.radius
        const x2 = target.x - ux * (target.radius + 5) // 留出箭头空间
        const y2 = target.y - uy * (target.radius + 5)

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line.setAttribute("x1", x1)
        line.setAttribute("y1", y1)
        line.setAttribute("x2", x2)
        line.setAttribute("y2", y2)
        line.setAttribute("stroke", "#999")
        line.setAttribute("stroke-width", isLargeView ? "2" : "1.5")
        line.setAttribute("stroke-opacity", "0.8")
        line.setAttribute("marker-end", "url(#arrowhead)")

        // 连线动画效果：新出现的连线透明度渐变
        line.style.transition = "opacity 0.5s"
        line.style.opacity = "1"

        linkGroup.appendChild(line)

        // 连线文字 (仅在长连线或全屏时显示)
        if (isLargeView || dist > 120) {
            const mx = (x1 + x2) / 2
            const my = (y1 + y2) / 2
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
            text.setAttribute("x", mx)
            text.setAttribute("y", my)
            text.setAttribute("text-anchor", "middle")
            text.setAttribute("fill", "#ccc")
            text.setAttribute("font-size", "11")
            text.textContent = link.type
            linkGroup.appendChild(text)
        }
      })

      // 绘制节点 (只绘制可见节点)
      this.nodes.forEach(node => {
        if (!node.visible) { return }

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g")
        g.setAttribute("transform", `translate(${node.x}, ${node.y})`)
        g.style.cursor = "pointer"

        // 节点出现动画
        g.style.transition = "opacity 0.5s, transform 0.5s"
        g.style.opacity = "1"

        // 节点圆
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        circle.setAttribute("r", node.radius)
        circle.setAttribute("fill", `url(#gradient-${this.getNodeTypeKey(node)})`)
        circle.setAttribute("stroke", "#fff")
        circle.setAttribute("stroke-width", isLargeView ? "2.5" : "2")
        // 添加发光效果
        if (this.isCoreNode(node)) {
             circle.setAttribute("filter", "drop-shadow(0 0 10px rgba(255, 68, 68, 0.8))")
        }
        g.appendChild(circle)

        // 节点文字
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
        text.setAttribute("y", node.radius + 18)
        text.setAttribute("text-anchor", "middle")
        text.setAttribute("fill", "#fff")
        text.setAttribute("font-size", isLargeView ? "14" : "12")
        text.setAttribute("font-weight", this.isCoreNode(node) ? "bold" : "normal")
        // 文字描边保护
        text.style.textShadow = "0 0 4px #000"

        let label = node.label
        if (!isLargeView && label.length > 8) { label = label.substring(0, 7) + "..." }
        text.textContent = label
        g.appendChild(text)

        // 交互事件
        g.addEventListener("mouseenter", () => this.showNodeTooltip(node, node.x, node.y, isLargeView))
        g.addEventListener("mouseleave", () => this.hideNodeTooltip())

        nodeGroup.appendChild(g)
      })
    },


    // 获取节点半径 (视觉分级 - 调整大小)
    getNodeRadius(node) {
        const isLarge = this.isFullscreen || this.containerSize.width > 400
        const base = isLarge ? 1.0 : 0.8 // 稍微减小基准倍率，避免过大

        if (node.type === "Event" || node.label.includes("事件")) { return 30 * base }
        if (node.type === "Intelligence" || node.type === "Decision") { return 25 * base }
        if (node.type === "武器系统" || node.type === "导弹") { return 25 * base }
        if (node.type === "国家" || node.type === "企业") { return 20 * base }
        return 15 * base // 保持最小节点可见性
    },

    isCoreNode(node) {
        return ["Event", "武器系统", "导弹", "Intelligence", "Decision"].includes(node.type) || node.label.includes("事件")
    },

    getNodeTypeKey(node) {
        // 映射到已定义的渐变ID
        const type = node.type
        if (["Event", "武器系统", "导弹"].includes(type)) { return "武器系统" } // 红色系
        if (["Intelligence"].includes(type)) { return "情报" } // 蓝色系
        if (["Decision"].includes(type)) { return "决策" } // 黄色系
        if (["Info"].includes(type)) { return "信息" } // 灰色系
        if (["弹药", "制导技术"].includes(type)) { return "弹药" } // 橙色系
        if (["国家", "地区"].includes(type)) { return "国家" } // 蓝色系
        return "企业" // 紫色系/默认
    },

    // 添加SVG定义元素
    addDefs(svg) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")

      // 箭头标记
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker")
      marker.setAttribute("id", "arrowhead")
      marker.setAttribute("markerWidth", "10")
      marker.setAttribute("markerHeight", "7")
      marker.setAttribute("refX", "9")
      marker.setAttribute("refY", "3.5")
      marker.setAttribute("orient", "auto")
      marker.setAttribute("markerUnits", "strokeWidth")

      const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
      arrowPath.setAttribute("d", "M 0,0 L 0,7 L 10,3.5 z")
      arrowPath.setAttribute("fill", "#666")
      arrowPath.setAttribute("opacity", "0.8")

      marker.appendChild(arrowPath)
      defs.appendChild(marker)

      // 为不同类型节点创建渐变
      const nodeTypes = ["武器系统", "弹药", "国家", "地区", "企业", "部队", "批次", "制导技术", "情报", "决策", "信息"]
      const colors = ["#ff4444", "#ff8844", "#4488ff", "#44ff88", "#8844ff", "#ffff44", "#ff44ff", "#44ffff", "#00ccff", "#ffcc00", "#cccccc"]

      nodeTypes.forEach((type, index) => {
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient")
        gradient.setAttribute("id", `gradient-${type}`)
        gradient.setAttribute("cx", "30%")
        gradient.setAttribute("cy", "30%")

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
        stop1.setAttribute("offset", "0%")
        stop1.setAttribute("stop-color", colors[index])
        stop1.setAttribute("stop-opacity", "1")

        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
        stop2.setAttribute("offset", "100%")
        stop2.setAttribute("stop-color", this.darkenColor(colors[index], 0.3))
        stop2.setAttribute("stop-opacity", "1")

        gradient.appendChild(stop1)
        gradient.appendChild(stop2)
        defs.appendChild(gradient)
      })

      svg.appendChild(defs)
    },

    // 颜色处理工具
    darkenColor(color, factor) {
      const hex = color.replace("#", "")
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)

      const newR = Math.floor(r * (1 - factor))
      const newG = Math.floor(g * (1 - factor))
      const newB = Math.floor(b * (1 - factor))

      return `rgb(${newR}, ${newG}, ${newB})`
    },

    // 添加平移支持
    addPanSupport(svg) {
      let isDragging = false
      let startX, startY

      svg.addEventListener("mousedown", (e) => {
        isDragging = true
        startX = e.clientX - this.panX
        startY = e.clientY - this.panY
        svg.style.cursor = "grabbing"
        e.preventDefault()
      })

      svg.addEventListener("mousemove", (e) => {
        if (isDragging) {
          this.panX = e.clientX - startX
          this.panY = e.clientY - startY
          this.updateTransform()
          e.preventDefault()
        }
      })

      svg.addEventListener("mouseup", () => {
        isDragging = false
        svg.style.cursor = "grab"
      })

      svg.addEventListener("mouseleave", () => {
        isDragging = false
        svg.style.cursor = "grab"
      })

      // 滚轮缩放
      svg.addEventListener("wheel", (e) => {
        e.preventDefault()
        const rect = svg.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const newZoom = Math.max(0.2, Math.min(5, this.currentZoom * delta))

        // 计算缩放中心
        const scaleFactor = newZoom / this.currentZoom
        this.panX = mouseX - (mouseX - this.panX) * scaleFactor
        this.panY = mouseY - (mouseY - this.panY) * scaleFactor
        this.currentZoom = newZoom

        this.updateTransform()
      })
    },

    // 更新变换
    updateTransform() {
      if (this.svgElement) {
        const g = this.svgElement.querySelector("g")
        if (g) {
          g.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.currentZoom})`)
        }
      }
    },

    // 缩放控制
    zoomIn() {
      this.currentZoom *= 1.3
      this.currentZoom = Math.min(5, this.currentZoom)
      this.updateTransform()
    },

    zoomOut() {
      this.currentZoom *= 0.7
      this.currentZoom = Math.max(0.2, this.currentZoom)
      this.updateTransform()
    },

    resetZoom() {
      this.currentZoom = 1
      this.panX = 0
      this.panY = 0
      this.updateTransform()
      this.$nextTick(() => {
        this.fitToView()
      })
    },

    // 适应视图 - 让图谱完整显示在容器中
    fitToView() {
      if (!this.hasValidData || !this.svgElement) {
        return
      }

      // 简单重置，因为节点是动态的，很难精确计算边界
      this.currentZoom = 1
      this.panX = 0
      this.panY = 0
      this.updateTransform()
    },

    // 显示节点详情提示
    showNodeTooltip(node, x, y, isLargeView) {
      this.hideNodeTooltip()

      const tooltip = document.createElement("div")
      tooltip.className = "node-tooltip"

      // 计算屏幕坐标
      const rect = this.$refs.graphCanvas.getBoundingClientRect()
      const screenX = x * this.currentZoom + this.panX + rect.left
      const screenY = y * this.currentZoom + this.panY + rect.top

      tooltip.style.position = "fixed"
      tooltip.style.left = `${screenX + (isLargeView ? 35 : 25)}px`
      tooltip.style.top = `${screenY - (isLargeView ? 20 : 15)}px`
      tooltip.style.background = "rgba(0, 0, 0, 0.95)"
      tooltip.style.color = "white"
      tooltip.style.padding = isLargeView ? "12px 15px" : "10px 12px"
      tooltip.style.borderRadius = "8px"
      tooltip.style.fontSize = isLargeView ? "13px" : "11px"
      tooltip.style.zIndex = "4000" // 提高层级，确保在全屏模式下也能显示
      tooltip.style.maxWidth = isLargeView ? "350px" : "250px"
      tooltip.style.wordWrap = "break-word"
      tooltip.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.6)"
      tooltip.style.border = "2px solid rgba(255, 255, 255, 0.2)"
      tooltip.style.backdropFilter = "blur(5px)"

      const color = this.getNodeColor(node.type)
      let content = `<div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; margin-bottom: 8px;">
        <strong style="color: ${color}; font-size: ${isLargeView ? "15px" : "13px"}">${node.label}</strong><br>
        <span style="color: #aaa; font-size: ${isLargeView ? "11px" : "10px"}">类型: ${node.type}</span>
      </div>`

      // 显示关键属性
      if (node.properties && Object.keys(node.properties).length > 0) {
        const importantProps = ["射程", "重量", "精度", "数量", "年份", "类型", "状态", "机动速度", "装填时间", "操作人员", "时间", "坐标"]
        let hasProps = false

        importantProps.forEach(key => {
          if (node.properties[key] && key !== "name") {
            const value = Array.isArray(node.properties[key])
              ? node.properties[key].join(", ")
              : node.properties[key]
            content += `<div style="margin: 4px 0; color: #ddd; font-size: ${isLargeView ? "12px" : "10px"}">
              <span style="color: #bbb">${key}:</span> ${value}
            </div>`
            hasProps = true
          }
        })

        if (!hasProps && Object.keys(node.properties).length > 1) {
          content += `<div style="color: #aaa; font-style: italic; font-size: ${isLargeView ? "11px" : "10px"}">
            包含${Object.keys(node.properties).length - 1}个属性
          </div>`
        }
      }

      tooltip.innerHTML = content
      document.body.appendChild(tooltip)
    },

    // 根据节点类型获取颜色
    getNodeColor(type) {
      const colorMap = {
        Event: "#ff4444",
        武器系统: "#ff4444",
        导弹: "#ff4444",
        弹药: "#ff8844",
        国家: "#4488ff",
        地区: "#44ff88",
        企业: "#8844ff",
        部队: "#ffff44",
        批次: "#ff44ff",
        制导技术: "#44ffff"
      }
      return colorMap[type] || "#888888"
    },

    // 隐藏节点提示
    hideNodeTooltip() {
      const existingTooltip = document.querySelector(".node-tooltip")
      if (existingTooltip) {
        document.body.removeChild(existingTooltip)
      }
    }
  }
}
</script>

<style scoped>
.knowledge-graph-container {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(100, 100, 100, 0.3);
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(35, 35, 35, 0.95) 100%);
  overflow: hidden;
  position: relative;
}

.knowledge-graph-container.fullscreen-mode {
  border-radius: 0;
  border: none;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.98) 0%, rgba(30, 30, 30, 0.98) 100%);
}

.graph-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #aaa;
  font-style: italic;
  font-size: 0.9rem;
  text-align: center;
}

/* 图谱控制按钮 */
.graph-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 100;
}

.fullscreen-graph-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
}

.control-button {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, rgba(42, 141, 243, 0.9) 0%, rgba(30, 100, 200, 0.9) 100%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
}

.fullscreen-graph-controls .control-button {
  width: 40px;
  height: 40px;
  font-size: 16px;
}

.control-button:hover {
  background: linear-gradient(135deg, rgba(42, 141, 243, 1) 0%, rgba(30, 100, 200, 1) 100%);
  transform: scale(1.1);
  box-shadow: 0 6px 15px rgba(42, 141, 243, 0.4);
}

.control-button:active {
  transform: scale(0.95);
}

/* 全局样式，避免scoped限制 */
:global(.node-tooltip) {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6) !important;
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(5px) !important;
  pointer-events: none !important;
}
</style>
