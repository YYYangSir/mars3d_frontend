with open('/home/sdc/yangziyan/mars3d-vue-project-master/src/widgets/demo/mars-new/front-main/index.vue', 'r') as f:
    text = f.read()

text = text.replace('getDisplayImages() {', 'getDisplayImages(): any[] {')
text = text.replace('getFlattenedImages() {', 'getFlattenedImages(): any[] {')

with open('/home/sdc/yangziyan/mars3d-vue-project-master/src/widgets/demo/mars-new/front-main/index.vue', 'w') as f:
    f.write(text)

print("done")
