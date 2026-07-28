---
title: 'task': "Generate a hyper real studio photograph that matches..."
slug: gemnana-1729
date: 2026-01-26
added: 2026-07-27T12:53:59+08:00
model: Common
category: style
tags:
  - AI绘图
  - 提示词
difficulty: advanced
source: "X / Saman | AI"
sourceLink: "https://x.com/Samann_ai/status/2015781209490526596"
authorLink: "https://x.com/Samann_ai"
cover: /images/prompts/gemnana-1729.jpg
---

## Prompt

{
"task": "生成一张超真实的棚拍照片，构图与参考图匹配：画面中心为一位身着礼服的成年人，四周有许多只手从各个边缘进入画面，将物品递向该人物，背景为与主题色调相匹配的幕布。",
"variables": {
"USER_PHOTO": ">",
"SUBJECT_THEME": ">",
"HAND_PROPS": [
">",
">",
">",
">",
">",
">",
">",
">"
]
},
"prompt": "创建一张超写实棚拍照片（超真实，数码单反风格），构图与参考图完全一致：画面中央为一位成人正面站立，可见腰部至大腿中部，穿着深海军蓝色礼服夹克、干净的白衬衫和黑色领结，自信地微笑。此人戴圆形眼镜并有整洁的面部毛发（小胡须 + 短胡茬），但面部必须替换为来自 USER_PHOTO 的用户肖像，同时保留自然的皮肤质感、毛孔和真实的面部比例（禁止塑料感皮肤或卡通化）。光线为干净的专业棚灯，带柔和阴影，高动态范围，细节清晰。\n\n在人物周围由画面边缘（顶部、左侧、右侧、底部）伸入 8–10 只不同的手和前臂，每只手握住一个物品并朝中心人物指向（靠近面部/上半身）。这些手属于不同的人（袖子/图案/颜色各异），但保持真实且解剖学上正确。\n\n重要：在多次生成中，唯一允许变化的元素为：(1) 来自 USER_PHOTO 的用户面部，和 (2) 手中持的物品。其他所有元素保持一致：礼服、姿势、摄影角度、镜头效果和整体构图。\n\n道具规则：选择 HAND_PROPS 时必须与 SUBJECT_THEME 紧密相关。物品必须清晰可见、真实且多样（如合适可混合现代与复古）。主题示例：\n- music（音乐）：录音室耳机、麦克风、黑胶唱片、卡带、拨片、小型合成器、节拍器\n- gaming（游戏）：手柄、掌上游戏机、游戏耳机、鼠标、键盘、VR 配件\n- cooking（烹饪）：厨用温度计、打蛋器、研磨罐、小煎锅、裱花袋、食谱卡\n- finance（金融）：计算器、刷卡机、股票打印单、显示财经应用的智能手机、收银纸卷\n- fitness（健身）：智能手表、阻力带、摇摇杯、跳绳把手\n\n背景：使用幕布背景（类似舞台/摄影棚幕布），颜色方案与 SUBJECT_THEME 相匹配（例如：音乐使用深青/紫色，游戏使用霓虹点缀，烹饪使用暖米色/赤陶色，金融使用冷灰/蓝，健身使用清新绿）。保持幕布纹理和褶皱真实。\n\n相机/渲染：50mm 镜头效果，浅至中等景深，对人物面部聚焦清晰，边缘处的手略微柔焦，高分辨率，编辑级人像摄影，物体具有自然反射和准确的高光表现，无畸变。\n\n保持“被手环绕并递送物品”的整体氛围，但将物品替换为与主题相关的道具。不出现任何文字、标识或品牌标志。",
"reference_instructions": {
"use_user_photo_as_identity_reference": true,
"identity_strength": "高",
"preserve_pose_and_outfit": true,
"preserve_composition": "严格",
"only_allow_changes": [
"中心人物的面部身份来自 USER_PHOTO",
"手中持的道具",
"幕布颜色调与 SUBJECT_THEME 匹配"
]
}
}

## 美学评分

- 平均分: 8.4
- 推荐: 是
