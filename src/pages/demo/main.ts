import "mars3d-cesium/Build/Cesium/Widgets/widgets.css"
import "mars3d-cesium"
import "mars3d/mars3d.css"
import "mars3d"
import qs from "qs"

import VueCookies from "vue-cookies"
import Cookies from "universal-cookie"
import Vue, { createApp } from "vue"
// import "view-design/dist/styles/iview.css"
import Application from "./App.vue"
import { injectState, key } from "@mars/common/store/widget"
import { store as testStore, key as testKey } from "@mars/common/store/test"
import store from "./widget-store"
import MarsUI from "@mars/components/mars-ui"
import { router } from "./routes"
import "@mars/components/mars-ui/common"
// import "./global.css" // 引入全局样式
import axios from "axios"
// import button from "@mars/components/mars-ui/mars-button/index.vue" // 假设 Button 组件的路径

const cookies = new Cookies()
// 获取 Cookies
const csrfToken = cookies.get("csrftoken")
// 设置 Cookie
cookies.set("csrftoken", "abc123", { path: "/", maxAge: 3600 })
// 删除 Cookie
cookies.remove("csrftoken", { path: "/" })

const app = createApp(Application) // 创建应用实例

app.use(VueCookies)
app.use(MarsUI)
app.use(router)
app.use(injectState(store), key)
app.use(testStore, testKey)
// app.component("mars-button", button) // 全局注册 Button 组件
app.mount("#app") // 挂载应用

// 在这里配置一个基础的后端(django)请求地址,这样在js请求是就可以省略前面这一段，注意修改端口
axios.defaults.baseURL = "http://10.106.128.116:8010/mltds"
// "http://192.168.100.2:8010/mltds";
// axios.defaults.headers.post["Content-type"] = "application/x-www-form-urlencoded";
// axios.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.xsrfCookieName = "csrftoken"
axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
axios.defaults.withCredentials = true
// axios.defaults.headers.post["Content-type"] = "application/x-www-form-urlencoded";
// axios.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded';

// 全局别名，在js中就可以用$xx来调用库（vue3）
app.config.globalProperties.$axios = axios
app.config.globalProperties.$qs = qs
// Vue.prototype.$backStaticURL = "http://10.106.128.165:8010/static"
// Vue.prototype.$geoserverURL = "http://10.106.128.165:8012/geoserver/"
// Vue.prototype.$geoserverURL = "http://10.106.128.165:xxxx/geoserver/";

// 请求前拦截，给请求的header里加上token
axios.interceptors.request.use(
  (config) => {
    const csrfToken = cookies.get("csrftoken")
    if (csrfToken) {
      console.log("CSRF Token:", csrfToken)
      config.headers["X-CSRFTOKEN"] = csrfToken
    }
    return config
  },
  (err) => {
    return Promise.reject(err)
  }
)


// 响应拦截，统一判定一些状态比如：权限不足
axios.interceptors.response.use(
  response => {
    // console.log('成功响应：', response)
    const status = response.data.status
    const mes = response.data.message
    console.log("status:", status)
    console.log("message:", mes)
    switch (status) {
      case "Forbidden":
        app.config.globalProperties.$Message.info(mes)
        throw new Error("this is an authority error")
      case "Error":
        app.config.globalProperties.$Message.info(mes)
        throw new Error("this is an regular error")
      case "Expired":
        throw new Error("this is an expired error")
      case "OK":
        return response
      default:
        return response
    }
  },
  error => {
    if (error.response) {
      const status = error.response.status
      switch (status) {
        // 403 crsf验证未通过
        case 403:
          app.config.globalProperties.$Message.info("请重新登录")
          router.push("/login")
          break // 添加break语句确保不会继续执行
        // 可以添加其他错误状态码处理
        case 404:
          app.config.globalProperties.$Message.error("请求的资源不存在")
          break
        case 500:
          app.config.globalProperties.$Message.error("服务器内部错误")
          break
        default:
          app.config.globalProperties.$Message.warning("请求失败，请稍后再试")
      }
    }
    return Promise.reject(error.response) // 返回接口返回的错误信息
  }
)
