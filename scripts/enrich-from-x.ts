#!/usr/bin/env tsx
/**
 * 从 x.cgfan.com 补全提示词内容
 * 通过推文链接匹配，提取完整的提示词
 */

import fs from 'fs';
import path from 'path';

interface SearchIndexItem {
  title: string;
  content: string;
  tags: string[];
  url: string;
  author: string;
  cover: string;
  date: string;
}

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

// 从 x.cgfan.com 内容中提取提示词
function extractPromptFromContent(content: string): string {
  // 尝试多种模式提取提示词
  
  // 模式1: 查找 "Prompt：" 或 "Prompt:" 后的内容
  const promptMatch = content.match(/Prompt[：:]\s*([\s\S]+?)(?:\n\n|\n##|\[!AI-Summary\]|元数据|$)/i);
  if (promptMatch && promptMatch[1].length > 50) {
    return promptMatch[1].trim();
  }
  
  // 模式2: 查找 "提示词：" 或 "提示词:" 后的内容
  const promptZhMatch = content.match(/提示词[：:]\s*([\s\S]+?)(?:\n\n|\n##|\[!AI-Summary\]|元数据|$)/i);
  if (promptZhMatch && promptZhMatch[1].length > 50) {
    return promptZhMatch[1].trim();
  }
  
  // 模式3: 查找 /imagine prompt: 后的内容
  const imagineMatch = content.match(/\/imagine\s+prompt[：:]\s*([\s\S]+?)(?:\n\n|\n##|\[!AI-Summary\]|元数据|$)/i);
  if (imagineMatch && imagineMatch[1].length > 50) {
    return imagineMatch[1].trim();
  }
  
  // 模式4: 查找 "核心观点" 后的完整内容
  const coreMatch = content.match(/💡\s*核心观点\s*([\s\S]+?)(?:\n\n🧵|\[!AI-Summary\]|元数据|$)/);
  if (coreMatch && coreMatch[1].length > 100) {
    return coreMatch[1].trim();
  }
  
  return '';
}

// 从推文中提取模型
function detectModelFromContent(content: string): string {
  const contentLower = content.toLowerCase();
  
  const modelPatterns: Record<string, RegExp[]> = {
    'Gemini': [/gemini/i, /nano\s*banana/i],
    'Grok': [/grok/i],
    'Seedream': [/seedream/i],
    'DALL-E': [/dall-e/i, /dalle/i],
    'Stable Diffusion': [/stable\s*diffusion/i, /sdxl/i],
    'Flux': [/flux/i],
    'Midjourney': [/midjourney/i, /mj\s*v?\d/i, /niji/i, /\/imagine/i],
  };
  
  for (const [model, patterns] of Object.entries(modelPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(contentLower)) {
        return model;
      }
    }
  }
  
  return '';
}

// 从推文中提取标签
function extractTagsFromContent(content: string, existingTags: string[]): string[] {
  const tags = new Set(existingTags);
  
  // 从 "标签：" 或 "标签:" 提取
  const tagMatch = content.match(/标签[：:]\s*([^\n]+)/i);
  if (tagMatch) {
    const extractedTags = tagMatch[1]
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0 && t.length < 20);
    
    extractedTags.forEach(t => tags.add(t));
  }
  
  return Array.from(tags).slice(0, 5);
}

async function main() {
  console.log('📥 正在获取 x.cgfan.com 数据...');
  
  // 获取 searchIndex.json
  const response = await fetch('https://x.cgfan.com/searchIndex.json');
  const searchIndex: SearchIndexItem[] = await response.json();
  
  console.log(`✅ 获取到 ${searchIndex.length} 条数据`);
  
  // 建立推文链接索引
  const tweetIndex = new Map<string, SearchIndexItem>();
  for (const item of searchIndex) {
    // 从 content 中提取原推文链接
    const tweetMatch = item.content.match(/原推文[：:]\s*(https:\/\/x\.com\/[^\s]+)/i);
    if (tweetMatch) {
      tweetIndex.set(tweetMatch[1], item);
    }
    // 也尝试匹配 status 链接
    const statusMatch = item.content.match(/(https:\/\/x\.com\/i\/status\/\d+)/i);
    if (statusMatch) {
      tweetIndex.set(statusMatch[1], item);
    }
  }
  
  console.log(`📊 建立索引: ${tweetIndex.size} 条推文链接`);
  
  // 读取 prompts-data.json
  const promptsPath = path.join(process.cwd(), 'lib/prompts-data.json');
  const promptsData: PromptData[] = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));
  
  console.log(`📝 当前提示词: ${promptsData.length} 条`);
  
  // 统计
  let updatedCount = 0;
  let matchedCount = 0;
  
  // 补全不完整的提示词
  for (const prompt of promptsData) {
    // 跳过已经有完整内容的
    if (prompt.prompt.length >= 200) {
      continue;
    }
    
    // 通过 source 链接匹配
    const sourceUrl = prompt.source;
    const matchedItem = tweetIndex.get(sourceUrl);
    
    if (matchedItem) {
      matchedCount++;
      
      // 提取完整提示词
      const fullPrompt = extractPromptFromContent(matchedItem.content);
      
      if (fullPrompt && fullPrompt.length > prompt.prompt.length) {
        prompt.prompt = fullPrompt;
        
        // 更新模型（如果当前是 Midjourney 但内容显示其他模型）
        const detectedModel = detectModelFromContent(matchedItem.content);
        if (detectedModel && prompt.model === 'Midjourney') {
          prompt.model = detectedModel;
        }
        
        // 更新标签
        prompt.tags = extractTagsFromContent(matchedItem.content, prompt.tags);
        
        updatedCount++;
        console.log(`✅ 更新: ${prompt.slug} (${prompt.prompt.length} 字符)`);
      }
    }
  }
  
  // 保存更新后的数据
  fs.writeFileSync(promptsPath, JSON.stringify(promptsData, null, 2), 'utf-8');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 补全完成！');
  console.log('='.repeat(60));
  console.log(`📊 匹配到: ${matchedCount} 条`);
  console.log(`📝 更新: ${updatedCount} 条`);
  console.log('='.repeat(60));
}

main().catch(console.error);
