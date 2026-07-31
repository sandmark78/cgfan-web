#!/usr/bin/env node
/**
 * 测试邮件解析（不发送）
 */

async function testParse() {
  const response = await fetch('https://raw.githubusercontent.com/sandmark78/cgfan-web/main/lib/daily-feature.ts')
  const content = await response.text()
  
  const today = new Date().toISOString().split('T')[0]
  const todayBlockMatch = content.match(new RegExp(`date:\\s*'${today}'[\\s\\S]*?^\\s{2}\\}`, 'm'))
  
  if (!todayBlockMatch) {
    console.log('❌ No block found for', today)
    return
  }
  
  const block = todayBlockMatch[0]
  const extractField = (field) => {
    const m = block.match(new RegExp(`${field}:\\s*(?:'([^']*)'|"([^"]*)")`))
    return m ? (m[1] ?? m[2]) : null
  }
  
  const slug = extractField('slug')
  const curatorNote = extractField('curatorNote')
  const highlight = extractField('highlight')
  const tip = extractField('tip')
  
  console.log('✅ Parsed successfully:')
  console.log('  slug:', slug)
  console.log('  highlight:', highlight)
  console.log('  tip:', tip?.substring(0, 60) + '...')
  console.log('  curatorNote:', curatorNote?.substring(0, 60) + '...')
}

testParse().catch(console.error)
