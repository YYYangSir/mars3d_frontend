const fs = require('fs');
const file = '/home/sdc/yangziyan/mars3d-vue-project-master/src/widgets/demo/mars-new/front-main/index.vue';
let content = fs.readFileSync(file, 'utf8');

const newRenderAllEvents = `    // 渲染所有事件标记
    renderAllEventsToMap() {
      if (!this.mapInstance || !this.eventMarkerLayer) {
        return
      }

      // 清空现有图层内容
      this.eventMarkerLayer.clear()
      const mars3dInstance = window.mars3d || mars3d

      this.events.forEach((event) => {
        // 如果事件没有经纬度信息，跳过不渲染
        if (!event.longitude || !event.latitude) {
          return
        }

        const isSelected = this.selectedEvent && this.selectedEvent.id === event.id

        // 创建高亮的倒三角符号，选中事件点用绿色，未选为红色
        const svgColor = isSelected ? "%2300ff00" : "%23ff0000"
        
        // 我们改用更为兼容可靠的 DivGraphic 渲染出精美倒三角交互 UI，防止部分 Entity 图层对 svg 解析失败
        try {
            const marker = new mars3dInstance.graphic.DivGraphic({
              position: [event.longitude, event.latitude],
              style: {
                html: \`
                  <div style="cursor: pointer; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 8px \${isSelected ? 'rgba(0,255,0,0.8)' : 'rgba(255,0,0,0.8)'});">
                    <div style="background: rgba(0,0,0,0.6); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px; margin-bottom: 5px; white-space: nowrap; border: 1px solid \${isSelected ? '#00ff00' : '#ff0000'};">
                      \${event.label || "事件位置"}
                    </div>
                    <svg width='\${isSelected ? 40 : 32}' height='\${isSelected ? 40 : 32}' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'>
                      <polygon points='16,32 0,0 32,0' fill='\${isSelected ? "#00ff00" : "#ff0000"}' stroke='#ffffff' stroke-width='2'/>
                    </svg>
                  </div>
                \`,
                horizontalOrigin: Cesium.HorizontalOrigin?.CENTER,
                verticalOrigin: Cesium.VerticalOrigin?.BOTTOM,
                clampToGround: true
              },
              attr: { ...event } // 绑定事件数据供点击使用
            })

            // 添加点击事件和弹窗
            marker.bindPopup(
              "<div class='mars3d-template-titile'>" + (event.label || "事件详情") + "</div>" +
              "<div class='mars3d-template-content'>" +
                "<div>" + (event.summary || "暂无详细说明") + "</div>" +
                "<div>经度: " + parseFloat(event.longitude).toFixed(6) + "</div>" +
                "<div>纬度: " + parseFloat(event.latitude).toFixed(6) + "</div>" +
              "</div>",
              {
                offsetY: -60,
                closeButton: true
              }
            )

            marker.on(mars3dInstance.EventType.click, (e) => {
              this.selectEvent(event)
            })

            this.eventMarkerLayer.addGraphic(marker)

            // 对选中的事件添加向下的显眼指示箭头
            if (isSelected) {
              const arrow = new mars3dInstance.graphic.GeoEntity({
                name: "事件箭头",
                position: [event.longitude, event.latitude, 1000],
                style: {
                  shape: "cylinder",
                  color: "#1aff00",
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
              this.eventMarkerLayer.addGraphic(arrow)
            }
        } catch(e) {
            console.error("渲染标记时出错", e);
        }
      })
    },`;

// Update using regex
content = content.replace(/    \/\/ 渲染所有事件标记[\s\S]*?      \}\)\n    \},/m, newRenderAllEvents);

fs.writeFileSync(file, content);
console.log('Successfully applied DivGraphic fallback in index.vue');
