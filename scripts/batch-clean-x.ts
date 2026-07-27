#!/usr/bin/env tsx
/**
 * 批量清理 X 提取数据
 * 应用 fetch-tweet.ts 的质量标准
 */

import fs from 'fs';
import path from 'path';

interface PromptData {
  slug: string;
  prompt: string;
  model: string;
  cover: string;
  [key: string]: any;
}

// 质量门槛
const QUALITY_GATES = {
  MIN_PROMPT_LENGTH: 100,      // 最短提示词长度
  MIN_IMAGE_SIZE: 50 * 1024,   // 最小图片大小 (50KB)
  INVALID_PATTERNS: [
    /暂无可展示/,
    /no\s+prompt\s+available/i,
    /prompt\s+not\s+found/i,
    /^https?:\/\//,  // 纯链接
    /^#\w+/,         // 纯 hashtag
  ],
};

function checkQuality(prompt: PromptData): { pass: boolean; reason: string } {
  // 1. 提示词长度检查
  if (!prompt.prompt || prompt.prompt.length < QUALITY_GATES.MIN_PROMPT_LENGTH) {
    return { 
      pass: false, 
      reason: `提示词太短 (${prompt.prompt?.length || 0} < ${QUALITY_GATES.MIN_PROMPT_LENGTH})` 
    };
  }
  
  // 2. 检查无效内容
  for (const pattern of QUALITY_GATES.INVALID_PATTERNS) {
    if (pattern.test(prompt.prompt)) {
      return { pass: false, reason: `无效内容: 匹配 ${pattern}` };
    }
  }
  
  // 3. 图片检查
  if (!prompt.cover) {
    return { pass: false, reason: '缺少封面图片' };
  }
  
  // 4. 检查图片文件是否存在且大小合理
  const imagePath = path.join(process.cwd(), 'public', prompt.cover);
  if (fs.existsSync(imagePath)) {
    const stats = fs.statSync(imagePath);
    if (stats.size < QUALITY_GATES.MIN_IMAGE_SIZE) {
      return { 
        pass: false, 
        reason: `图片太小 (${Math.round(stats.size / 1024)}KB < ${QUALITY_GATES.MIN_IMAGE_SIZE / 1024}KB)` 
      };
    }
  } else {
    return { pass: false, reason: '图片文件不存在' };
  }
  
  return { pass: true, reason: '' };
}

function main() {
  const promptsPath = path.join(process.cwd(), 'lib/prompts-data.json');
  
  if (!fs.existsSync(promptsPath)) {
    console.error('❌ 找不到 prompts-data.json');
    process.exit(1);
  }
  
  const promptsData: PromptData[] = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));
  
  console.log(`📊 当前提示词: ${promptsData.length} 条`);
  console.log(`🎯 质量门槛:`);
  console.log(`   - 提示词 ≥ ${QUALITY_GATES.MIN_PROMPT_LENGTH} 字符`);
  console.log(`   - 图片 ≥ ${QUALITY_GATES.MIN_IMAGE_SIZE / 1024}KB`);
  console.log('');
  
  let filteredCount = 0;
  const filteredPrompts: PromptData[] = [];
  
  for (const prompt of promptsData) {
    const quality = checkQuality(prompt);
    
    if (!quality.pass) {
      filteredCount++;
      console.log(`❌ 过滤: ${prompt.slug}`);
      console.log(`   原因: ${quality.reason}`);
      continue;
    }
    
    filteredPrompts.push(prompt);
  }
  
  // 备份原文件
  const backupPath = promptsPath + '.backup';
  fs.copyFileSync(promptsPath, backupPath);
  console.log(`\n💾 备份已保存: ${backupPath}`);
  
  // 保存结果
  fs.writeFileSync(promptsPath, JSON.stringify(filteredPrompts, null, 2), 'utf-8');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 清理完成！');
  console.log('='.repeat(60));
  console.log(`📊 原始: ${promptsData.length} 条`);
  console.log(`❌ 过滤: ${filteredCount} 条`);
  console.log(`✅ 保留: ${filteredPrompts.length} 条`);
  console.log('='.repeat(60));
}

main();
