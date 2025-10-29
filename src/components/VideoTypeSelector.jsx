import React, { useState, useEffect } from 'react'
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
    <div className={`video-type-selector ${isExpanded ? 'expanded' : ''}`}>
      <div 
        className="selector-header"
        onClick={() => setIsExpanded(!isExpanded)}
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
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
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

      {/* 背景遮罩 */}
      {isExpanded && (
        <div 
          className="selector-backdrop"
          onClick={(e) => {
            // 阻止所有事件传播，确保不影响视频播放器
            e.stopPropagation()
            e.preventDefault()
            e.nativeEvent?.stopImmediatePropagation?.()
            setIsExpanded(false)
          }}
          onTouchEnd={(e) => {
            // 阻止所有事件传播，确保不影响视频播放器
            e.stopPropagation()
            e.preventDefault()
            e.nativeEvent?.stopImmediatePropagation?.()
            setIsExpanded(false)
          }}
          onTouchStart={(e) => {
            // 阻止触摸开始事件传播
            e.stopPropagation()
            e.preventDefault()
          }}
          onTouchMove={(e) => {
            // 阻止触摸移动事件传播
            e.stopPropagation()
            e.preventDefault()
          }}
        />
      )}
    </div>
  )
}

export default VideoTypeSelector
