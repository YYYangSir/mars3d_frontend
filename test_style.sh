echo '<style>
/* 覆盖 Mars3D / Cesium 默认工具栏位置，紧贴left-box右侧 */
.cesium-viewer-toolbar,
.mars3d-compass,
.mars3d-locationbar,
.mars3d-distance-legend {
  margin-left: 25% !important;
  /* 增加10px边距保证不完全贴边 */
  transform: translateX(10px);
}
</style>' >> /home/sdc/yangziyan/mars3d-vue-project-master/src/widgets/demo/mars-new/front-main/index.vue
