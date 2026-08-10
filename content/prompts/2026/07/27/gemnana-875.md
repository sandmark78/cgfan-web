---
title: "伊斯坦布尔情侣四格故事"
slug: gemnana-875
date: 2026-01-08
added: 2026-07-27T11:31:40+08:00
model: 通用 Prompt
category: editorial
tags:
  - AI绘图
  - 提示词
difficulty: advanced
source: "https://gemnana.com/zh/case/875.html"
sourceLink: "https://x.com/astronomerozge1/status/2009396707772256528"
author: "X / Özge Döner"
authorLink: "https://x.com/astronomerozge1"
cover: /images/prompts/gemnana-875.jpg
---

## Prompt

{
"generation_request": {
"meta_data": {
"tool": "NanoBanana Pro",
"task_type": "写实抓拍情侣故事多镜头",
"version": "v1.0_ISTANBUL_BELGRAD_SUMMER_35MM_4FRAME_EN",
"priority": "最高"
},
"references": {
"reference_image_1": {
"source": "上传女性参考图像（推荐）",
"purpose": "锁定女性身份",
"strict_lock": true,
"preserve_identity": true,
"no_identity_blending": true,
"no_beautify_no_face_morph": true,
"preserve_facial_proportions": true
},
"reference_image_2": {
"source": "上传男性参考图像（推荐）",
"purpose": "锁定男性身份",
"strict_lock": true,
"preserve_identity": true,
"no_identity_blending": true,
"no_beautify_no_face_morph": true,
"preserve_facial_proportions": true
},
"reference_image_3": {
"source": "上传风格参考（可选）",
"purpose": "情绪/故事节奏参考",
"strict_lock": false,
"preserve_color_mood": true,
"preserve_story_beats": true
}
},
"output_settings": {
"aspect_ratio": "9:16",
"orientation": "纵向",
"resolution_target": "超高分辨率",
"render_style": "超写实抓拍电影静帧",
"sharpness": "清晰但自然",
"film_grain": "细微35mm颗粒",
"color_grade": "温暖夏日怀旧",
"dynamic_range": "自然（非HDR）",
"skin_rendering": "自然质感，不修饰"
},
"global_direction": {
"core_style": "等效35mm镜头，视平线角度，抓拍式纪录片感觉，手持真实感，不完美的构图，真实生活瞬间",
"lighting": "仅自然光，透过树木的柔和日光到温暖的傍晚光，阴影深但有细节，无影棚灯光",
"film_aesthetic": "高光上有细微的泛光，轻微的胶片门纹理，柔和对比，轻微边缘柔化，不追求数码完美",
"location": "土耳其伊斯坦布尔，贝尔格拉德森林（Neşetsuyu 区），浅溪流与长满苔藓的岩石，高草地空地，野花，浓密的绿色树木",
"environment_details": "湿石、流动的溪水、树叶间的斑驳阳光、空中飞舞的昆虫、真实的森林质感，不是修剪整齐的公园风",
"wardrobe": "简单夏日休闲：她穿白色无袖上衣和牛仔短裙/短裤，他穿短袖衬衫和浅色牛仔短裤，无品牌标识",
"relationship_tone": "顽皮、亲密、纯真、非摆拍；微笑和真实的动作，不做作的浪漫"
},
"multi_shot_plan": [
{
"shot_id": "S01_CREEK_ROCK_PAUSE",
"shot_brief": "溪边的安静节拍：苔藓岩石、流淌的水，两人同框且留有空间。",
"shot_overrides": {
"composition": "广角双人镜头，溪流和岩石主导，情侣略微偏离中心，不完美构图",
"action": "他靠在一块大苔藓岩上，她坐在靠近水边的岩石上，两人分享平静的对视",
"camera": "35mm，视平线，手持",
"authenticity": "仅水流有轻微运动模糊，皮肤自然质感，不摆拍"
}
},
{
"shot_id": "S02_GRASS_EMBRACE_FRAGMENT",
"shot_brief": "空地附近高草中的亲密片段，具有偶然感的取景。",
"shot_overrides": {
"composition": "紧致的腰胸部构图，可见部分面部，温暖的光从叶间洒下",
"action": "他的手臂环绕她的腰，她的手放在他背上，轻轻摇晃",
"camera": "35mm，近距离，浅到中等景深",
"authenticity": "仅边缘有轻微运动模糊，真实的布料质感"
}
},
{
"shot_id": "S03_CLEARING_RUN_PLAY",
"shot_brief": "他们在林中空地奔跑旋转，高草随之摆动，充满欢乐的抓拍动作。",
"shot_overrides": {
"composition": "宽阔的动态画面，全身入镜，前景高草模糊，背景为树木",
"action": "她拉着他的手，两人自然大笑，头发飞扬",
"camera": "35mm，视平线，手持，真实快门感",
"authenticity": "背景有运动模糊，但面部仍可辨认，不要过度锐化"
}
},
{
"shot_id": "S04_WILDFLOWER_REST_ENDING",
"shot_brief": "结尾节拍：坐在林边的野花中，亲密平静的双人镜头。",
"shot_overrides": {
"composition": "中近景双人镜头，前景以野花构图，柔和的背景虚化",
"action": "她依靠在他身上，他微笑；肩部放松，真诚的目光交流",
"camera": "35mm，视平线，对焦于眼睛，浅景深",
"authenticity": "前景花朵柔和虚化，细微的泛光，真实的胶片颗粒感"
}
}
],
"negative_prompt": [
"影棚灯光",
"塑料感皮肤",
"美颜修图",
"HDR",
"AI光晕",
"过度锐化",
"完美对称",
"过于干净的背景",
"虚假的散景形状",
"面部漂移",
"不同镜头中是不同人",
"手部畸形",
"多余的手指",
"文字",
"标志",
"水印",
"卡通",
"绘画风格"
]
}
}

## 美学评分

- 平均分: 8.2
- 推荐: 是
