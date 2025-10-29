import React, { useState, useEffect, useRef } from 'react'
import './VideoTypeSelector.css'

// 使用本地后端代理
const API_BASE = import.meta.env.MODE === 'production' 
  ? '/api'  // 生产环境使用相对路径
  : '/api'  // 开发环境通过Vite代理到后端

// 视频类型映射（从接口信息中提取）
const VIDEO_TYPES = {
  'random': '随机',
  'dd': '吊带',
  'jpyz': '极品狱卒',
  'my': '慢摇',
  'xjj': '小姐姐',
  'ndxs': '女大学生',
  'dytt': '抖音瞳瞳',
  'hs': '黑丝',
  'bs': '白丝',
  'cd': '穿搭',
  'mz': '漫展',
  'jjy': '鞠婧祎',
  'shwd': '丝滑舞蹈',
  'wmsc': '完美身材',
  'zrn': '章若楠系列',
  'hfgf': '汉服古风',
  'qc': '清纯',
  'cos': 'cos',
  'cqng': '纯情女高',
  'jp': '街拍',
  'ksbz': '快手变装',
  'sbkl': '双倍快乐',
  'll': '萝莉',
  'ym': '欲梦',
  'tm': '甜妹',
  'jkllt': 'JK洛丽塔',
  'yzmt': '玉足美腿',
  'rw': '热舞',
  'mhy': '漫画芋',
  'dybz': '抖音变装',
  'xjj-r': '小姐姐随机',
}

const VideoTypeSelector = ({ selectedType, onTypeChange }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [availableTypes, setAvailableTypes] = useState({})
  const [isScrolling, setIsScrolling] = useState(false)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
  const selectorRef = useRef(null)
  const backdropRef = useRef(null)

  // 尝试从API获取类型列表
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch(`${API_BASE}/types`)
        const data = await response.json()
        if (data && typeof data === 'object') {
          setAvailableTypes(data)
        }
      } catch (error) {
        console.log('无法获取类型列表，使用默认列表')
        setAvailableTypes(VIDEO_TYPES)
      }
    }
    fetchTypes()
  }, [])

  // 全局点击监听：当面板展开时，点击外部区域关闭面板
  useEffect(() => {
    if (!isExpanded) return

    const handleDocumentClick = (e) => {
      // 如果正在滚动，不处理
      if (isScrolling) {
        return
      }
      
      if (!selectorRef.current) return
      
      // 检查点击是否在header或dropdown内，如果是则不处理，让事件继续传播
      const header = selectorRef.current.querySelector('.selector-header')
      const dropdown = selectorRef.current.querySelector('.selector-dropdown')
      if (header && header.contains(e.target)) {
        return // header点击由自己的onClick处理
      }
      if (dropdown && dropdown.contains(e.target)) {
        return // dropdown内的点击不关闭
      }
      
      // 检查点击是否在选择器内部的其他地方（比如遮罩）
      let shouldClose = false
      if (selectorRef.current.contains(e.target)) {
        // 如果点击的是遮罩区域，应该关闭
        if (backdropRef.current && (e.target === backdropRef.current || backdropRef.current.contains(e.target))) {
          shouldClose = true
        } else {
          return // 点击在选择器内部但不是遮罩，不处理
        }
      } else {
        // 点击在选择器外部，关闭面板
        shouldClose = true
      }
      
      if (shouldClose) {
        setIsExpanded(false)
        // 如果点击在视频播放器区域，阻止事件传播，避免触发播放/暂停
        const videoContainer = e.target.closest('.video-player-container')
        if (videoContainer) {
          e.stopPropagation()
          e.preventDefault()
          e.stopImmediatePropagation()
        }
      }
    }

    const handleDocumentTouchEnd = (e) => {
      // 如果正在滚动，不处理
      if (isScrolling) {
        return
      }
      
      if (!selectorRef.current) return
      
      // 检查触摸是否在header或dropdown内，如果是则不处理，让事件继续传播
      const header = selectorRef.current.querySelector('.selector-header')
      const dropdown = selectorRef.current.querySelector('.selector-dropdown')
      if (header && header.contains(e.target)) {
        return // header触摸由自己的处理
      }
      if (dropdown && dropdown.contains(e.target)) {
        return // dropdown内的触摸不关闭
      }
      
      // 检查触摸是否在选择器内部的其他地方（比如遮罩）
      let shouldClose = false
      if (selectorRef.current.contains(e.target)) {
        // 如果触摸的是遮罩区域，应该关闭
        if (backdropRef.current && (e.target === backdropRef.current || backdropRef.current.contains(e.target))) {
          shouldClose = true
        } else {
          return // 触摸在选择器内部但不是遮罩，不处理
        }
      } else {
        // 触摸在选择器外部，关闭面板
        shouldClose = true
      }
      
      if (shouldClose) {
        setIsExpanded(false)
        // 如果触摸在视频播放器区域，阻止事件传播，避免触发播放/暂停
        const videoContainer = e.target.closest('.video-player-container')
        if (videoContainer) {
          e.stopPropagation()
          e.preventDefault()
          e.stopImmediatePropagation()
        }
      }
    }

    // 延迟添加监听，避免立即触发关闭
    // 使用捕获阶段，先拦截事件，防止传播到视频播放器
    const timer = setTimeout(() => {
      document.addEventListener('click', handleDocumentClick, true)
      document.addEventListener('touchend', handleDocumentTouchEnd, true)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleDocumentClick, true)
      document.removeEventListener('touchend', handleDocumentTouchEnd, true)
    }
  }, [isExpanded, isScrolling])

  // 合并API返回的类型和默认类型
  const allTypes = { ...VIDEO_TYPES, ...availableTypes }

  const handleTypeSelect = (type) => {
    const typeLabel = type === null ? '随机' : (allTypes[type] || type)
    const currentLabel = selectedType === null ? '随机' : (allTypes[selectedType] || selectedType)
    console.log('选择视频类型 - 点击类型:', typeLabel, '类型值:', type, '当前类型:', currentLabel, '当前值:', selectedType)
    // 直接切换到选中的类型，不再支持取消选择（点击已选中项时切换到随机）
    if (type === selectedType && type !== null) {
      // 如果再次点击已选中的类型，切换到随机
      console.log('切换到随机模式 (null)')
      onTypeChange(null)
    } else {
      // 切换到新选择的类型
      console.log('切换到新类型，调用 onTypeChange，类型值:', type, '类型名称:', typeLabel)
      onTypeChange(type)
    }
    setIsExpanded(false)
  }

  const selectedLabel = selectedType ? (allTypes[selectedType] || selectedType) : '随机'

  return (
    <div 
      ref={selectorRef}
      className={`video-type-selector ${isExpanded ? 'expanded' : ''}`}
    >
      <div 
        className="selector-header"
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
      >
        <div className="selector-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 2L2 7L12 12L22 7L12 2Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M2 17L12 22L22 17" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M2 12L12 17L22 12" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="selector-label">{selectedLabel}</span>
        <div className={`selector-arrow ${isExpanded ? 'rotated' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M6 9L12 15L18 9" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div 
        className="selector-dropdown"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
          // 记录触摸开始位置和时间
          const touch = e.touches[0]
          touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
          }
          setIsScrolling(false)
        }}
        onTouchMove={(e) => {
          e.stopPropagation()
          // 检测是否有明显移动（超过10px视为滚动）
          const touch = e.touches[0]
          const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
          const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
          if (deltaX > 10 || deltaY > 10) {
            setIsScrolling(true)
          }
        }}
        onTouchEnd={(e) => {
          e.stopPropagation()
          // 延迟重置滚动状态，确保遮罩的 onTouchEnd 能看到这个状态
          setTimeout(() => {
            setIsScrolling(false)
          }, 100)
        }}
      >
        <div className="type-list">
          <div 
            className={`type-item ${selectedType === null ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              console.log('点击随机选项')
              handleTypeSelect(null)
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
              // 如果正在滚动，不触发选择
              if (isScrolling) {
                return
              }
              console.log('触摸随机选项')
              handleTypeSelect(null)
            }}
          >
            <span className="type-name">随机</span>
            {selectedType === null && (
              <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M20 6L9 17L4 12" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          
          {Object.entries(allTypes).map(([key, label]) => (
            key !== 'random' && (
              <div
                key={key}
                className={`type-item ${selectedType === key ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  console.log('点击类型选项:', label, key)
                  handleTypeSelect(key)
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  // 如果正在滚动，不触发选择
                  if (isScrolling) {
                    return
                  }
                  console.log('触摸类型选项:', label, key)
                  handleTypeSelect(key)
                }}
              >
                <span className="type-name">{label}</span>
                {selectedType === key && (
                  <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M20 6L9 17L4 12" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            )
          ))}
        </div>
      </div>

      {/* 背景遮罩 - 使用全局事件监听器处理点击关闭，这里只需要样式 */}
      {isExpanded && (
        <div 
          ref={backdropRef}
          className="selector-backdrop"
        />
      )}
    </div>
  )
}

export default VideoTypeSelector
