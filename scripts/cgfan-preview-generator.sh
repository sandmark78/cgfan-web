#!/bin/bash

# CGfan 提示词模式预览图生成器
# 使用方法：cgfan-preview

PREVIEW_DIR="/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/assets/prompt-previews"
HTML_FILE="/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/assets/prompt-previews/index.html"

# 创建目录
mkdir -p "$PREVIEW_DIR"

# 生成 HTML 预览页面
cat > "$HTML_FILE" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CGfan 提示词模式预览</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        .card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        .card-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 14px;
        }
        .card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .card-content {
            padding: 15px;
        }
        .card-title {
            font-size: 1.1em;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }
        .card-desc {
            font-size: 0.9em;
            color: #666;
            line-height: 1.4;
        }
        .card-number {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            margin-bottom: 10px;
        }
        .no-image {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 CGfan 提示词模式预览</h1>
        <div class="grid">
EOF

# 添加每个模式的卡片
declare -a MODES=(
    "1:超写实电影摄影:photorealistic cinematic, 真人质感, 电影光影"
    "2:偏写实古风工笔画:细腻线条, 矿物颜料, 古典质感"
    "3:高端时尚杂志式服装设计档案:博物馆服饰档案质感, 国际高端时尚"
    "4:东方禅意美学壁纸:极简插画, 高对比灵动, 宣纸肌理"
    "5:国风超写实CG唐风人像:唐风宫廷美学, 凤冠华服"
    "6:传统工笔画（宋代美学）:宋代极简美学, 矿物颜料"
    "7:古风电影人像母模板:Pro-Mist柔雾自然光, 高调低对比"
    "8:东方幻想少女·电影级游戏CG:虚幻引擎5美学, 物理渲染"
    "9:敦煌石窟·冰蓝飞天乐伎:敦煌飞天主题, 梦幻柔光"
    "10:中式诡谲妖异美学:Pro-Mist柔雾, 诡谲冷艳"
    "11:巨宠柴犬·秋日治愈:巨物奇幻, 治愈温暖"
    "12:简洁英文提示词:模型自由发挥, 简洁模板"
    "13:东方诡谲时尚·秋日花园:彼岸花+粉黛子, 凄美氛围"
    "14:超写实东方幻想·颜值构图锁定:三层控制方法论"
    "15:盛唐古风·极致面部细节:极致面部细节, 虹膜纹理"
    "16:半写实梦幻CG·古典美人:半写实CG插画, 绘画柔和感"
    "17:武侠女侠·史诗战斗CG:武侠战斗场景, 动态姿态"
    "18:东方双生·明暗对比美学:垂直分割构图, 一暗一明"
    "19:东方诡谲·傩面胭脂·电影特写:傩戏面具+胭脂, f/1.2极浅景深"
)

for mode_info in "${MODES[@]}"; do
    IFS=':' read -r num name desc <<< "$mode_info"
    image_file="$PREVIEW_DIR/mode_${num}.jpg"
    
    if [ -f "$image_file" ]; then
        image_html="<img src=\"mode_${num}.jpg\" alt=\"模式${num}\">"
    else
        image_html="<div class=\"no-image\">暂无样图<br>上传到:<br>mode_${num}.jpg</div>"
    fi
    
    cat >> "$HTML_FILE" << EOF
            <div class="card">
                <div class="card-image">
                    ${image_html}
                </div>
                <div class="card-content">
                    <span class="card-number">模式 ${num}</span>
                    <div class="card-title">${name}</div>
                    <div class="card-desc">${desc}</div>
                </div>
            </div>
EOF
done

# 关闭 HTML
cat >> "$HTML_FILE" << 'EOF'
        </div>
    </div>
</body>
</html>
EOF

echo "✅ 预览页面已生成: $HTML_FILE"
echo ""
echo "📂 样图存放目录: $PREVIEW_DIR"
echo ""
echo "📝 使用方法："
echo "   1. 将样图上传到上述目录，命名为 mode_1.jpg, mode_2.jpg 等"
echo "   2. 运行此脚本重新生成预览页面"
echo "   3. 用浏览器打开: open $HTML_FILE"
echo ""
echo "🌐 正在打开预览页面..."
open "$HTML_FILE"
