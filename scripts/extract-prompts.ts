#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 模型识别规则（优先级从高到低）
const MODEL_PATTERNS: Record<string, RegExp[]> = {
  'Gemini': [/gemini/i, /google\s*ai/i, /nano\s*banana/i],
  'Grok': [/grok/i, /xAI/i],
  'Seedream': [/seedream/i, /seed\s*ream/i],
  'DALL-E': [/dall-e/i, /dalle/i, /openai/i],
  'Stable Diffusion': [/stable\s*diffusion/i, /sd\s*xl/i, /sdxl/i, /comfyui/i],
  'Flux': [/flux/i, /black\s*forest/i],
  'Ideogram': [/ideogram/i],
  'Leonardo': [/leonardo/i],
  'Adobe Firefly': [/firefly/i, /adobe/i],
  'Midjourney': [/midjourney/i, /mj\s*v?\d/i, /niji\s*\d/i, /\/imagine/i],
  'GPT-image2': [/gpt[\s-]*image[\s-]*2/i, /gpt[\s-]*image2/i, /chatgpt/i, /gpt-4/i, /gpt4/i],
};

// 难度判断规则
const DIFFICULTY_KEYWORDS = {
  advanced: [
    /参数/i, /parameter/i, /权重/i, /weight/i, /cfg/i,
    /controlnet/i, /ip-adapter/i, /workflow/i, /复杂/i,
    /advanced/i, /高级/i, /专业/i, /expert/i, /--ar/i,
    /--v/i, /--s/i, /--c/i, /--q/i, /--style/i,
    /公式/i, /formula/i, /技巧/i, /technique/i
  ],
  intermediate: [
    /提示词/i, /prompt/i, /风格/i, /style/i,
    /方法/i, /method/i, /教程/i, /tutorial/i,
    /步骤/i, /step/i
  ],
  beginner: [
    /简单/i, /simple/i, /基础/i, /basic/i, /入门/i,
    /beginner/i, /新手/i, /快速/i, /quick/i, /一键/i
  ]
};

// 标签提取关键词（中英文）
const TAG_KEYWORDS: Record<string, RegExp[]> = {
  '3D渲染': [/3d/i, /c4d/i, /octane/i, /render/i, /渲染/i, /三维/i],
  '国风': [/国风/i, /中国风/i, /东方/i, /chinese/i, /oriental/i, /汉服/i, /hanfu/i, /古风/i],
  '赛博朋克': [/赛博朋克/i, /cyberpunk/i, /cyber/i],
  '写实': [/写实/i, /realistic/i, /photorealistic/i, /真实/i, /照片级/i],
  '动漫': [/动漫/i, /anime/i, /manga/i, /二次元/i, /卡通/i],
  '油画': [/油画/i, /oil\s*painting/i, /classical/i, /古典/i],
  '摄影': [/摄影/i, /photography/i, /photo/i, /镜头/i, /camera/i],
  '抽象': [/抽象/i, /abstract/i],
  '人物': [/人物/i, /portrait/i, /character/i, /角色/i, /人像/i],
  '风景': [/风景/i, /landscape/i, /scenery/i, /自然/i],
  '建筑': [/建筑/i, /architecture/i, /building/i],
  '产品': [/产品/i, /product/i, /商品/i, /商业/i],
  '概念艺术': [/概念/i, /concept/i, /概念艺术/i],
  '科幻': [/科幻/i, /sci-fi/i, /science\s*fiction/i, /未来/i, /futuristic/i],
  '奇幻': [/奇幻/i, /fantasy/i, /魔幻/i, /magical/i],
  '恐怖': [/恐怖/i, /horror/i, /惊悚/i],
  '可爱': [/可爱/i, /cute/i, /kawaii/i, /萌/i, /卡通/i],
  '复古': [/复古/i, /retro/i, /vintage/i, /怀旧/i],
  '极简': [/极简/i, /minimal/i, /minimalist/i, /简约/i],
  '超现实': [/超现实/i, /surreal/i, /surrealism/i],
  '蒸汽朋克': [/蒸汽朋克/i, /steampunk/i],
  'AI艺术': [/ai\s*art/i, /ai\s*艺术/i, /人工智能/i],
  '电影感': [/电影/i, /cinematic/i, /cinema/i, /film/i],
  '分焦镜头': [/分焦/i, /split\s*diopter/i, /双焦/i],
};

// 需要移除的占位符标签
const PLACEHOLDER_TAGS = ['待处理', 'todo', 'placeholder', 'TODO', '待整理'];

function detectModel(content: string, frontmatterModel: string = ''): string {
  const contentLower = content.toLowerCase();
  
  // 优先从正文内容中检测（按优先级）
  for (const [model, patterns] of Object.entries(MODEL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(contentLower)) {
        return model;
      }
    }
  }
  
  // 正文没检测到，才用 frontmatter
  if (frontmatterModel) {
    for (const [model, patterns] of Object.entries(MODEL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(frontmatterModel)) {
          return model;
        }
      }
    }
    return frontmatterModel;
  }
  
  return 'Common';
}

function detectDifficulty(content: string): string {
  const contentLower = content.toLowerCase();
  const scores: Record<string, number> = { beginner: 0, intermediate: 0, advanced: 0 };
  
  for (const [difficulty, keywords] of Object.entries(DIFFICULTY_KEYWORDS)) {
    for (const keyword of keywords) {
      const matches = contentLower.match(new RegExp(keyword, 'gi'));
      if (matches) {
        scores[difficulty] += matches.length;
      }
    }
  }
  
  // 根据内容长度调整难度
  const len = content.length;
  if (len < 200) {
    scores.beginner += 3;      // 短提示词 → 入门
  } else if (len < 600) {
    scores.intermediate += 2;  // 中等长度 → 进阶
  } else if (len > 1200) {
    scores.advanced += 3;      // 超长提示词 → 高级
  } else if (len > 600) {
    scores.intermediate += 1;  // 较长 → 进阶
  }
  
  // 返回得分最高的难度
  const maxDifficulty = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  
  // 如果得分都很低，根据内容长度决定
  if (scores[maxDifficulty] === 0) {
    return len < 300 ? 'beginner' : len > 1000 ? 'advanced' : 'intermediate';
  }
  
  return maxDifficulty;
}

function extractTags(content: string, existingTags: string[]): string[] {
  // 过滤掉占位符标签
  const validTags = existingTags.filter(tag => !PLACEHOLDER_TAGS.includes(tag));
  
  // 从内容中提取标签
  const contentLower = content.toLowerCase();
  const extractedTags: string[] = [];
  
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      if (keyword.test(contentLower)) {
        if (!validTags.includes(tag) && !extractedTags.includes(tag)) {
          extractedTags.push(tag);
        }
        break;
      }
    }
  }
  
  // 合并标签，最多保留 5 个
  const allTags = [...validTags, ...extractedTags];
  return Array.from(new Set(allTags)).slice(0, 5);
}

function cleanPrompt(content: string): string {
  if (!content || ['Prompt:', '提示词:', ''].includes(content.trim())) {
    return '';
  }
  
  // 移除常见的多余文字模式
  const patternsToRemove = [
    /^(Prompt:|提示词:)\s*/i,
    /(复制即用|一键出图|咒语)[：:]\s*/i,
    /\/imagine\s+prompt:\s*/i,
  ];
  
  let cleaned = content.trim();
  
  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.trim();
}

function normalizeDate(dateValue: any): string {
  if (!dateValue) return '';
  
  // 如果是 Date 对象，检查是否有非零时间分量（表示是精确时间戳）
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    const hours = dateValue.getUTCHours();
    const minutes = dateValue.getUTCMinutes();
    const seconds = dateValue.getUTCSeconds();
    // 如果有时分秒分量（非全部为0），说明原本是 ISO 时间戳，保留完整 ISO
    if (hours !== 0 || minutes !== 0 || seconds !== 0) {
      // 使用 +08:00 时区输出，避免 toISOString() 转 UTC 导致排序混乱
      const pad = (n: number) => String(n).padStart(2, '0');
      const y = dateValue.getFullYear();
      const m = pad(dateValue.getMonth() + 1);
      const d = pad(dateValue.getDate());
      const hh = pad(dateValue.getHours());
      const mm = pad(dateValue.getMinutes());
      const ss = pad(dateValue.getSeconds());
      return `${y}-${m}-${d}T${hh}:${mm}:${ss}+08:00`;
    }
    // 全部为0，说明原本只是日期，只输出 YYYY-MM-DD
    return dateValue.toISOString().split('T')[0];
  }
  
  // 如果是 ISO 8601 时间戳字符串（含 T 和时区），直接保留
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateValue)) {
    return dateValue;
  }
  
  // 如果已经是 YYYY-MM-DD 格式
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // 如果是字符串但可以解析为日期
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // 忽略错误
  }
  
  // 如果无法解析，返回原值
  return String(dateValue);
}

interface PromptData {
  title: string;
  slug: string;
  model: string;
  category: string;
  tags: string[];
  difficulty: string;
  cover: string;
  images: string[];
  date: string;
  added: string; // 上传日期，用于排序
  source: string;
  sourceLink: string;
  author: string;
  authorLink?: string;
  prompt: string;
  negativePrompt: string;
  parameters: Record<string, string>;
  rating?: {
    composition: number;
    color: number;
    lighting: number;
    detail: number;
    creativity: number;
    technical: number;
    aesthetic: number;
    curation: number;
    total: number;
  };
}

function parseMarkdownFile(filePath: string): PromptData | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);
    
    // 提取各个部分
    const sections: Record<string, string> = {};
    let currentSection = '';
    let currentContent: string[] = [];
    
    for (const line of body.split('\n')) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.slice(3).trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
    
    // 提取提示词 - 优先使用 ## Prompt 章节，否则使用整个正文
    let promptText = sections['Prompt'] || '';
    const negativePrompt = sections['Negative Prompt'] || '';
    
    // 如果没有 ## Prompt 章节，使用整个正文作为提示词
    if (!promptText) {
      // 检查是否有类似 "## Prompt 1:" 的章节
      const promptSections = Object.keys(sections).filter(k => k.toLowerCase().startsWith('prompt'));
      if (promptSections.length > 0) {
        promptText = promptSections.map(k => sections[k]).join('\n\n');
      } else {
        promptText = body.trim();
      }
    }
    
    // 清理提示词
    const cleanedPrompt = cleanPrompt(promptText);
    
    // 如果清理后为空或太短（少于50字符），跳过这个文件
    if (!cleanedPrompt || cleanedPrompt.length < 50) {
      return null;
    }
    
    // 智能识别模型
    const detectedModel = detectModel(body, frontmatter.model || '');
    
    // 判断难度
    const detectedDifficulty = detectDifficulty(body);
    
    // 提取标签
    const existingTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags || ''];
    const extractedTags = extractTags(body, existingTags);
    
    // 提取参数
    const parameters: Record<string, string> = {};
    if (sections['Parameters']) {
      const paramText = sections['Parameters'];
      for (const line of paramText.split('\n')) {
        if (line.includes('|') && !line.trim().startsWith('|---')) {
          const parts = line.split('|').map(p => p.trim()).filter(p => p);
          if (parts.length === 2 && !['Setting', '参数'].includes(parts[0])) {
            parameters[parts[0]] = parts[1];
          }
        }
      }
    }
    
    // 读取评分字段
    const rating = frontmatter.rating ? {
      composition: Number(frontmatter.rating.composition) || 0,
      color: Number(frontmatter.rating.color) || 0,
      lighting: Number(frontmatter.rating.lighting) || 0,
      detail: Number(frontmatter.rating.detail) || 0,
      creativity: Number(frontmatter.rating.creativity) || 0,
      technical: Number(frontmatter.rating.technical) || 0,
      aesthetic: Number(frontmatter.rating.aesthetic) || 0,
      curation: Number(frontmatter.rating.curation) || 0,
      total: Number(frontmatter.rating.total) || 0
    } : undefined;

    return {
      title: frontmatter.title || '',
      slug: frontmatter.slug || path.basename(filePath, '.md'), // fallback 用文件名
      model: detectedModel,
      category: frontmatter.category || 'uncategorized',
      tags: extractedTags,
      difficulty: detectedDifficulty,
      cover: frontmatter.cover || '',
      images: Array.isArray(frontmatter.images) ? frontmatter.images : (frontmatter.cover ? [frontmatter.cover] : []),
      date: String(frontmatter.date || ''),
      added: normalizeDate(frontmatter.added || frontmatter.date || ''), // 保留原始时间戳或纯日期
      source: frontmatter.source || '',
      sourceLink: frontmatter.sourceLink || (frontmatter.source && frontmatter.source.startsWith('http') ? frontmatter.source : ''),
      author: frontmatter.author || 'Unknown',
      authorLink: frontmatter.authorLink || '',
      prompt: cleanedPrompt,
      negativePrompt: negativePrompt && negativePrompt !== '(none provided)' ? negativePrompt : '',
      parameters,
      rating
    };
  } catch (error) {
    console.error(`❌ 处理失败 ${path.basename(filePath)}:`, error);
    return null;
  }
}

async function main() {
  const contentDir = path.join(process.cwd(), 'content/prompts');
  
  const allPrompts: PromptData[] = [];
  let skippedCount = 0;
  
  // 遍历所有 markdown 文件
  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.md')) {
        const promptData = parseMarkdownFile(filePath);
        if (promptData) {
          // 添加文件修改时间用于排序
          (promptData as any).mtime = stat.mtimeMs;
          // 如果 added 是纯日期（无时间分量），用固定正午时间补全，保留日期语义
          if (promptData.added && /^\d{4}-\d{2}-\d{2}$/.test(promptData.added)) {
            promptData.added = `${promptData.added}T12:00:00.000+08:00`;
          }
          allPrompts.push(promptData);
        } else {
          skippedCount++;
        }
      }
    }
  }
  
  walkDir(contentDir);
  
  // 按上传时间升序排列（最早上传在前，最新上传在后）
  // 优先使用 added 字段（含 ISO 时间戳），否则 fallback 到 mtime
  allPrompts.sort((a, b) => {
    const addedA = a.added || '';
    const addedB = b.added || '';
    
    // 如果 added 含 ISO 时间戳（带 T），精确排序
    const hasTimeA = addedA.includes('T');
    const hasTimeB = addedB.includes('T');
    
    if (hasTimeA && hasTimeB) {
      // 都有 ISO 时间戳 → 按时间排序
      return addedA.localeCompare(addedB);
    } else if (hasTimeA && !hasTimeB) {
      // A 有精确时间 → A 排在 B 后面（B 是同一天，先显示）
      return 1;
    } else if (!hasTimeA && hasTimeB) {
      // B 有精确时间 → B 排在 A 后面
      return -1;
    } else {
      // 都没有精确时间 → 用 mtime 排序
      const mtimeA = (a as any).mtime || 0;
      const mtimeB = (b as any).mtime || 0;
      return mtimeA - mtimeB;
    }
  });
  
  // 同步到 Supabase
  console.log('🔄 正在同步到 Supabase...');
  const { upsertPrompts } = await import('./supabase-utils');
  const upsertedCount = await upsertPrompts(allPrompts);
  
  console.log(`✅ 提取完成：${allPrompts.length} 条提示词已同步到 Supabase（成功 ${upsertedCount} 条）`);
  
  // 统计信息
  const modelStats: Record<string, number> = {};
  const difficultyStats: Record<string, number> = {};
  
  for (const prompt of allPrompts) {
    modelStats[prompt.model] = (modelStats[prompt.model] || 0) + 1;
    difficultyStats[prompt.difficulty] = (difficultyStats[prompt.difficulty] || 0) + 1;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 数据提取完成！');
  console.log('='.repeat(60));
  console.log(`📊 总计: ${allPrompts.length} 条提示词`);
  console.log(`⚠️  跳过: ${skippedCount} 个文件（空内容或格式错误）`);
  console.log('\n🤖 模型分布:');
  Object.entries(modelStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([model, count]) => console.log(`   ${model}: ${count}`));
  console.log('\n📈 难度分布:');
  Object.entries(difficultyStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([difficulty, count]) => console.log(`   ${difficulty}: ${count}`));
  console.log('='.repeat(60));
}

main();
