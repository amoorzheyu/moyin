import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3000

// 真实的API域名（从环境变量读取，不暴露在前端）
const REAL_API_BASE = process.env.API_BASE_URL || 'undefined'

// 中间件
app.use(cors())
app.use(express.json())

// 静态文件服务（前端构建后的文件，仅在dist目录存在时）
if (existsSync(join(__dirname, 'dist'))) {
  app.use(express.static(join(__dirname, 'dist')))
}

// 代理API请求
app.get('/api/yy', async (req, res) => {
  try {
    const { type } = req.query
    const url = type 
      ? `${REAL_API_BASE}/yy?type=${type}` 
      : `${REAL_API_BASE}/yy`
    
    console.log('代理请求:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('代理请求错误:', error.message)
    res.status(500).json({ 
      success: false, 
      error: '代理请求失败',
      message: error.message 
    })
  }
})

// 获取类型列表
app.get('/api/types', async (req, res) => {
  try {
    const url = `${REAL_API_BASE}/types`
    console.log('代理请求类型列表:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('代理请求错误:', error.message)
    res.status(500).json({ 
      success: false, 
      error: '代理请求失败',
      message: error.message 
    })
  }
})

// 所有其他路由返回前端应用（用于SPA路由，仅在生产环境）
if (existsSync(join(__dirname, 'dist', 'index.html'))) {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log(`真实API地址: ${REAL_API_BASE}`)
})
