---
title: ""meta": {"
slug: gemnana-2114
date: 2026-02-14
added: 2026-07-27T12:54:10+08:00
model: Common
category: style
tags:
  - AI绘图
  - 提示词
difficulty: advanced
source: "X / Heisenberg"
sourceLink: "https://x.com/rovvmut_/status/2022587678328525084"
cover: /images/prompts/gemnana-2114.jpg
---

## Prompt

{
"meta": {
"image_quality": "高",
"image_type": "影楼摄影",
"resolution_estimation": "1024x1280",
"file_characteristics": {
"compression_artifacts": "低",
"noise_level": "无",
"lens_type_estimation": "标准定焦镜头（约50mm）"
}
},
"global_context": {
"scene_description": "一组时尚写真拍摄，主角是一位身穿红色开衫和深色牛仔裤的女性，站在超现实的爱丽丝梦游仙境主题影棚中。地板铺了一层厚厚的红玫瑰花瓣。她身后摆着一张复古皮质扶手椅，一张巨大的“红心皇后”扑克牌倚靠在红色天鹅绒窗帘上。右侧有一个银色烛台，插着白色蜡烛。",
"environment_type": "影棚",
"time_of_day": "无（室内人工灯）",
"weather_atmosphere": "戏剧化，浪漫，超现实",
"lighting": {
"source": "影棚柔光箱",
"direction": "正前方左侧（45度角）",
"quality": "柔光",
"color_temperature": "暖中性（约3200K-4000K）"
},
"color_palette": {
"dominant_hex_estimates": [
"#8B0000",
"#E31B23",
"#1A1B2E",
"#FFFFFF"
],
"accent_colors": [
"#C5A059",
"#000000"
],
"contrast_level": "高"
}
},
"composition": {
"camera_angle": "平视",
"framing": "全身照",
"depth_of_field": "中等（背景略微柔化但清晰可读）",
"focal_point": "身穿红色开衫的女性",
"symmetry_type": "无",
"rule_of_thirds_alignment": "主体水平居中，眼睛位置与上三分线对齐"
},
"objects": [
{
"id": "obj_001",
"label": "女性模特",
"category": "人物",
"location": {
"relative_position": "中心",
"bounding_box_percentage": {
"x": 25.0,
"y": 14.0,
"width": 30.0,
"height": 70.0
}
},
"dimensions_relative": "大",
"distance_from_camera": "近",
"pose_orientation": "直立稍偏左，直视镜头",
"material": "皮肤、头发、布料",
"surface_properties": {
"texture": "皮肤光滑，针织柔软，牛仔布",
"reflectivity": "低",
"micro_details": "深色波波头，金色圆圈耳环，有色眼镜",
"wear_state": "完好"
},
"color_details": {
"base_color_hex": "#E31B23",
"secondary_colors": [
"#1A1B2E"
],
"gradient_or_pattern": "纯色"
},
"interaction_with_light": {
"shadow_casting": "右侧及地面花瓣有柔影",
"highlight_zones": "脸部左侧及开衫肩部",
"translucency": "无"
},
"relationships": [
{
"type": "穿着",
"target_object_id": "obj_002"
},
{
"type": "手持",
"target_object_id": "obj_004"
}
]
},
{
"id": "obj_002",
"label": "红色开衫",
"category": "服饰",
"location": {
"relative_position": "上方中心",
"bounding_box_percentage": {
"x": 26.0,
"y": 24.0,
"width": 25.0,
"height": 26.0
}
},
"dimensions_relative": "中等",
"distance_from_camera": "近",
"pose_orientation": "上部纽扣扣起，下摆敞开",
"material": "针织羊毛/羊绒",
"surface_properties": {
"texture": "袖口和下摆为罗纹，主体为细针织",
"reflectivity": "无",
"micro_details": "四颗可见的金色圆形纽扣",
"wear_state": "全新"
},
"color_details": {
"base_color_hex": "#E31B23",
"secondary_colors": [
"#C5A059"
],
"gradient_or_pattern": "纯色"
},
"interaction_with_light": {
"shadow_casting": "褶皱产生内部柔影",
"highlight_zones": "上肩及袖口边缘"
}
},
{
"id": "obj_003",
"label": "阔腿牛仔裤",
"category": "服饰",
"location": {
"relative_position": "下方中心",
"bounding_box_percentage": {
"x": 29.0,
"y": 41.0,
"width": 26.0,
"height": 42.0
}
},
"dimensions_relative": "中大",
"distance_from_camera": "近",
"pose_orientation": "直线下垂",
"material": "牛仔布",
"surface_properties": {
"texture": "粗织，中央有褶和缝线清晰可见",
"reflectivity": "无",
"micro_details": "对比色缝线，黑色腰带配金色扣",
"wear_state": "全新"
},
"color_details": {
"base_color_hex": "#1A1B2E",
"secondary_colors": [
"#C5A059"
],
"gradient_or_pattern": "深靛蓝水洗"
}
},
{
"id": "obj_004",
"label": "手提包",
"category": "配饰",
"location": {
"relative_position": "中心右侧（模特手部）",
"bounding_box_percentage": {
"x": 37.0,
"y": 62.0,
"width": 15.0,
"height": 10.0
}
},
"dimensions_relative": "小",
"distance_from_camera": "近",
"pose_orientation": "链带手持",
"material": "皮革、金属",
"surface_properties": {
"texture": "压花/绗缝，近似涡纹图案",
"reflectivity": "中（链带和皮革有光泽）",
"micro_details": "银色链条肩带",
"wear_state": "全新"
},
"color_details": {
"base_color_hex": "#000000",
"secondary_colors": [
"#C0C0C0"
]
}
},
{
"id": "obj_005",
"label": "红心皇后扑克牌",
"category": "道具",
"location": {
"relative_position": "中右",
"bounding_box_percentage": {
"x": 58.0,
"y": 35.0,
"width": 30.0,
"height": 40.0
}
},
"dimensions_relative": "大",
"distance_from_camera": "中",
"pose_orientation": "背景45度角斜靠",
"material": "硬纸板/泡沫板",
"surface_properties": {
"texture": "哑光",
"reflectivity": "低",
"micro_details": "四角带有艺术化字母Q和红心符号",
"wear_state": "完好"
},
"color_details": {
"base_color_hex": "#FFFFFF",
"secondary_colors": [
"#E31B23"
]
},
"text_content": {
"raw_text": "Q",
"font_style": "衬线体",
"font_weight": "加粗",
"text_case": "大写",
"alignment": "角落对齐",
"color_hex": "#E31B23"
}
},
{
"id": "obj_006",
"label": "烛台",
"category": "家具/道具",
"location": {
"relative_position": "最右侧",
"bounding_box_percentage": {
"x": 81.0,
"y": 29.0,
"width": 18.0,
"height": 45.0
}
},
"dimensions_relative": "中等",
"distance_from_camera": "中距",
"pose_orientation": "垂直站立",
"material": "银色金属，蜡",
"surface_properties": {
"texture": "打磨金属光泽",
"reflectivity": "高",
"micro_details": "精致弯臂，三根白色锥形蜡烛（未点燃）",
"wear_state": "全新"
},
"color_details": {
"base_color_hex": "#C0C0C0",
"secondary_colors": [
"#FFFFFF"
]
}
},
{
"id": "obj_007",
"label": "玫瑰花瓣",
"category": "装饰",
"location": {
"relative_position": "底部/地面",
"bounding_box_percentage": {
"x": 0.0,
"y": 72.0,
"width": 100.0,
"height": 28.0
}
},
"dimensions_relative": "大（整体）",
"distance_from_camera": "近至中",
"pose_orientation": "随机散落",
"material": "有机/丝绸",
"surface_properties": {
"texture": "天鹅绒质感，柔软",
"reflectivity": "低",
"micro_details": "红色层次丰富，边缘微卷",
"wear_state": "新鲜"
},
"color_details": {
"base_color_hex": "#8B0000",
"secondary_colors": [
"#E31B23"
]
}
}
],
"background_details": {
"texture": "天鹅绒帷幕",
"patterns": "竖向粗褶/皱折",
"lighting_behavior": "深褶吸光，高起边缘柔光反射",
"additional_elements": [
"复古棕色皮质拉扣扶手椅（部分被遮挡）",
"扑克牌底部大量红玫瑰簇"
]
},
"foreground_elements": {
"particles": "无",
"artifacts": "地面花瓣与灯光交汇处略有轻微朦胧"
},
"reconstruction_notes": {
"mandatory_elements_for_recreation": "红色针织金扣开衫，深色阔腿牛仔裤，地面红玫瑰花瓣，超大红心皇后牌，红色天鹅绒窗帘背景。",
"sensitivity_factors": "红色饱和度需一致（开衫、窗帘、花瓣颜色相同），花瓣厚度需脚感明显，灯光需有影棚戏剧质感。",
"ambiguities": "手包压花细节复杂；模特鞋几乎全被阔腿裤和花瓣遮盖。"
}
}

## 美学评分

- 平均分: 8.2
- 推荐: 是
