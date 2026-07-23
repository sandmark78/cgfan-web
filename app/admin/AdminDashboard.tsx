'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface Prompt {
  slug: string
  title: string
  prompt: string
  negative_prompt?: string
  model: string
  category: string
  tags: string[]
  difficulty: string
  cover: string
  date: string
  source?: string
  author?: string
  parameters?: Record<string, string>
}

export default function AdminDashboard({ 
  user, 
  initialPrompts,
  hasGithubToken 
}: { 
  user: User
  initialPrompts: Prompt[]
  hasGithubToken: boolean
}) {
  const [prompts] = useState<Prompt[]>(initialPrompts)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleDelete = async (slug: string) => {
    if (!confirm('确定要删除这个提示词吗？')) return

    try {
      const res = await fetch(`/api/admin/prompts?slug=${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setShowForm(true)
  }

  const handleSave = async (prompt: Partial<Prompt>) => {
    try {
      const method = prompt.slug && editingPrompt ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/prompts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(prompt),
      })

      if (res.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">后台管理</h1>
          <p className="text-gray-600 mt-1">欢迎，{user.email}</p>
          {!hasGithubToken && (
            <p className="text-red-600 mt-2">⚠️ GITHUB_TOKEN 未配置，无法管理提示词</p>
          )}
        </div>
        {hasGithubToken && (
          <button
            onClick={() => {
              setEditingPrompt(null)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + 新建提示词
          </button>
        )}
      </div>

      {showForm && (
        <PromptForm
          prompt={editingPrompt}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingPrompt(null)
          }}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prompts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {hasGithubToken ? '暂无提示词' : '请先配置 GITHUB_TOKEN 环境变量'}
                </td>
              </tr>
            ) : (
              prompts.map((prompt) => (
                <tr key={prompt.slug}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {prompt.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prompt.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prompt.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(prompt.date).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.slug)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PromptForm({
  prompt,
  onSave,
  onCancel,
}: {
  prompt: Prompt | null
  onSave: (prompt: Partial<Prompt>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<Prompt>>(
    prompt || {
      title: '',
      slug: '',
      prompt: '',
      negative_prompt: '',
      model: '',
      category: '',
      tags: [],
      difficulty: 'intermediate',
      cover: '',
      date: new Date().toISOString().split('T')[0],
      source: '',
      author: '',
      parameters: {},
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {prompt ? '编辑提示词' : '新建提示词'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={!!prompt}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                提示词内容
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                负面提示词
              </label>
              <textarea
                value={formData.negative_prompt || ''}
                onChange={(e) => setFormData({ ...formData, negative_prompt: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模型
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签（逗号分隔）
              </label>
              <input
                type="text"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  难度
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="beginner">入门</option>
                  <option value="intermediate">进阶</option>
                  <option value="advanced">高级</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日期
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                封面图片 URL
              </label>
              <input
                type="text"
                value={formData.cover}
                onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  来源
                </label>
                <input
                  type="text"
                  value={formData.source || ''}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作者
                </label>
                <input
                  type="text"
                  value={formData.author || ''}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
