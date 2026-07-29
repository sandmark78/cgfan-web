---
title: "等距多色渐变挤出"
slug: gemnana-84
date: 2025-11-06
added: 2026-07-27T11:31:11+08:00
model: Common
category: editorial
tags:
  - AI绘图
  - 提示词
difficulty: advanced
source: "https://gemnana.com/zh/case/84.html"
sourceLink: "https://x.com/hckmstrrahul/status/1925567579856453701"
author: "@hckmstrrahul"
authorLink: "https://x.com/hckmstrrahul"
cover: /images/prompts/gemnana-84.jpg
---

## Prompt

请以以下JSON风格美学重新纹理化此图像：
{
"styleAesthetic": {
"title": "Isometric Multicolor Extrusion with Grid Control",
"overallVibe": "Playful modern 3D iconography with directional extrusion and dynamic isometric grids",
"viewAngle": {
"type": "Isometric",
"facingDirection": "right",  // options: left, right, front
"rotationDegrees": {
"x": 30,
"y": 30
}
},
"renderingStyle": "Clean 3D extruded vector with soft lighting and high contrast between faces",
"objectSurface": {
"frontFace": {
"color": "#ffffff",
"material": "Matte white plastic",
"lighting": "Soft diffuse"
},
"extrudedSide": {
"type": "Multicolor gradient",
"gradientStyle": "Diagonal sweep",
"colorStops": [
"#ff0040", "#ff8000", "#ffff00", "#00ff90", "#00cfff", "#8000ff"
],
"material": "Glossy plastic",
"lighting": "Ambient with light falloff"
}
},
"extrusion": {
"direction": "right",  // determines which side is extruded: left, right, front
"depth": "moderate"
},
"shadows": {
"type": "Drop shadow",
"direction": "bottom-right",
"opacity": 0.15,
"blurRadius": "6px"
},
"background": {
"type": "Isometric grid",
"color": "#ffffff",
"gridStyle": {
"lineColor": "#e0e0e0",
"lineWeight": "1px",
"orientation": "opposite-extrusion"  // automatically flips grid lines to oppose the extrusion direction
}
},
"moodKeywords": [
"Dimensional",
"Clean",
"Geometric",
"Colorful",
"Tactile",
"Structured"
]
}
}

## 美学评分

- 平均分: 8.0
- 推荐: 是
