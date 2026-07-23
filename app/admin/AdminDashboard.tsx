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

const PAGE_SIZE = 20

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
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  // 搜索过滤
  const filteredPrompts = prompts.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.title.toLowerCase().includes(q) ||
           p.model.toLowerCase().includes(q) ||
           p.category.toLowerCase().includes(q) ||
           p.slug.toLowerCase().includes(q) ||
           p.tags.some(t => t.toLowerCase().includes(q))
  })

  // 分页
  const totalPages = Math.ceil(filteredPrompts.length / PAGE_SIZE)
  const paginatedPrompts = filteredPrompts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleDelete = async (slug: string) => {
    if (!confirm('确定要删除这个提示词吗？')) return
    try {
      const res = await fetch(`/api/admin/prompts?slug=${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) window.location.reload()
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
      if (res.ok) window.location.reload()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">后台管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user.email} · 共 {prompts.length} 条提示词
            {!hasGithubToken && <span className="text-red-500"> · ⚠️ GITHUB_TOKEN 未配置</span>}
          </p>
        </div>
        {hasGithubToken && (
          <button
            onClick={() => { setEditingPrompt(null); setShowForm(true) }}
            className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + 新建提示词
          </button>
        )}
      </div>

      {/* 搜索栏 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索标题、模型、分类、标签..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {showForm && (
        <PromptForm
          prompt={editingPrompt}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingPrompt(null) }}
        />
      )}

      {/* 表格 */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[640px] table-fixed">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-[40%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
              <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">模型</th>
              <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
              <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
              <th className="w-[24%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedPrompts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {hasGithubToken ? '暂无提示词' : '请先配置 GITHUB_TOKEN 环境变量'}
                </td>
              </tr>
            ) : (
              paginatedPrompts.map((prompt) => (
                <tr key={prompt.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="truncate text-sm font-medium text-gray-900 dark:text-white" title={prompt.title}>
                      {prompt.title}
                    </div>
                    <div className="truncate text-xs text-gray-400">{prompt.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300" title={prompt.model}>
                      {prompt.model}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate" title={prompt.category}>
                    {prompt.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(prompt.date).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="mr-3 text-sm text-green-600 hover:text-green-800"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.slug)}
                      className="text-sm text-red-600 hover:text-red-800"
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

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            第 {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredPrompts.length)} 条，共 {filteredPrompts.length} 条
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="rounded px-2 py-1 text-sm disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded px-2 py-1 text-sm disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`dots-${i}`} className="px-1 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`rounded px-3 py-1 text-sm ${
                      currentPage === p
                        ? 'bg-green-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded px-2 py-1 text-sm disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded px-2 py-1 text-sm disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              »
            </button>
          </div>
        </div>
      )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white dark:bg-gray-900">
        <div className="p-6">
          <h2 className="mb-6 text-xl font-bold">
            {prompt ? '编辑提示词' : '新建提示词'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                required
                disabled={!!prompt}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">提示词内容</label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">负面提示词</label>
              <textarea
                value={formData.negative_prompt || ''}
                onChange={(e) => setFormData({ ...formData, negative_prompt: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">模型</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">分类</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">标签（逗号分隔）</label>
              <input
                type="text"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">难度</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="beginner">入门</option>
                  <option value="intermediate">进阶</option>
                  <option value="advanced">高级</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">封面图片 URL</label>
              <input
                type="text"
                value={formData.cover}
                onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">来源</label>
                <input
                  type="text"
                  value={formData.source || ''}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">作者</label>
                <input
                  type="text"
                  value={formData.author || ''}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-white"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
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
