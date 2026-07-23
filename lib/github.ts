// GitHub API 工具函数
const GITHUB_API = 'https://api.github.com'
const REPO = 'sandmark78/cgfan-web'
const BRANCH = 'main'

interface GitHubFile {
  name: string
  path: string
  sha: string
  type?: string
  content?: string
}

/**
 * 获取 GitHub 文件内容
 */
async function getGitHubFile(path: string): Promise<{ content: string; sha: string } | null> {
  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  
  return { content, sha: data.sha }
}

/**
 * 创建或更新 GitHub 文件
 */
async function putGitHubFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<boolean> {
  const body: any = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: BRANCH,
  }

  if (sha) {
    body.sha = sha
  }

  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return response.ok
}

/**
 * 删除 GitHub 文件
 */
async function deleteGitHubFile(path: string, sha: string, message: string): Promise<boolean> {
  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sha,
      branch: BRANCH,
    }),
  })

  return response.ok
}

/**
 * 列出目录中的文件
 */
async function listGitHubDirectory(path: string): Promise<GitHubFile[]> {
  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) return []

  return await response.json()
}

export {
  getGitHubFile,
  putGitHubFile,
  deleteGitHubFile,
  listGitHubDirectory,
}
