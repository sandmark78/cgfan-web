---
title: "微距摄影函数式生成器"
slug: "prompt-2087879844562616818"
author: "Gadgetify"
authorLink: "https://x.com/Gdgtify"
source: "https://x.com/i/status/2087879844562616818"
date: "2026-08-13"
added: "2026-08-14T10:39:00.000+08:00"
model: "通用 Prompt"
tags:
  - "微距"
  - "摄影"
  - "函数式"
  - "2x2网格"
cover: "/images/prompts/prompt-2087879844562616818.jpg"
images:
  - "/images/prompts/prompt-2087879844562616818.jpg"
score: "67/80"
composition: "8/10"
color: "8/10"
lighting: "8/10"
detail: "9/10"
creativity: "9/10"
technical: "8/10"
aesthetic: "8/10"
curation: "8/10"
---

# 微距摄影函数式生成器

**作者**: Gadgetify  
**日期**: 2026-08-13  
**评分**: 67/80 (8+8+8+9+9+8+8+8=67)

## Prompt

```
2x2 grid, 16:9, ai picks different subjects: INPUT = [ SUBJECT / MAGNIFICATION m / APERTURE N / METHOD / T ]
UNKNOWNS  m · N · k (stack count) · working distance w

LAWS
  bellows    N_eff = N·(1+m).
  resolution limit ≈ 1.22·λ·N_eff ; depth ≈ λ·N_eff² / (2·n)
  motion budget at subject: ≤ 0.5 px → shutter ≤ 0.5 px / (m·v_scene)
  flash headroom: keep highlight ≤ 95% to preserve micro-texture

STEPS
  S1  choose_subject(SUBJECT) → size s, relief r, reflectance ρ, critical plane
  S2  set_geometry(m, T) → focal plane, working distance w, field width
  S3  set_optics(N, λ=550nm) → N_eff, DoT_total, diffraction check
  S4  plan_stack → k = ceil(DoT_total / DoF_step), overlap 30%
  S5  lighting(ρ, r) → polarized diffuse key + rim; kill specular if ρ high
  S6  motion_lock → tripod, mirror-up/EShutter, remote, no wind
  S7  capture_stack(k) → focus rail Δz = DoF_step
  S8  merge → DTT/Pyramid → halo-free, chromatic alignment
  S9  calibrate → white balance, lens distortion, vignette
  S10 output → 16-bit TIFF + sRGB preview, scale bar if scientific

RENDER
  • 2x2 grid: (1) full-frame beauty, (2) 100% crop texture, (3) depth map, (4) focus stack preview
  • color: neutral, no creative LUT
  • background: matte neutral to isolate subject
```
