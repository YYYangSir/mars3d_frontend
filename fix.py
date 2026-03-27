import re

with open('/home/sdc/yangziyan/mars3d-vue-project-master/src/widgets/demo/mars-new/front-main/index.vue', 'r') as f:
    text = f.read()

# Fix this.renderAllEventsToMap()
text = text.replace('this.renderAl{ lEventsToMap() }', 'this.renderAllEventsToMap()')

# Fix getTargetSource
original_target_source = """    getTargetSource(target) {{  }
      if (!target) return "UNKNOWN"{  }
      // If target has a source field, return it:
      if (target.source) {
        if (target.source.toUpperCase().includes("SAR")) return "SAR"
        if (target.source.toUpperCase().inclu {des("VIS")) r }eturn "VIS"
      } { }"""

fixed_target_source = """    getTargetSource(target) {
      if (!target) return "UNKNOWN"
      // If target has a source field, return it:
      if (target.source) {
        if (target.source.toUpperCase().includes("SAR")) return "SAR"
        if (target.source.toUpperCase().includes("VIS")) return "VIS"
      }"""

text = text.replace(original_target_source, fixed_target_source)

with open('/home/sdc/yangziyan/mars3d-vue-project-master/src/widgets/demo/mars-new/front-main/index.vue', 'w') as f:
    f.write(text)
print("done")
