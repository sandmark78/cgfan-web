#!/bin/bash

# CGfan 提示词模式样图上传器
# 使用方法：cgfan-upload [模式数字] [图片路径]

PREVIEW_DIR="/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/assets/prompt-previews"

# 检查参数
if [ $# -eq 0 ]; then
    echo "❌ 请提供模式数字和图片路径"
    echo ""
    echo "使用方法："
    echo "  cgfan-upload 1 /path/to/image.jpg"
    echo "  cgfan-upload 14 ~/Downloads/sample.png"
    echo ""
    echo "或直接拖拽图片到终端："
    echo "  cgfan-upload 1 [拖拽图片到这里]"
    exit 1
fi

MODE=$1
IMAGE_PATH=$2

# 检查图片是否存在
if [ ! -f "$IMAGE_PATH" ]; then
    echo "❌ 图片不存在: $IMAGE_PATH"
    exit 1
fi

# 检查模式数字
if ! [[ "$MODE" =~ ^[0-9]+$ ]] || [ "$MODE" -lt 1 ] || [ "$MODE" -gt 19 ]; then
    echo "❌ 模式数字必须在 1-19 之间"
    exit 1
fi

# 输出文件名
OUTPUT_FILE="$PREVIEW_DIR/mode_${MODE}.jpg"

echo "📤 正在上传模式 ${MODE} 的样图..."
echo "   源文件: $IMAGE_PATH"
echo "   目标文件: $OUTPUT_FILE"
echo ""

# 使用 sips 处理图片（macOS 自带）
# 1. 转换为 JPG
# 2. 调整尺寸为 600x400（3:2 比例）
# 3. 设置质量为 85%

# 先转换为 JPG
sips -s format jpeg "$IMAGE_PATH" --out "$OUTPUT_FILE" > /dev/null 2>&1

# 调整尺寸（保持宽高比，裁剪到 600x400）
# 先获取原图尺寸
WIDTH=$(sips -g pixelWidth "$OUTPUT_FILE" | tail -1 | awk '{print $2}')
HEIGHT=$(sips -g pixelHeight "$OUTPUT_FILE" | tail -1 | awk '{print $2}')

# 计算缩放比例
TARGET_WIDTH=600
TARGET_HEIGHT=400

if [ "$WIDTH" -gt "$HEIGHT" ]; then
    # 横向图片
    SCALE=$(echo "scale=2; $TARGET_HEIGHT / $HEIGHT" | bc)
    NEW_WIDTH=$(echo "$WIDTH * $SCALE / 1" | bc)
    sips -z $TARGET_HEIGHT $NEW_WIDTH "$OUTPUT_FILE" > /dev/null 2>&1
    # 裁剪到目标宽度
    sips -c $TARGET_HEIGHT $TARGET_WIDTH "$OUTPUT_FILE" > /dev/null 2>&1
else
    # 纵向图片
    SCALE=$(echo "scale=2; $TARGET_WIDTH / $WIDTH" | bc)
    NEW_HEIGHT=$(echo "$HEIGHT * $SCALE / 1" | bc)
    sips -z $NEW_HEIGHT $TARGET_WIDTH "$OUTPUT_FILE" > /dev/null 2>&1
    # 裁剪到目标高度
    sips -c $TARGET_HEIGHT $TARGET_WIDTH "$OUTPUT_FILE" > /dev/null 2>&1
fi

# 设置质量
sips -s formatOptions 85 "$OUTPUT_FILE" > /dev/null 2>&1

# 检查是否成功
if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo "✅ 上传成功！"
    echo "   文件大小: $FILE_SIZE"
    echo ""
    echo "🔄 正在更新预览页面..."
    
    # 重新生成预览页面
    ~/.hermes/profiles/cgfan/workspace/cgfan-web/scripts/cgfan-preview-generator.sh
    
    echo ""
    echo "🎉 完成！你可以："
    echo "   1. 查看预览: cgfan-preview"
    echo "   2. 选择模式: cgfan"
else
    echo "❌ 上传失败"
    exit 1
fi
