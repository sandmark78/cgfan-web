---
title: "高分辨率数字合成海报"
slug: gemnana-1436
date: 2026-01-16
added: 2026-07-27T11:31:50+08:00
model: Common
category: style
tags:
  - AI绘图
  - 提示词
difficulty: advanced
source: "https://gemnana.com/zh/case/1436.html"
sourceLink: "https://x.com/rovvmut_/status/2012132360779923648"
author: "X / Heisenberg"
authorLink: "https://x.com/rovvmut_"
cover: /images/prompts/gemnana-1436.jpg
---

## Prompt

{
"meta": {
"image_quality": "高",
"image_type": "数字合成 / 平面设计",
"resolution_estimation": "高分辨率竖版海报格式",
"file_characteristics": {
"compression_artifacts": "低",
"noise_level": "低（照片质感中可见胶片颗粒）",
"lens_type_estimation": "长焦（通过面部压缩迹象推断）"
}
},
"global_context": {
"scene_description": "一幅高对比度的黑白分割构图埃隆·马斯克肖像。图像的左半部分显示了右侧脸部（观看者的左侧）的一张现实主义、高细节的照片。图像的右半部分为白色背景，其中他的左侧脸（观看者的右侧）仅通过大号、粗体、垂直堆叠的衬线字体形状显现，字体文字为 'IF YOU DREAM IT YOU CAN DO IT.'。",
"environment_type": "摄影棚/平面艺术",
"time_of_day": "无法判断",
"weather_atmosphere": "富有远见、激励人心、强烈",
"lighting": {
"source": "人工棚内灯光",
"direction": "侧光（从左侧照亮面部）",
"quality": "强硬、戏剧性的明暗对比（明暗法）",
"color_temperature": "单色（黑白）"
},
"color_palette": {
"dominant_hex_estimates": [
"#FFFFFF",
"#000000",
"#333333",
"#888888"
],
"accent_colors": [],
"contrast_level": "高"
}
},
"composition": {
"camera_angle": "平视",
"framing": "特写肖像",
"depth_of_field": "景深深（所有元素均在焦点内）",
"focal_point": "主体的眼睛和排版信息",
"symmetry_type": "垂直分割的不对称",
"rule_of_thirds_alignment": "分割大致沿面部的垂直中心线（鼻梁）"
},
"objects": [
{
"id": "obj_subject_face",
"label": "埃隆·马斯克（面部）",
"category": "人物",
"location": {
"relative_position": "画布左半部分",
"bounding_box_percentage": {
"x": 0.0,
"y": 0.0,
"width": 0.5,
"height": 1.0
}
},
"dimensions_relative": "大（填满高度）",
"distance_from_camera": "特写",
"pose_orientation": "正面朝向，略有倾斜，凝重沉思的注视",
"material": "皮肤/生物组织",
"surface_properties": {
"texture": "光滑皮肤，轻微胡渣，具有特征性的面部结构",
"reflectivity": "低（鼻部/脸颊的自然皮脂光泽）",
"micro_details": "细微的鱼尾纹，顶部可见直或波浪状发丝纹理",
"wear_state": "不适用"
},
"color_details": {
"base_color_hex": "#808080",
"secondary_colors": [
"#000000",
"#FFFFFF"
],
"gradient_or_pattern": "灰阶连续色调"
},
"interaction_with_light": {
"shadow_casting": "面部右侧深重阴影（被文字遮罩隐藏）",
"highlight_zones": "有光照一侧的额头、鼻梁、眼下区域",
"translucency": "无"
},
"relationships": [
{
"type": "visually_connected_to",
"target_object_id": "obj_typography_mask"
}
]
},
{
"id": "obj_typography_mask",
"label": "文字遮罩",
"category": "文本/图形元素",
"location": {
"relative_position": "画布右半部分",
"bounding_box_percentage": {
"x": 0.5,
"y": 0.0,
"width": 0.5,
"height": 1.0
}
},
"dimensions_relative": "大",
"distance_from_camera": "平面",
"pose_orientation": "垂直堆叠",
"material": "数字遮罩",
"surface_properties": {
"texture": "字母的填充与埃隆·马斯克的头发和皮肤纹理相匹配（照片遮罩）",
"reflectivity": "无",
"micro_details": "边缘为清晰的衬线切割",
"wear_state": "不适用"
},
"color_details": {
"base_color_hex": "#000000",
"secondary_colors": [
"#FFFFFF"
],
"gradient_or_pattern": "字母内部为图像纹理，字母外为白色背景"
},
"interaction_with_light": {
"shadow_casting": "无",
"highlight_zones": "无",
"translucency": "无"
},
"text_content": {
"raw_text": "IF\nYOU\nDREAM\nIT\nYOU\nCAN\nDO\nIT.",
"font_style": "粗重板式衬线（例如 Rockwell Bold 或相似字体）",
"font_weight": "加粗 / 极粗",
"text_case": "大写",
"alignment": "两端对齐 / 垂直堆叠",
"color_hex": "纹理填充（黑/灰）"
},
"relationships": [
{
"type": "completes_image_of",
"target_object_id": "obj_subject_face"
}
]
},
{
"id": "obj_clothing",
"label": "夹克领/西装",
"category": "服装",
"location": {
"relative_position": "左下角",
"bounding_box_percentage": {
"x": 0.0,
"y": 0.85,
"width": 0.4,
"height": 0.15
}
},
"dimensions_relative": "可见部分较小",
"distance_from_camera": "近",
"pose_orientation": "披在肩上",
"material": "深色织物/皮革",
"surface_properties": {
"texture": "光滑，带有细微褶皱",
"reflectivity": "中等",
"micro_details": "褶皱和折痕",
"wear_state": "状况良好"
},
"color_details": {
"base_color_hex": "#1A1A1A",
"secondary_colors": [],
"gradient_or_pattern": "纯暗色"
},
"interaction_with_light": {
"shadow_casting": "褶皱处自投影",
"highlight_zones": "褶皱的脊线处",
"translucency": "无"
},
"relationships": [
{
"type": "worn_by",
"target_object_id": "obj_subject_face"
}
]
},
{
"id": "obj_ear",
"label": "左耳",
"category": "身体部位",
"location": {
"relative_position": "中心左侧边缘",
"bounding_box_percentage": {
"x": 0.05,
"y": 0.35,
"width": 0.15,
"height": 0.2
}
},
"dimensions_relative": "中等",
"distance_from_camera": "中距离",
"pose_orientation": "侧视",
"material": "皮肤",
"surface_properties": {
"texture": "光滑皮肤",
"reflectivity": "低",
"micro_details": "可见软骨结构",
"wear_state": "不适用"
},
"color_details": {
"base_color_hex": "#888888",
"secondary_colors": [],
"gradient_or_pattern": "不适用"
},
"interaction_with_light": {
"shadow_casting": "耳内阴影",
"highlight_zones": "外缘（耳轮）",
"translucency": "轻微的次表面散射可能性"
},
"relationships": [
{
"type": "attached_to",
"target_object_id": "obj_subject_face"
}
]
}
],
"background_details": {
"texture": "纯色",
"patterns": "无（纯白）",
"lighting_behavior": "背景为纯白（#FFFFFF），为主体和文字提供最大对比度。",
"additional_elements": [
"右侧的负空间作为文字遮罩效果的画布。"
]
},
"foreground_elements": {
"particles": "无",
"artifacts": "无"
},
"reconstruction_notes": {
"mandatory_elements_for_recreation": [
"埃隆·马斯克的相貌",
"面部分割构图",
"右侧的文字遮罩效果",
"特定引用：'IF YOU DREAM IT YOU CAN DO IT.'",
"黑白高对比美学",
"衬线粗体字体"
],
"sensitivity_factors": "文字的对齐必须与底层面部解剖完美匹配，以保持面部通过字母延续的错觉。发际线和下颌结构应与马斯克相符。",
"ambiguities": "服装类型为通用深色材质。"
}
}

## 美学评分

- 平均分: 8.2
- 推荐: 是
