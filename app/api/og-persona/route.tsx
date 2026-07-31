import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const personaName = searchParams.get('name') || '美学探索者'
    const nickname = searchParams.get('nickname') || ''
    const rarity = searchParams.get('rarity') || 'common'
    const traits = searchParams.get('traits') || '好奇,探索,开放'

    // 稀有度颜色
    const rarityColors = {
      common: 'from-gray-400 to-gray-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-amber-400 to-amber-600',
    }

    const gradientClass = rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common

    // 稀有度标签
    const rarityLabels = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
    }

    const rarityLabel = rarityLabels[rarity as keyof typeof rarityLabels] || '普通'

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '60px',
          }}
        >
          {/* 背景装饰 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />

          {/* 内容 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            {/* Logo */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '40px',
                letterSpacing: '4px',
              }}
            >
              CGFAN · 美学人格
            </div>

            {/* 人格名称 */}
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {personaName}
            </div>

            {/* 昵称 */}
            {nickname && (
              <div
                style={{
                  fontSize: '28px',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '30px',
                  fontStyle: 'italic',
                }}
              >
                「{nickname}」
              </div>
            )}

            {/* 稀有度徽章 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                padding: '12px 24px',
                borderRadius: '9999px',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: gradientClass.includes('amber') ? '#fbbf24' : 
                              gradientClass.includes('purple') ? '#a78bfa' :
                              gradientClass.includes('blue') ? '#60a5fa' : '#9ca3af',
                }}
              />
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'white',
                }}
              >
                {rarityLabel}人格
              </span>
            </div>

            {/* 核心特质 */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {traits.split(',').map((trait, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    color: 'white',
                    fontWeight: '500',
                  }}
                >
                  #{trait.trim()}
                </div>
              ))}
            </div>

            {/* 底部 CTA */}
            <div
              style={{
                marginTop: '50px',
                fontSize: '18px',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              来 CGfan 发现你的美学人格 →
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
