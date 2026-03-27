import os
import json
import shutil
import re

def organize_events():
    """
    将RZtest下的json和image文件重组为事件文件夹
    """
    base_path = "/home/sdc/yangziyan/mars3d-vue-project-master/RZtest"
    json_path = os.path.join(base_path, "json")
    image_path = os.path.join(base_path, "Image")
    
    # 确保目录存在
    if not os.path.exists(json_path) or not os.path.exists(image_path):
        print("JSON或Image目录不存在")
        return
    
    # 获取所有JSON文件
    json_files = [f for f in os.listdir(json_path) if f.endswith('.json')]
    
    # 处理每个JSON文件
    for json_file in json_files:
        # 提取事件编号
        event_num = re.search(r'event(\d+)\.json', json_file)
        if not event_num:
            continue
        
        event_num = event_num.group(1)
        event_dir = os.path.join(base_path, f"event_{event_num}")
        
        # 创建事件目录
        if not os.path.exists(event_dir):
            os.makedirs(event_dir)
        
        # 复制JSON文件
        src_json = os.path.join(json_path, json_file)
        dst_json = os.path.join(event_dir, json_file)
        shutil.copy2(src_json, dst_json)
        
        # 查找对应的图片文件
        image_file = f"FARAD_{event_num}.jpg"
        src_image = os.path.join(image_path, image_file)
        if os.path.exists(src_image):
            dst_image = os.path.join(event_dir, image_file)
            shutil.copy2(src_image, dst_image)
            
            # 更新JSON文件中的图像路径
            update_json_image_path(dst_json, f"./event_{event_num}/{image_file}")
        else:
            print(f"未找到对应的图像文件: {image_file}")

def update_json_image_path(json_file, new_path):
    """更新JSON文件中的图像路径"""
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 更新每个Detection类型事件的图像路径
        for item in data:
            if item.get("type") == "Detection" and "img_source" in item:
                item["img_source"] = new_path
        
        # 写回更新后的JSON
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
    except Exception as e:
        print(f"更新JSON文件失败: {str(e)}")

if __name__ == "__main__":
    organize_events()
    print("事件文件重组完成")
