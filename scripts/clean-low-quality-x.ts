#!/usr/bin/env tsx
/**
 * 清理低质量 X 提取数据
 * 
 * 过滤规则：
 * 1. 提示词包含 hashtag (#xxx) - 推文文本
 * 2. 提示词包含链接 (http/https/t.co) - 推文文本
 * 3. 提示词太短 (< 100 字符) - 可能是无效内容
 * 4. 提示词是纯中文问候语 - 无实际内容
 */

import fs from 'fs';
import path from 'path';

interface PromptData {
  slug: string;
  prompt: string;
  model: string;
  [key: string]: any;
}

// 低质量模式
const LOW_QUALITY_PATTERNS = [
  /#\w+/,                    // Hashtag
  /https?:\/\//,             // 链接
  /t\.co\/\w+/,              // Twitter 短链接
  /^(早上好|晚安|你好|谢谢|哈哈|嗯嗯)/,  // 问候语
  /^[^a-zA-Z\u4e00-\u9fa5]{0,10}$/,  // 几乎无内容
];

function isLowQuality(prompt: string): { low: boolean; reason: string } {
  for (const pattern of LOW_QUALITY_PATTERNS) {
    if (pattern.test(prompt)) {
      return { low: true, reason: `匹配模式: ${pattern}` };
    }
  }
  
  if (prompt.length < 100) {
    return { low: true, reason: `太短 (${prompt.length} 字符)` };
  }
  
  return { low: false, reason: '' };
}

function main() {
  const promptsPath = path.join(process.cwd(), 'lib/prompts-data.ts');
  const tsContent = fs.readFileSync(promptsPath, 'utf-8');
  const base64Match = tsContent.match(/export default `([^`]+)`/);
  if (!base64Match) {
    console.error('❌ 无法解析 prompts-data.ts');
    process.exit(1);
  }
  const data: PromptData[] = JSON.parse(Buffer.from(base64Match[1], 'base64').toString('utf-8'));
  
  console.log(`📊 原始数据: ${data.length} 条`);
  
  const highQuality: PromptData[] = [];
  let filteredCount = 0;
  
  for (const prompt of data) {
    const quality = isLowQuality(prompt.prompt);
    
    if (quality.low) {
      filteredCount++;
      console.log(`❌ 过滤: ${prompt.slug}`);
      console.log(`   原因: ${quality.reason}`);
      console.log(`   内容: ${prompt.prompt.slice(0, 80)}...`);
    } else {
      highQuality.push(prompt);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 清理完成！');
  console.log('='.repeat(60));
  console.log(`📊 原始: ${data.length} 条`);
  console.log(`❌ 过滤: ${filteredCount} 条`);
  console.log(`✅ 保留: ${highQuality.length} 条`);
  console.log('='.repeat(60));
  
  // 备份原文件
  const backupPath = promptsPath + '.backup';
  fs.copyFileSync(promptsPath, backupPath);
  console.log(`\n💾 备份已保存: ${backupPath}`);
  
  // 写入新文件
  fs.writeFileSync(promptsPath, JSON.stringify(highQuality, null, 2), 'utf-8');
  console.log(`✅ 已更新: ${promptsPath}`);
}

main();
