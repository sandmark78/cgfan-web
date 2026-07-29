#!/usr/bin/env tsx
/**
 * 优化 X 提取质量，对齐 Gemnana 标准
 * 
 * 功能：
 * 1. 改进提示词提取逻辑
 * 2. 模型检测（从内容识别）
 * 3. 质量门槛（prompt 长度、图片质量）
 * 4. 可选美学评分（需要 vision API）
 */

import fs from 'fs';
import path from 'path';

interface PromptData {
  title: string;
  slug: string;
  model: string;
  category: string;
  tags: string[];
  difficulty: string;
  cover: string;
  date: string;
  source: string;
  author: string;
  prompt: string;
  negativePrompt: string;
  parameters: Record<string, string>;
}

// 质量门槛配置
const QUALITY_GATES = {
  MIN_PROMPT_LENGTH: 50,      // 最短提示词长度
  MIN_IMAGE_SIZE: 10 * 1024,  // 最小图片大小 (10KB)
  REQUIRE_AESTHETIC_SCORE: false, // 是否要求美学评分（需要 vision API）
  MIN_AESTHETIC_SCORE: 8.0,   // 最低美学评分
};

// 模型检测规则（从内容识别）
const MODEL_PATTERNS: Record<string, RegExp[]> = {
  'GPT-Image2': [/gpt[-\s]?image[-\s]?2/i, /gpt[-\s]?img[-\s]?2/i, /gpt[-\s]?i2/i],
  'GPT-Image': [/gpt[-\s]?image/i, /gpt[-\s]?img/i, /dall[-\s]?e[-\s]?3/i],
  'Gemini': [/gemini/i, /nano[-\s]?banana/i, /imagen/i],
  'Grok': [/grok/i, /xai/i],
  'Midjourney': [/midjourney/i, /mj\s*v?\d/i, /niji/i, /\/imagine/i, /--ar\s+\d+:\d+/i],
  'Stable Diffusion': [/stable[-\s]?diffusion/i, /sdxl/i, /comfyui/i],
  'Flux': [/flux/i, /black[-\s]?forest/i],
  'Adobe Firefly': [/firefly/i, /adobe/i],
};

/**
 * 从内容检测模型
 */
function detectModel(content: string, existingModel: string = ''): string {
  const text = `${content} ${existingModel}`;
  
  for (const [model, patterns] of Object.entries(MODEL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return model;
      }
    }
  }
  
  return existingModel || 'Common';
}

/**
 * 改进的提示词提取逻辑
 */
function extractPrompt(content: string): string {
  if (!content) return '';
  
  // 策略1: 查找明确的提示词标记
  const patterns = [
    // Prompt: / Prompt：
    /(?:^|\n)\s*(?:Prompt|提示词|咒语)[：:]\s*([\s\S]+?)(?:\n\s*(?:Negative|参数|Model|--|\[|【)|$)/i,
    // /imagine prompt:
    /\/imagine\s+prompt[：:]?\s*([\s\S]+?)(?:\n\s*(?:--|\[|【|Negative)|$)/i,
    // 直接是提示词内容（长文本）
    /(?:^|\n)\s*([\s\S]{100,}?)(?:\n\s*(?:Negative|参数|Model|--|\[|【)|$)/,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const prompt = match[1].trim();
      // 清理多余空白
      const cleaned = prompt.replace(/\s+/g, ' ').trim();
      if (cleaned.length >= QUALITY_GATES.MIN_PROMPT_LENGTH) {
        return cleaned;
      }
    }
  }
  
  // 策略2: 如果内容本身很长且像提示词
  const cleanedContent = content.replace(/\s+/g, ' ').trim();
  if (cleanedContent.length >= 200 && !cleanedContent.includes('http')) {
    return cleanedContent;
  }
  
  return '';
}

/**
 * 质量检查
 */
function checkQuality(prompt: PromptData): { pass: boolean; reason: string } {
  // 1. 提示词长度检查
  if (!prompt.prompt || prompt.prompt.length < QUALITY_GATES.MIN_PROMPT_LENGTH) {
    return { 
      pass: false, 
      reason: `提示词太短 (${prompt.prompt?.length || 0} < ${QUALITY_GATES.MIN_PROMPT_LENGTH})` 
    };
  }
  
  // 2. 图片检查
  if (!prompt.cover) {
    return { pass: false, reason: '缺少封面图片' };
  }
  
  // 3. 检查图片文件是否存在且大小合理
  const imagePath = path.join(process.cwd(), 'public', prompt.cover);
  if (fs.existsSync(imagePath)) {
    const stats = fs.statSync(imagePath);
    if (stats.size < QUALITY_GATES.MIN_IMAGE_SIZE) {
      return { 
        pass: false, 
        reason: `图片太小 (${Math.round(stats.size / 1024)}KB < ${QUALITY_GATES.MIN_IMAGE_SIZE / 1024}KB)` 
      };
    }
  }
  
  // 4. 检查是否是无效内容
  const invalidPatterns = [
    /暂无可展示/,
    /no\s+prompt\s+available/i,
    /prompt\s+not\s+found/i,
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(prompt.prompt)) {
      return { pass: false, reason: '提示词内容无效' };
    }
  }
  
  return { pass: true, reason: '' };
}

/**
 * 从分类推断难度
 */
function inferDifficulty(prompt: string, category: string): string {
  const length = prompt.length;
  
  // 长提示词通常是高级
  if (length > 800) return 'advanced';
  if (length > 300) return 'intermediate';
  
  // 根据分类
  if (['concept', 'abstract', 'surreal'].includes(category)) return 'advanced';
  if (['portrait', 'product', 'architecture'].includes(category)) return 'intermediate';
  
  return 'beginner';
}

/**
 * 从内容提取标签
 */
function extractTags(content: string, existingTags: string[]): string[] {
  const tags = new Set(existingTags);
  
  // 从内容提取常见标签
  const tagPatterns: Record<string, RegExp> = {
    '3D渲染': /3d|c4d|octane|render|渲染|三维/i,
    '写实': /realistic|photorealistic|写实|照片级/i,
    '动漫': /anime|manga|二次元|卡通/i,
    '摄影': /photography|摄影|镜头|camera/i,
    '概念艺术': /concept|概念艺术/i,
    '超现实': /surreal|超现实/i,
    '极简': /minimal|极简|简约/i,
    '复古': /retro|vintage|复古|怀旧/i,
  };
  
  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    if (pattern.test(content)) {
      tags.add(tag);
    }
  }
  
  return Array.from(tags).slice(0, 5);
}

/**
 * 主处理函数
 */
function main() {
  const promptsPath = path.join(process.cwd(), 'lib/prompts-data.ts');
  
  if (!fs.existsSync(promptsPath)) {
    console.error('❌ 找不到 prompts-data.ts');
    process.exit(1);
  }
  
  const tsContent = fs.readFileSync(promptsPath, 'utf-8');
  const base64Match = tsContent.match(/export default `([^`]+)`/);
  if (!base64Match) {
    console.error('❌ 无法解析 prompts-data.ts');
    process.exit(1);
  }
  const promptsData: PromptData[] = JSON.parse(Buffer.from(base64Match[1], 'base64').toString('utf-8'));
  
  console.log(`📊 当前提示词: ${promptsData.length} 条`);
  console.log(`🎯 质量门槛: 提示词 ≥ ${QUALITY_GATES.MIN_PROMPT_LENGTH} 字符`);
  console.log('');
  
  let improvedCount = 0;
  let filteredCount = 0;
  const filteredPrompts: PromptData[] = [];
  
  for (const prompt of promptsData) {
    // 1. 改进提示词提取
    const originalPrompt = prompt.prompt;
    const improvedPrompt = extractPrompt(prompt.prompt);
    
    if (improvedPrompt && improvedPrompt.length > originalPrompt.length) {
      prompt.prompt = improvedPrompt;
      improvedCount++;
      console.log(`✅ 改进提示词: ${prompt.slug} (${originalPrompt.length} → ${improvedPrompt.length})`);
    }
    
    // 2. 模型检测
    const originalModel = prompt.model;
    const detectedModel = detectModel(prompt.prompt + ' ' + prompt.title, prompt.model);
    
    if (detectedModel !== originalModel) {
      prompt.model = detectedModel;
      console.log(`🤖 更新模型: ${prompt.slug} (${originalModel} → ${detectedModel})`);
    }
    
    // 3. 标签提取
    prompt.tags = extractTags(prompt.prompt + ' ' + prompt.title, prompt.tags);
    
    // 4. 难度推断
    prompt.difficulty = inferDifficulty(prompt.prompt, prompt.category);
    
    // 5. 质量检查
    const quality = checkQuality(prompt);
    
    if (!quality.pass) {
      filteredCount++;
      console.log(`❌ 过滤: ${prompt.slug} - ${quality.reason}`);
      continue;
    }
    
    filteredPrompts.push(prompt);
  }
  
  // 保存结果
  fs.writeFileSync(promptsPath, JSON.stringify(filteredPrompts, null, 2), 'utf-8');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 优化完成！');
  console.log('='.repeat(60));
  console.log(`📊 原始: ${promptsData.length} 条`);
  console.log(`📝 改进提示词: ${improvedCount} 条`);
  console.log(`❌ 过滤: ${filteredCount} 条`);
  console.log(`✅ 保留: ${filteredPrompts.length} 条`);
  console.log('='.repeat(60));
}

main();
