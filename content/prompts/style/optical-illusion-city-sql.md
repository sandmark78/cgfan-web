---
title: "错觉艺术城市海报"
slug: optical-illusion-city-sql
model: Common
category: style
tags:
  - AI绘图
  - 提示词
  - 错觉艺术
  - 城市
  - 海报
difficulty: advanced
cover: /images/prompts/prompt-2081674958527225877.jpg
date: 2026-07-27
added: 2026-07-27T21:00:00+08:00
source: https://x.com/i/status/2081674958527225877
sourceLink: https://x.com/i/status/2081674958527225877
authorLink: https://x.com/Gdgtify
author: "Gadgetify"
---

## Prompt

2x2 grid, 16:9, do this for european cities: -- input: $ subject create temp view subject_analysis as select extract_silhouette(:subject) as silhouette, infer_internal_rhythm(:subject) as rhythm, infer_motion_or_force(:subject) as flow, infer_landmark_forms(:subject) as structures, infer_focal_accent(:subject) as accent_zone; create temp view optical_field as select generate_optical_illusion_art_surface( flow, patterns = array[ 'radial black-white stripes', 'concentric target rings', 'checkerboard distortion', 'wavy contour ribbons', 'perspective tunnel lines', 'warped grid fields' ], intensity = 'high but readable' ) as field from subject_analysis; create temp view subject_world as select convert_to_graphic_architecture( silhouette, structures, style = 'monochrome city/object/landscape built from stripes and hard vector shapes', rule = 'subject must remain recognizable as the dominant form' ) as subject_construct from subject_analysis; create temp view red_layer as select apply_single_accent( accent_zone, color = 'pure red', forms = array['sun disk','signal light','window blocks','signage','small vehicles','symbolic mark'], restraint = '5 to 10 percent of image only' ) as red_accent from subject_analysis; render optical_field.field as background_and_ground, subject_world.subject_construct center, red_layer.red_accent on_top with palette = 'pure black, pure white, tiny gray, controlled red accent', camera = 'wide graphic perspective, poster-flat but spatially dizzying', style = 'hypnotic op-art city poster'; -- output rules: -- 1. subject becomes an optical-illusion environment or icon. -- 2. every surface is rebuilt from stripes, rings, waves, grids, or checker fields. -- 3. use one red accent as the visual hook. -- 4. make depth feel warped, impossible, and hypnotic. -- 5. keep the subject readable despite visual distortion. -- 6. avoid soft painterly shading.

## Negative Prompt

(none provided)

## Parameters

| Setting | Value |
|---------|-------|
| Model | Common |
| Aspect Ratio | 9:16 |
