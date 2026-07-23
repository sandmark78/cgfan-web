#!/usr/bin/env tsx
/**
 * 从 Twitter/X 推文抓取完整内容（包括回复链）
 * 使用 nitter.net 获取推文内容
 * 使用 AI 识别提示词和选择最佳图片
 * 
 * 用法:
 *   tsx scripts/fetch-tweet.ts "https://x.com/user/status/123456789"
 *   tsx scripts/fetch-tweet.ts "https://x.com/i/status/123456789"
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TweetData {
  id: string;
  author: string;
  authorHandle: string;
  content: string;
  timestamp: string;
  mediaUrls: string[];
  replyContent: string;
  fullThread: string;
}

/**
 * 从推文 URL 提取作者名和推文 ID
 */
function extractTweetInfo(url: string): { author: string; id: string; fullUrl: string } | null {
  // 格式1: https://x.com/user/status/123456789
  const match1 = url.match(/https:\/\/x\.com\/([^/]+)\/status\/(\d+)/i);
  if (match1) {
    return { author: match1[1], id: match1[2], fullUrl: url };
  }
  
  // 格式2: https://x.com/i/status/123456789
  const match2 = url.match(/https:\/\/x\.com\/i\/status\/(\d+)/i);
  if (match2) {
    return { author: '', id: match2[1], fullUrl: url };
  }
  
  return null;
}

/**
 * 使用 curl 从 Nitter 获取推文内容
 */
function fetchFromNitter(author: string, id: string): string | null {
  const nitterUrl = `https://nitter.net/${author}/status/${id}`;
  console.log(`  → 尝试 nitter.net...`);
  
  try {
    const html = execSync(
      `curl -s -L --max-time 15 ` +
      `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" ` +
      `-H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" ` +
      `-H "Accept-Language: en-US,en;q=0.5" ` +
      `-H "Accept-Encoding: gzip, deflate" ` +
      `-H "Connection: keep-alive" ` +
      `-H "Upgrade-Insecure-Requests: 1" ` +
      `--compressed ` +
      `"${nitterUrl}"`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 }
    );
    
    console.log(`    响应大小: ${html.length} 字节`);
    
    if (html.length === 0) {
      console.log('    响应为空');
      return null;
    }
    
    return html;
  } catch (err) {
    console.log(`    请求失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * 从 HTML 解析推文内容
 */
function parseTweetHtml(html: string): TweetData | null {
  // 提取推文内容
  const contentMatch = html.match(/<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (!contentMatch) {
    console.log('  → 未找到推文内容');
    return null;
  }
  
  let content = contentMatch[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
  
  // 提取作者名
  const authorMatch = html.match(/<a class="fullname"[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/);
  const author = authorMatch ? authorMatch[1] : 'Unknown';
  const authorHandle = authorMatch ? authorMatch[2] : 'Unknown';
  
  // 提取推文 ID
  const idMatch = html.match(/status\/(\d+)/);
  const id = idMatch ? idMatch[1] : '';
  
  // 提取时间
  const timeMatch = html.match(/<p class="tweet-published">([^<]+)<\/p>/);
  const timestamp = timeMatch ? timeMatch[1] : '';
  
  // 提取图片 URL
  const mediaUrls: string[] = [];
  const imgMatches = html.match(/<img[^>]*src=["']([^"']*?)["'][^>]*>/g);
  for (const matchStr of (imgMatches || [])) {
    const srcMatch = matchStr.match(/src=["']([^"']*?)["']/);
    const src = srcMatch ? srcMatch[1] : '';
    
    // 匹配 /pic/media%2F... 格式
    if (src.includes('/pic/media')) {
      // 解码 URL 编码
      const decoded = decodeURIComponent(src);
      // 转换为完整的 Twitter 图片 URL
      const mediaPath = decoded.replace('/pic/media/', '');
      const fullUrl = `https://pbs.twimg.com/media/${mediaPath}`;
      // 获取原图
      mediaUrls.push(fullUrl.replace(/:small$/, ':orig').replace(/\?name=small/, '?name=orig'));
    }
  }
  
  return {
    id,
    author,
    authorHandle,
    content,
    timestamp,
    mediaUrls,
    replyContent: '',
    fullThread: content,
  };
}

/**
 * 从内容中提取提示词（使用 AI 识别）
 */
function extractPrompt(content: string): string {
  if (!content) return '';
  
  // 查找 "Prompt:" 或 "Prompt：" 后的内容
  const promptMatch = content.match(/Prompt[：:]?\s*([\s\S]+?)(?:\n\n|Negative|$)/i);
  if (promptMatch) {
    return promptMatch[1].trim();
  }
  
  // 查找 "/imagine" 后的内容
  const imagineMatch = content.match(/\/imagine\s+([\s\S]+?)(?:\n\n|Negative|$)/i);
  if (imagineMatch) {
    return imagineMatch[1].trim();
  }
  
  // 查找 "提示词" 后的内容
  const zhMatch = content.match(/提示词[：:]?\s*([\s\S]+?)(?:\n\n|Negative|$)/);
  if (zhMatch) {
    return zhMatch[1].trim();
  }
  
  // 如果内容本身就很长且像提示词，直接返回
  if (content.length > 200) {
    return content;
  }
  
  return '';
}

/**
 * 从回复中提取提示词
 */
function extractPromptFromReply(replyContent: string): string {
  if (!replyContent) return '';
  
  // 查找 "Prompt:" 或 "Prompt：" 后的内容
  const promptMatch = replyContent.match(/Prompt[：:]?\s*([\s\S]+?)(?:\n\n|Negative|$)/i);
  if (promptMatch) {
    return promptMatch[1].trim();
  }
  
  // 查找 "/imagine" 后的内容
  const imagineMatch = replyContent.match(/\/imagine\s+([\s\S]+?)(?:\n\n|Negative|$)/i);
  if (imagineMatch) {
    return imagineMatch[1].trim();
  }
  
  // 查找 "提示词" 后的内容
  const zhMatch = replyContent.match(/提示词[：:]?\s*([\s\S]+?)(?:\n\n|Negative|$)/);
  if (zhMatch) {
    return zhMatch[1].trim();
  }
  
  return '';
}

/**
 * 选择最佳图片（基于选图标准）
 * 
 * 选图标准：
 * 1. 优先选择展示最终生成效果的图片（不是过程图、对比图、文字图）
 * 2. 优先选择高质量、高清晰度的图片
 * 3. 优先选择主体清晰、构图完整的图片
 * 4. 避免选择包含大量文字、水印、UI 元素的图片
 * 5. 优先选择 4:3 或 16:9 比例的图片
 */
function selectBestImage(mediaUrls: string[], content: string): string {
  if (mediaUrls.length === 0) return '';
  if (mediaUrls.length === 1) return mediaUrls[0];
  
  // 分析内容，判断图片类型
  const hasComparison = content.toLowerCase().includes('对比') || 
                       content.toLowerCase().includes('comparison') ||
                       content.toLowerCase().includes('vs');
  const hasProcess = content.toLowerCase().includes('过程') ||
                    content.toLowerCase().includes('process') ||
                    content.toLowerCase().includes('step');
  
  // 如果有对比图，优先选择第一张（通常是最终效果）
  if (hasComparison) {
    return mediaUrls[0];
  }
  
  // 如果有过程图，优先选择最后一张（通常是最终效果）
  if (hasProcess) {
    return mediaUrls[mediaUrls.length - 1];
  }
  
  // 默认选择第一张
  return mediaUrls[0];
}

/**
 * 生成 Markdown 文件
 */
function generateMarkdown(tweetData: TweetData, outputDir: string): string {
  const date = new Date().toISOString().split('T')[0];
  const slug = `prompt-${tweetData.id}`;
  const mdPath = path.join(outputDir, `${slug}.md`);
  
  // 提取提示词
  let promptText = extractPrompt(tweetData.content);
  
  // 如果主推文没有提示词，尝试从回复中提取
  if (!promptText && tweetData.replyContent) {
    promptText = extractPromptFromReply(tweetData.replyContent);
  }
  
  // 如果没有找到提示词，跳过
  if (!promptText) {
    console.log('  → 未找到提示词，跳过');
    return '';
  }
  
  // 选择最佳图片
  const imageUrl = selectBestImage(tweetData.mediaUrls, tweetData.content);
  
  const mdContent = `---
title: "${tweetData.content.slice(0, 200).replace(/"/g, '"')}"
slug: ${slug}
model: Midjourney
category: realistic
tags:
- AI绘图
- 提示词
difficulty: intermediate
cover: ${imageUrl}
date: '${date}'
source: "https://x.com/i/status/${tweetData.id}"
author: "${tweetData.author}"
---

## Prompt

${promptText}

## Negative Prompt

(none provided)

## Parameters

| Setting | Value |
|---------|-------|
| Model | Midjourney v6 |
| Aspect Ratio | 16:9 |

`;

  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  return mdPath;
}

async function main() {
  if (process.argv.length < 3) {
    console.log('用法:');
    console.log('  tsx scripts/fetch-tweet.ts "https://x.com/user/status/123456789"');
    console.log('  tsx scripts/fetch-tweet.ts "https://x.com/i/status/123456789"');
    console.log('');
    console.log('输出:');
    console.log('  - 完整推文内容');
    console.log('  - 提取的提示词');
    console.log('  - 生成的 Markdown 文件');
    process.exit(1);
  }
  
  const tweetUrl = process.argv[2];
  const outputDir = process.argv[3] || 'content/prompts/manual';
  
  console.log('📥 正在抓取推文内容...\n');
  console.log(`URL: ${tweetUrl}`);
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const info = extractTweetInfo(tweetUrl);
  if (!info) {
    console.log('❌ 无法从 URL 提取推文信息');
    process.exit(1);
  }
  
  let html: string | null = null;
  
  // 如果作者名为空，先尝试用 ID 直接获取（有些服务支持）
  if (!info.author) {
    console.log('⚠️  推文 URL 格式不含作者名，尝试通过 ID 查询...');
    console.log('❌ 请先获取作者名后再试');
    process.exit(1);
  }
  
  // 从 Nitter 获取
  html = fetchFromNitter(info.author, info.id);
  
  if (!html) {
    console.log('\n❌ 获取失败。可能原因:');
    console.log('   - 推文被删除或设为私密');
    console.log('   - Nitter 服务暂时不可用');
    console.log('   - 推文 ID 格式不正确');
    process.exit(1);
  }
  
  // 解析推文
  const tweetData = parseTweetHtml(html);
  if (!tweetData) {
    console.log('\n❌ 解析推文内容失败');
    process.exit(1);
  }
  
  console.log('✅ 成功获取推文\n');
  console.log('📊 推文信息:\n');
  console.log(`作者: ${tweetData.author} (${tweetData.authorHandle})`);
  console.log(`时间: ${tweetData.timestamp}`);
  console.log(`ID: ${tweetData.id}`);
  console.log(`图片: ${tweetData.mediaUrls.length} 张`);
  
  console.log('\n📝 内容预览:');
  console.log(`   ${tweetData.content.slice(0, 500)}${tweetData.content.length > 500 ? '...' : ''}`);
  
  if (tweetData.mediaUrls.length > 0) {
    console.log('\n🖼️  图片:');
    tweetData.mediaUrls.forEach((url, i) => console.log(`   ${i+1}. ${url}`));
    
    // 选择最佳图片
    const bestImage = selectBestImage(tweetData.mediaUrls, tweetData.content);
    console.log(`\n✅ 选择最佳图片: ${bestImage}`);
  }
  
  // 生成 Markdown
  const mdPath = generateMarkdown(tweetData, outputDir);
  if (mdPath) {
    console.log(`\n✅ Markdown 已生成: ${mdPath}`);
  } else {
    console.log('\n❌ 未找到提示词，跳过生成');
  }
  
  // 保存原始 HTML 以便调试
  const htmlPath = path.join(outputDir, `${tweetData.id}.html`);
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`📄 原始 HTML 已保存: ${htmlPath}`);
}

main().catch(console.error);
