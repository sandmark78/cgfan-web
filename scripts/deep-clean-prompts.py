#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""深度清理 prompt - 去除作者名、日期、互动数据、评论线程"""
import os, re, sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

env_file = project_root / '.env.local'
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

from supabase import create_client
supabase = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# 手动定义每条 prompt 应该保留的内容
CLEAN_DATA = {
    '2103082007970668842': 'Vigo Zhao\nSame prompt, four new sports.\n\nSalt Form — paddling out.\nAfter Point — between rallies.\nDeep Current — surfacing.\nSecond Wind — into the next stroke.',

    '2103120556346523985': '🌕 Images 2.5 做中秋海报，巨物构图真的很有诗意，氛围感拉满！\n\n把月饼、月门、明月、桂花放大成画面的主视觉，加上山水和微型人物，氛围一下就出来了~\n\n1. 团圆月宴：巨型月饼里藏着一轮明月\n2. 玉兔望月：白玉巨兔静卧山水之间\n3. 月门清辉：推门见月，圆门框住一片秋色\n4. 桂影流金：桂花成云，金色花雨落入湖面\n\n🌟 适合做中秋海报、文旅视觉、品牌 Campaign、节日活动 KV！',

    '2103152232837587256': '🧃 AI Filter Vol.07 Mini Worlds!\n\nOne prompt turns everyday product photos into tiny illustrated worlds.\n\nA soda bottle becomes a water park. A coffee cup becomes a treehouse. Even the packaging itself becomes part of the architecture.\n\nGreat for product shots, packaging concepts, brand visuals, and creative AI experiments!',

    '2103394092239802494': 'Midjourney --sref 4054778981\nWoodblock Print & Paper Textures\n+ Japanese Hanko Stamp 🉐\n\nAngry Birds --ar 3:4 --sref 4054778981\n--sw 100 --stylize 300 --hd --v 8.2',

    '2103401015257284851': 'QT your Traditional Midjourney 8.2 prompt:\n\nCinematic fantasy portrait, 9:16 vertical. Beautiful young East Asian woman weaving enchanted silk on an ancient Chinese wooden loom. She sits left of center, leaning forward, delicate oval face, pale skin, jet black hair in partial traditional updo with gold filigree and purple gemstones, serene melancholic expression, eyes lowered. Luxurious translucent lavender layered Hanfu gown, sheer silk sleeves, floral embroidery, gold thread. Right hand manipulates thread, left rests on fabric, elegant fingers. Aged dark wood loom dominates right, antique brass fittings. Midnight purple silk cascades diagonally to foreground, glowing violet constellation embroidery. Dark Chinese atelier, lattice windows, antique lanterns, carved wood. Midnight indigo palette, amethyst magical light from loom, warm amber candlelight, soft moonlight rim lighting. Shallow depth of field, volumetric haze, film grain, Old Master chiaroscuro, photorealistic, no anime, no text, masterpiece. --ar 9:16 --stylize 150 --hd',

    'prompt-2099451908381692387': '嫦娥 × iPhone前置误触 × 曝光错误 × 虚焦拖影 × 中秋节 × 裁切\n\n但願人長久 千里共嬋娟～',

    'prompt-2101194432041382401': '主题方向：东方禅意极简封面海报\n风格分支：女性审美文静型\n主体内容：一位古风女子站在小台边，轻轻整理垂落的书签丝带\n情绪母题：安静、细腻、轻文艺感\n场景与意象：极简小台、青梅绿色书签丝带、柔桃橙小灯、女子、干净背景\n构图与空间：9:16 竖版构图，小台与人物位于下方偏中，上方与侧边保留完整干净留白，适合作标题封面\n色彩控制：暖白作为背景基底，青梅绿用于书签丝带和局部点缀，柔桃橙用于小灯与少量暖光，人物服装建议浅白或浅杏色；避免全图变成绿橙滤镜\n光线与质感：明亮柔光，边缘清晰，轻平面海报感，整体低灰度\n画幅比例：9:16\n补充要求：整体要文静精致，色彩清爽耐看，适合女性向封面，不要复杂家具，画面留白处配上合适的文字',

    'prompt-2101521758260285910': '主题方向：东方禅意极简中秋封面海报\n风格分支：中秋女性审美爆款型\n主体内容：一位古风女子站在桂花树下，抬头望向巨大圆月\n情绪母题：团圆、温柔、节日明净感\n场景与意象：巨大圆月、桂花枝、女子、少量飘落桂花、干净夜空\n构图与空间：9:16 竖版构图，巨大圆月位于上半部分作为第一视觉中心，人物位于下方偏一侧，顶部与一侧保留完整标题区\n色彩控制：月白作为高明度月轮和背景主基调，桂花金用于花朵和少量点睛，极浅靛蓝用于天空过渡，人物服装建议珍珠白或浅桂花黄；避免整图发灰或全图泛黄\n光线与质感：清亮月光，画面通透，边缘清晰，轻平面东方海报感\n画幅比例：9:16\n补充要求：圆月要大而干净，桂花要少而精，整体要有很强中秋识别度和封面感，画面留白处配上合适的文字',

    'prompt-2102677759038496809': '主题方向：东方禅意极简中秋封面海报\n风格分支：中秋梦感女性向\n主体内容：一位古风女子坐在白色高台边，身旁一只小玉兔安静陪伴\n情绪母题：梦感、团圆、治愈\n场景与意象：巨大金色月轮、白色高台、玉兔、女子、孔雀蓝夜空\n构图与空间：9:16 竖版构图，月轮位于上半部分偏中，人物与玉兔位于下方，顶部和右侧保留完整标题区\n色彩控制：珍珠白作为高明度基底，香槟金用于月轮和局部边缘光，孔雀蓝用于夜空大色块，玉兔保持干净暖白；避免整图发蓝或月色过黄\n光线与质感：柔亮月光，细腻平面海报感，画面清透，低灰度\n画幅比例：9:16\n补充要求：玉兔要简洁可爱但不幼态，整体要有中秋梦感和爆款封面气质，画面留白处配上合适的文字',

    'prompt-2102682075077980418': '主题方向：东方禅意极简中秋封面海报\n风格分支：中秋高传播型\n主体内容：一位古风女子手提一盏小灯，站在开阔平台上望月\n情绪母题：节日仪式感、思念、温柔夜色\n场景与意象：巨大圆月、小灯、开阔平台、女子、少量松影\n构图与空间：9:16 竖版构图，圆月位于上方中央，人物位于下方偏一侧，夜空与平台之间形成大面积干净留白，适合标题排版\n色彩控制：月牙白用于圆月和主要空间亮部，胭脂红只用于灯笼和少量点睛，松针绿用于极少植物，背景夜空用清透深蓝而非灰黑；避免整图过暗\n光线与质感：清透月光加柔暖灯光，画面明净，轮廓明确，现代东方节日海报感\n画幅比例：9:16\n补充要求：灯笼要小而亮，月亮要大而干净，整体要有节日传播感，不要压成沉闷夜景，画面留白处配上合适的文字',

    'prompt-2102738823931118067': '【主题】：{填写，例如：西湖雨 / 白露 / 春茶 / 元宵}\n【英文主标题】：{填写}\n【中文主标题】：{填写}\n【副标题】：{填写}\n【超尺度主视觉】：{填写，例如：巨型油纸伞 / 露珠 / 茶盏 / 灯笼}\n【东方景观】：{填写，例如：湖面 / 山谷 / 茶山 / 江南水岸}\n【微型人物与动作】：{填写}\n【主色调】：{填写}\n【强调色】：{填写}\n【季节 / 年份小字】：{可选}\n【画幅比例】：{默认 9:16}\n\n生成一张高级现代东方诗意 Editorial 海报，将东方景观意境、超尺度主视觉、微型人物叙事与现代中英文 Typography 融合成完整视觉作品。\n\n整体不要做成普通国风宣传图、旅游海报或节日模板，而要呈现文化品牌 Campaign、艺术节视觉、杂志 Editorial 海报般的设计完成度。\n\n画面使用大面积柔和色域构建空间，以【主色调】作为主要环境颜色，仅使用【强调色】集中强化【超尺度主视觉】，让主体在缩略图状态下一眼可辨识。背景景观使用水墨晕染、粉彩扩散、薄雾、柔边色块等方式表现，减少写实细节，不要让建筑、树木和山峰过度抢眼。\n\n将【超尺度主视觉】放大到远超现实比例，并通过裁切、遮挡、穿插或透视关系让它真正进入画面空间，而不是简单悬浮。主体最好只保留一个最强视觉锚点，避免同时出现多个大物体争夺视线。\n\n加入极小尺度的【微型人物与动作】，利用"巨大环境 / 巨物"和"微型人物"的尺度反差增强空间感、诗意和故事性。人物不要成为主角，不要摆拍，只作为尺度参照和叙事点。\n\n顶部或上半部分使用超大英文【英文主标题】，采用纤细、高对比、现代 Editorial Serif 字体，允许文字跨越画面、错位、裁切，并与巨物、雾气、植物、雨线、水滴、蒸汽等元素形成真实前后遮挡关系。可加入一处纤细自然的英文手写体作为柔性视觉线条，但不要堆叠过多字体。\n\n中文主标题【中文主标题】放在中下部或左下区域，尺寸明显放大，与景观产生局部遮挡、压边、倒影或穿插，使文字成为构图的一部分，而不是简单覆盖在图片表面。副标题使用【副标题】，保持简洁真实。\n\n根据主题加入一种"物理关系"增强视觉方法感，例如：折射、倒影、蒸汽变云、雨水涟漪、前后遮挡、透明介质、巨大比例差、物体穿过文字等。视觉关系应当第一眼能理解，第二眼出现惊喜。\n\n整体控制信息密度：顶部 Typography、中部核心主视觉、下部中文标题三个区域可以较密，其余区域主动留白。避免满屏小字和装饰。\n\n所有文字必须真实、有意义、可读，不使用乱码、无意义英文、假 Logo、假品牌、编号或模板占位信息。\n\n画面质感保持高级、柔和、克制、现代东方。避免过强 CGI 光效、廉价发光、塑料材质、过度锐化、传统纹样堆砌、旅游宣传感、电商促销感、复杂古建筑群、满屏节庆元素、四角星芒装饰。\n\n最终作品需要同时具备：大色域、强视觉锚点、巨物微人、东方诗境、现代 Editorial Typography、真实空间穿插、明显设计方法和完整海报作品感。',

    'prompt-2102970523466797329': '主题方向：东方禅意极简中秋封面海报\n风格分支：中秋女性审美明快型\n主体内容：一位古风女子坐在浅色台阶上，手边放着一个小小月饼礼盒\n情绪母题：团圆、喜悦、温暖节日感\n场景与意象：浅色台阶、桂花、珊瑚橙圆月、月饼礼盒、女子\n构图与空间：9:16 竖版构图，人物与台阶位于下半部分，圆月位于中上部，左上方或右上方保留完整标题区\n色彩控制：暖白作为整体高明度基底，桂花黄用于花朵和少量细节，珊瑚橙用于圆月和局部暖反光，人物服装建议浅米白；避免整图橙黄同色化\n光线与质感：明亮柔光，清透、干净、边缘清晰，现代新中式封面感\n画幅比例：9:16\n补充要求：礼盒要极简，不要商业堆料，整体要温暖漂亮，适合中秋节日标题图，画面留白处配上合适的文字',

    'prompt-2103359591849615733': '用李白的静夜思给我做一个 image，就是关于2026年的中秋节的，要有点卡通味道的，漂亮的，能让小朋友也喜欢的。',
}

def main():
    print("=" * 60)
    print("🔧 深度清理 prompt")
    print("=" * 60)
    
    slugs = list(CLEAN_DATA.keys())
    result = supabase.table('prompts').select('slug, prompt, title').in_('slug', slugs).execute()
    
    if not result.data:
        print("❌ 未找到这些 prompt")
        return
    
    print(f"\n找到 {len(result.data)} 条记录\n")
    
    fixed_count = 0
    for item in result.data:
        slug = item['slug']
        original = item.get('prompt') or ''
        cleaned = CLEAN_DATA.get(slug, '')
        
        if not cleaned:
            print(f"⚠️ {slug} - 无清理方案，跳过")
            continue
        
        if original.strip() != cleaned.strip():
            print(f"📝 {slug}")
            print(f"   原标题: {item.get('title', 'N/A')}")
            print(f"   原长度: {len(original)} chars")
            print(f"   清理后长度: {len(cleaned)} chars")
            
            update_result = supabase.table('prompts').update({
                'prompt': cleaned
            }).eq('slug', slug).execute()
            
            if update_result.data is not None:
                print(f"   ✅ 已更新\n")
                fixed_count += 1
            else:
                print(f"   ❌ 更新失败\n")
        else:
            print(f"✓ {slug} - 已是干净版本\n")
    
    print("=" * 60)
    print(f"✅ 深度清理完成: {fixed_count}/{len(result.data)} 条")
    print("=" * 60)

if __name__ == '__main__':
    main()
