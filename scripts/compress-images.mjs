#!/usr/bin/env node
/**
 * 批量压缩图片（保持原格式和文件名）
 * - 最大宽度 1200px（保持比例）
 * - JPG: quality 82
 * - PNG: quality 80, palette mode
 * - 覆盖原文件
 * 
 * 用法：
 *   node scripts/compress-images.mjs              # 压缩所有 >500KB 的图片
 *   node scripts/compress-images.mjs --dry-run    # 只统计不压缩
 *   node scripts/compress-images.mjs --top 10     # 只压缩前 N 张最大的
 */

import sharp from 'sharp'
import { readdir, stat, copyFile, unlink } from 'fs/promises'
import { join, extname } from 'path'

const IMAGES_DIR = 'public/images/prompts'
const MIN_SIZE_KB = 500
const MAX_WIDTH = 1200

async function getImages() {
  const files = await readdir(IMAGES_DIR)
  const images = []
  
  for (const file of files) {
    const ext = extname(file).toLowerCase()
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue
    
    const filePath = join(IMAGES_DIR, file)
    const stats = await stat(filePath)
    if (stats.size > MIN_SIZE_KB * 1024) {
      images.push({ path: filePath, size: stats.size, name: file, ext })
    }
  }
  
  return images.sort((a, b) => b.size - a.size)
}

async function compressImage(img) {
  const originalSize = img.size
  const tmpPath = img.path + '.tmp'
  
  try {
    let pipeline = sharp(img.path).resize({ width: MAX_WIDTH, withoutEnlargement: true })
    
    if (img.ext === '.jpg' || img.ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true })
    } else if (img.ext === '.png') {
      pipeline = pipeline.png({ quality: 80, compressionLevel: 9 })
    } else if (img.ext === '.webp') {
      pipeline = pipeline.webp({ quality: 82 })
    }
    
    await pipeline.toFile(tmpPath)
    
    const newStats = await stat(tmpPath)
    const newSize = newStats.size
    
    // 只有压缩后更小才替换
    if (newSize < originalSize) {
      await copyFile(tmpPath, img.path)
      await unlink(tmpPath)
    } else {
      await unlink(tmpPath)
      return { name: img.name, skipped: true, original: (originalSize / 1024 / 1024).toFixed(2) }
    }
    
    const saved = originalSize - newSize
    const savedPercent = ((saved / originalSize) * 100).toFixed(1)
    
    return {
      name: img.name,
      original: (originalSize / 1024 / 1024).toFixed(2),
      compressed: (newSize / 1024 / 1024).toFixed(2),
      saved: (saved / 1024 / 1024).toFixed(2),
      percent: savedPercent,
    }
  } catch (error) {
    console.error(`❌ Failed: ${img.name}`, error.message)
    try { await unlink(tmpPath) } catch {}
    return null
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const topIdx = args.indexOf('--top')
  const topN = topIdx !== -1 ? parseInt(args[topIdx + 1]) : null
  
  console.log('🔍 Scanning images...')
  const images = await getImages()
  
  if (images.length === 0) {
    console.log('✅ No images need compression')
    return
  }
  
  const totalSize = images.reduce((sum, img) => sum + img.size, 0)
  console.log(`\n📊 Found ${images.length} images >${MIN_SIZE_KB}KB`)
  console.log(`📦 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`)
  
  if (dryRun) {
    console.log('Top 20 largest:')
    images.slice(0, 20).forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.name} (${(img.size / 1024 / 1024).toFixed(2)} MB)`)
    })
    return
  }
  
  const toProcess = topN ? images.slice(0, topN) : images
  console.log(`🗜️  Compressing ${toProcess.length} images...\n`)
  
  const results = []
  for (const img of toProcess) {
    const result = await compressImage(img)
    if (result) {
      results.push(result)
      if (result.skipped) {
        console.log(`⊘ ${result.name}: ${result.original}MB (already optimal)`)
      } else {
        console.log(`✓ ${result.name}: ${result.original}MB → ${result.compressed}MB (-${result.saved}MB, ${result.percent}%)`)
      }
    }
  }
  
  const compressed = results.filter(r => !r.skipped)
  const totalSaved = compressed.reduce((sum, r) => sum + parseFloat(r.saved), 0)
  console.log(`\n✅ Done! Compressed ${compressed.length}/${toProcess.length} images, saved ${totalSaved.toFixed(2)} MB`)
}

main().catch(console.error)
