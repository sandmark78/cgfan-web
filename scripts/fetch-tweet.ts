#!/usr/bin/env tsx
/**
 * 从 Twitter/X 推文抓取完整内容（包括回复链）
 * 使用 Camofox 浏览器自动化获取推文内容
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
 * 从推文 URL 提取推文 ID
 */
function extractTweetId(url: string): string | null {
  const match = url.match(/status\/(\d+)/i);
  return match ? match[1] : null;
}

/**
 * 解析 Camofox eval 输出
 * 格式: ok: true\nresult: <value>\nresultType: string\ntruncated: false
 */
function parseCamofoxOutput(output: string): string {
  // 尝试提取 result: 后面的值
  const resultMatch = output.match(/^result:\s*(.+)$/m);
  if (resultMatch) {
    return resultMatch[1].trim();
  }
  
  // 尝试 JSON 格式
  try {
    const parsed = JSON.parse(output);
    return parsed.result || '';
  } catch {
    // 直接返回清理后的输出
    return output
      .replace(/^ok:.*$/m, '')
      .replace(/^resultType:.*$/m, '')
      .replace(/^truncated:.*$/m, '')
      .trim();
  }
}

/**
 * 使用 Camofox 获取推文内容
 */
function fetchWithCamofox(url: string): TweetData | null {
  console.log(`  → 使用 Camofox 获取推文...`);
  
  let tabId = '';
  
  try {
    // 1. 打开新 tab
    const openResult = execSync(`camofox open "${url}"`, { encoding: 'utf-8' });
    tabId = openResult.match(/tabId: ([a-f0-9-]{36})/)?.[1] || '';
    
    if (!tabId) {
      console.log('    无法获取 tab ID');
      return null;
    }
    
    console.log(`    Tab ID: ${tabId}`);
    
    // 2. 等待页面加载
    execSync('sleep 4');
    
    // 3. 展开 "Show more" 按钮
    try {
      execSync(`camofox eval '
        const buttons = document.querySelectorAll("button");
        for (const btn of buttons) {
          if (btn.textContent.includes("Show more") || btn.textContent.includes("显示更多")) {
            btn.click();
          }
        }
      ' "${tabId}"`, { encoding: 'utf-8' });
      execSync('sleep 2');
    } catch (e) {
      console.log('    无 Show more 按钮或点击失败');
    }
    
    // 4. 获取完整内容（主推文 + 回复）
    const contentRaw = execSync(
      `camofox eval 'Array.from(document.querySelectorAll("article")).map((a, i) => "===ARTICLE " + i + "===\\n" + a.innerText).join("\\n\\n")' "${tabId}"`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 }
    );
    const contentResult = parseCamofoxOutput(contentRaw);
    
    console.log(`    内容长度: ${contentResult.length} 字符`);
    
    // 5. 提取图片 URL
    const imageRaw = execSync(
      `camofox eval 'document.querySelector("meta[property=\\"og:image\\"]")?.content || ""' "${tabId}"`,
      { encoding: 'utf-8' }
    );
    const imageResult = parseCamofoxOutput(imageRaw);
    
    // 6. 提取作者信息
    const authorRaw = execSync(
      `camofox eval 'document.querySelector("a[role=\\"link\\"]")?.textContent || ""' "${tabId}"`,
      { encoding: 'utf-8' }
    );
    const authorResult = parseCamofoxOutput(authorRaw);
    
    // 7. 提取日期
    const dateRaw = execSync(
      `camofox eval 'document.querySelector("article time")?.getAttribute("datetime") || ""' "${tabId}"`,
      { encoding: 'utf-8' }
    );
    const dateResult = parseCamofoxOutput(dateRaw);
    
    // 解析内容
    const articles = contentResult.split('===ARTICLE ').filter(a => a.trim());
    const mainTweet = articles[0]?.replace(/^\d+===\n/, '').trim() || '';
    const replyContent = articles.slice(1).map(a => a.replace(/^\d+===\n/, '').trim()).join('\n\n');
    
    // 提取图片
    const mediaUrls: string[] = [];
    if (imageResult && imageResult.includes('pbs.twimg.com')) {
      const cleanUrl = imageResult.replace(/:small$/, ':orig').replace(/:medium$/, ':orig').replace(/:large$/, ':orig');
      mediaUrls.push(cleanUrl);
    }
    
    // 从内容中提取更多图片
    const imgMatches = contentResult.match(/https:\/\/pbs\.twimg\.com\/media\/[^\s"'<>]+/g);
    if (imgMatches) {
      for (const url of imgMatches) {
        const cleanUrl = url.replace(/:small$/, ':orig').replace(/:medium$/, ':orig').replace(/:large$/, ':orig');
        if (!mediaUrls.includes(cleanUrl)) {
          mediaUrls.push(cleanUrl);
        }
      }
    }
    
    // 提取作者
    const authorMatch = authorResult.match(/@(\w+)/);
    const authorHandle = authorMatch ? authorMatch[1] : '';
    const author = authorResult.replace(/@.*/, '').trim() || authorHandle;
    
    // 提取推文 ID
    const idMatch = url.match(/status\/(\d+)/);
    const id = idMatch ? idMatch[1] : '';
    
    // 提取日期
    const timestamp = dateResult || new Date().toISOString();
    
    return {
      id,
      author,
      authorHandle,
      content: mainTweet,
      timestamp,
      mediaUrls,
      replyContent,
      fullThread: mainTweet,
    };
    
  } catch (err) {
    console.log(`    请求失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return null;
  } finally {
    // 8. 关闭 tab
    if (tabId) {
      try {
        execSync(`camofox close "${tabId}"`, { encoding: 'utf-8' });
        console.log('    Tab 已关闭');
      } catch (e) {
        // ignore
      }
    }
  }
}

/**
 * 从内容中提取提示词
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
  
  const promptMatch = replyContent.match(/Prompt[：:]?\s*([\s\S]+?)(?:\n\n|Negative|$)/i);
  if (promptMatch) {
    return promptMatch[1].trim();
  }
  
  const imagineMatch = replyContent.match(/\/imagine\s+([\s\S]+?)(?:\n\n|Negative|$)/i);
  if (imagineMatch) {
    return imagineMatch[1].trim();
  }
  
  const zhMatch = replyContent.match(/提示词[：:]?\s*([\s\S]+?)(?:\n\n|Negative|$)/);
  if (zhMatch) {
    return zhMatch[1].trim();
  }
  
  return '';
}

/**
 * 选择最佳图片
 */
function selectBestImage(mediaUrls: string[], content: string): string {
  if (mediaUrls.length === 0) return '';
  if (mediaUrls.length === 1) return mediaUrls[0];
  
  const hasComparison = content.toLowerCase().includes('对比') || 
                       content.toLowerCase().includes('comparison') ||
                       content.toLowerCase().includes('vs');
  const hasProcess = content.toLowerCase().includes('过程') ||
                    content.toLowerCase().includes('process') ||
                    content.toLowerCase().includes('step');
  
  if (hasComparison) {
    return mediaUrls[0];
  }
  
  if (hasProcess) {
    return mediaUrls[mediaUrls.length - 1];
  }
  
  return mediaUrls[0];
}

/**
 * 下载图片到本地
 */
function downloadImage(url: string, outputPath: string): boolean {
  try {
    execSync(`curl -L -s -o "${outputPath}" "${url}"`, { encoding: 'utf-8' });
    const stats = fs.statSync(outputPath);
    return stats.size > 0;
  } catch (err) {
    console.log(`    下载图片失败: ${url}`);
    return false;
  }
}

/**
 * 生成 Markdown 文件
 */
function generateMarkdown(tweetData: TweetData, outputDir: string): string {
  const date = tweetData.timestamp ? new Date(tweetData.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
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
  
  // 下载图片
  let localImagePath = imageUrl;
  if (imageUrl) {
    const imageDir = path.join(process.cwd(), 'public/images/prompts');
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }
    
    const imageExt = path.extname(new URL(imageUrl).pathname) || '.webp';
    const localImageName = `${slug}${imageExt}`;
    const localImagePathFull = path.join(imageDir, localImageName);
    
    if (downloadImage(imageUrl, localImagePathFull)) {
      localImagePath = `/images/prompts/${localImageName}`;
      console.log(`    图片已下载: ${localImagePath}`);
    }
  }
  
  const mdContent = `---
title: "${tweetData.content.slice(0, 200).replace(/"/g, '"')}"
slug: ${slug}
model: Midjourney
category: realistic
tags:
- AI绘图
- 提示词
difficulty: intermediate
cover: ${localImagePath}
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
  
  const id = extractTweetId(tweetUrl);
  if (!id) {
    console.log('❌ 无法从 URL 提取推文 ID');
    process.exit(1);
  }
  
  // 使用 Camofox 获取
  const tweetData = fetchWithCamofox(tweetUrl);
  
  if (!tweetData) {
    console.log('\n❌ 获取失败。可能原因:');
    console.log('   - 推文被删除或设为私密');
    console.log('   - Camofox 服务不可用');
    console.log('   - 推文 ID 格式不正确');
    process.exit(1);
  }
  
  console.log('✅ 成功获取推文\n');
  console.log('📊 推文信息:\n');
  console.log(`作者: ${tweetData.author} (@${tweetData.authorHandle})`);
  console.log(`时间: ${tweetData.timestamp}`);
  console.log(`ID: ${tweetData.id}`);
  console.log(`图片: ${tweetData.mediaUrls.length} 张`);
  
  console.log('\n📝 内容预览:');
  console.log(`   ${tweetData.content.slice(0, 500)}${tweetData.content.length > 500 ? '...' : ''}`);
  
  if (tweetData.replyContent) {
    console.log('\n💬 回复内容:');
    console.log(`   ${tweetData.replyContent.slice(0, 500)}${tweetData.replyContent.length > 500 ? '...' : ''}`);
  }
  
  if (tweetData.mediaUrls.length > 0) {
    console.log('\n🖼️  图片:');
    tweetData.mediaUrls.forEach((url, i) => console.log(`   ${i+1}. ${url}`));
    
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
}

main().catch(console.error);
