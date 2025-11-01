import React, { useState, useEffect, useRef } from 'react'
import VideoPlayer from './components/VideoPlayer'
import VideoTypeSelector from './components/VideoTypeSelector'
import './App.css'

// 使用本地后端代理，不直接暴露真实API地址
const API_BASE = import.meta.env.MODE === 'production' 
  ? '/api'  // 生产环境使用相对路径
  : '/api'  // 开发环境通过Vite代理到后端

function App() {
  const [videos, setVideos] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [showEntranceOverlay, setShowEntranceOverlay] = useState(true)
  const [selectedType, setSelectedType] = useState(null) // null 表示随机
  const [autoPlay, setAutoPlay] = useState(false) // 自动播放开关，默认关闭
  const [showPauseIcon, setShowPauseIcon] = useState(true) // 显示暂停图标开关，默认开启
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' 
    ? (window.visualViewport?.height || window.innerHeight)
    : 0)
  const containerRef = useRef(null)
  const lastSwipeUpTimeRef = useRef(0) // 全局上滑时间记录，所有视频共享
  const [toastMessage, setToastMessage] = useState('') // Toast 提示消息
  const [showToast, setShowToast] = useState(false) // 控制 Toast 显示
  const toastTimerRef = useRef(null) // Toast 自动隐藏定时器

  // 显示 Toast 提示
  const showToastMessage = (message) => {
    // 清除之前的定时器
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    
    setToastMessage(message)
    setShowToast(true)
    
    // 2.5秒后自动隐藏
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false)
    }, 2500)
  }

  // 检测视频是否支持播放（实际尝试播放来验证）
  const checkVideoSupport = (videoUrl) => {
    return new Promise((resolve) => {
      const testVideo = document.createElement('video')
      testVideo.preload = 'auto'
      testVideo.muted = true
      testVideo.playsInline = true
      testVideo.style.display = 'none'
      testVideo.width = 1
      testVideo.height = 1
      document.body.appendChild(testVideo) // 添加到 DOM 以便某些浏览器能正确检测
      
      let resolved = false
      let playTimeout = null
      
      const cleanup = () => {
        if (playTimeout) {
          clearTimeout(playTimeout)
        }
        testVideo.pause()
        testVideo.removeAttribute('src')
        testVideo.load()
        if (testVideo.parentNode) {
          testVideo.parentNode.removeChild(testVideo)
        }
      }

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          cleanup()
          console.warn('视频检测超时:', videoUrl)
          resolve(false) // 超时认为不支持
        }
      }, 5000) // 5秒超时

      // 尝试播放视频验证
      const tryPlayVideo = () => {
        if (resolved) return
        
        const playPromise = testVideo.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // 播放成功，说明视频可以正常播放
              if (!resolved) {
                resolved = true
                clearTimeout(timeout)
                // 播放一小段时间后停止（验证视频真的在播放）
                playTimeout = setTimeout(() => {
                  cleanup()
                  resolve(true) // 视频可以正常播放
                }, 300) // 播放300ms后停止，验证视频确实在播放
              }
            })
            .catch((err) => {
              // 播放失败
              if (!resolved) {
                resolved = true
                clearTimeout(timeout)
                console.warn('视频无法播放:', videoUrl, err.message || err)
                cleanup()
                resolve(false)
              }
            })
        } else {
          // 旧版浏览器，播放立即成功
          if (!resolved) {
            resolved = true
            clearTimeout(timeout)
            playTimeout = setTimeout(() => {
              cleanup()
              resolve(true)
            }, 300)
          }
        }
      }

      // 视频可以播放时的处理
      const handleCanPlay = () => {
        // 尝试实际播放视频来验证
        tryPlayVideo()
      }

      // 视频元数据加载完成
      const handleLoadedMetadata = () => {
        // 如果视频已经可以播放，触发播放检测
        if (testVideo.readyState >= 3) {
          tryPlayVideo()
        }
      }

      // 视频开始播放（最可靠的确认方式）
      const handlePlaying = () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          playTimeout = setTimeout(() => {
            cleanup()
            resolve(true) // 视频正在播放，说明可以正常播放
          }, 300)
        }
      }

      // 处理各种错误
      const handleError = (e) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          const error = testVideo.error
          let errorMsg = '未知错误'
          
          if (error) {
            // MediaError.MEDIA_ERR_ABORTED = 1
            // MediaError.MEDIA_ERR_NETWORK = 2
            // MediaError.MEDIA_ERR_DECODE = 3
            // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4
            switch (error.code) {
              case 1:
                errorMsg = '视频加载被中止'
                break
              case 2:
                errorMsg = '网络错误'
                break
              case 3:
                errorMsg = '视频解码失败'
                break
              case 4:
                errorMsg = '视频格式不支持'
                break
              default:
                errorMsg = `错误代码: ${error.code}`
            }
          }
          
          console.warn('视频无法加载/播放:', videoUrl, errorMsg)
          cleanup()
          resolve(false)
        }
      }

      // 监听所有相关事件
      testVideo.addEventListener('canplay', handleCanPlay)
      testVideo.addEventListener('loadedmetadata', handleLoadedMetadata)
      testVideo.addEventListener('playing', handlePlaying)
      testVideo.addEventListener('error', handleError)
      
      // 开始加载视频
      testVideo.src = videoUrl
    })
  }

  // 加载视频（带格式检测）
  const loadVideo = async (type = null, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // type 为 null、undefined 或空字符串时使用随机，否则使用指定类型
        const url = (type && type !== 'null' && type !== 'undefined') 
          ? `${API_BASE}/yy?type=${type}` 
          : `${API_BASE}/yy`
        console.log('加载视频，类型参数:', type, '类型:', type || '随机', 'URL:', url)
        const response = await fetch(url)
        const result = await response.json()
        
        let videoUrl = null
        
        // 处理返回格式：{ success: true, data: { url: "..." } }
        if (result.success && result.data && result.data.url) {
          videoUrl = result.data.url
        } else if (result.url) {
          videoUrl = result.url
        } else if (result.video) {
          videoUrl = result.video
        } else if (result.data && (result.data.url || result.data.video)) {
          videoUrl = result.data.url || result.data.video
        }
        
        if (!videoUrl) {
          console.warn('未找到视频URL，返回数据:', result)
          continue // 重试
        }
        
        // 检测视频格式是否支持
        const isSupported = await checkVideoSupport(videoUrl)
        if (isSupported) {
          return videoUrl
        } else {
          console.log(`视频格式不支持，尝试重新加载 (${attempt + 1}/${maxRetries})`)
          // 继续循环重试
        }
      } catch (error) {
        console.error('加载视频失败:', error)
        // 继续重试
      }
    }
    
    console.warn('多次重试后仍无法加载有效视频')
    return null
  }

  // 加载视频列表
  const loadVideoList = async (type, count = 3) => {
    console.log('开始加载视频列表，类型参数:', type, '类型:', type || '随机')
    setLoading(true)
    const videoUrls = []
    for (let i = 0; i < count; i++) {
      const url = await loadVideo(type)
      if (url) {
        videoUrls.push(url)
      }
    }
    if (videoUrls.length > 0) {
      setVideos(videoUrls)
      setCurrentIndex(0) // 重置到第一个视频
      console.log('视频列表加载完成，共', videoUrls.length, '个视频')
    } else {
      console.warn('未能加载到有效视频')
    }
    setLoading(false)
  }

  // 初始加载多个视频
  useEffect(() => {
    loadVideoList(selectedType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 当类型变化时，重新加载视频（排除初始加载）
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // 类型变化时，始终重新加载视频列表
    console.log('检测到类型变化，新类型:', selectedType)
    loadVideoList(selectedType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType])

  // 当接近底部时预加载更多视频
  useEffect(() => {
    if (currentIndex >= videos.length - 1 && videos.length > 0 && !loading) {
      loadVideo(selectedType).then(url => {
        if (url) {
          setVideos(prev => [...prev, url])
        }
      })
    }
  }, [currentIndex, videos.length, loading, selectedType])

  // 监听视口高度变化，避免移动端地址栏导致的 100vh 抖动
  useEffect(() => {
    const updateVH = () => {
      const h = window.visualViewport?.height || window.innerHeight
      setViewportHeight(h)
      // 同时设置 CSS 变量，备用（如样式中需要）
      document.documentElement.style.setProperty('--app-vh', `${h}px`)
    }
    updateVH()
    window.addEventListener('resize', updateVH)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateVH)
    }
    return () => {
      window.removeEventListener('resize', updateVH)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateVH)
      }
    }
  }, [])

  const handleVideoEnd = () => {
    // 如果开启了自动播放，自动切换到下一个视频
    if (autoPlay) {
      if (currentIndex < videos.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        // 如果没有下一个，加载新视频
        loadVideo(selectedType).then(url => {
          if (url) {
            setVideos(prev => [...prev, url])
            setCurrentIndex(prev => prev + 1)
          }
        })
      }
    }
    // 如果关闭了自动播放，视频播放结束后不做任何操作（停留在最后一帧）
  }

  const handleSwipeUp = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // 加载新视频
      loadVideo(selectedType).then(url => {
        if (url) {
          setVideos(prev => [...prev, url])
          setCurrentIndex(prev => prev + 1)
        }
      })
    }
  }

  const handleSwipeDown = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  if (loading && videos.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载失败，请刷新重试</p>
      </div>
    )
  }

  return (
    <div className="app" ref={containerRef}>
      {showEntranceOverlay && (
        <div
          className="entrance-overlay"
          role="button"
          tabIndex={0}
          onClick={() => {
            setHasUserInteracted(true)
            setShowEntranceOverlay(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setHasUserInteracted(true)
              setShowEntranceOverlay(false)
            }
          }}
        >
          <div className="entrance-content">
            <div className="entrance-button">
              <svg width="40" height="40" viewBox="0 0 60 60" fill="none" aria-hidden="true">
                <circle cx="30" cy="30" r="30" fill="rgba(255,255,255,0.9)"/>
                <path d="M25 20L25 40L40 30L25 20Z" fill="#000"/>
              </svg>
            </div>
            <span className="entrance-text">点击进入圣地</span>
            <span className="entrance-subtext">Tap to enter</span>
          </div>
        </div>
      )}
      {/* 视频类型选择器 */}
      <VideoTypeSelector
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        autoPlay={autoPlay}
        onAutoPlayChange={setAutoPlay}
        showPauseIcon={showPauseIcon}
        onShowPauseIconChange={setShowPauseIcon}
      />

      <div 
        className="video-list-container"
        style={{
          // 使用像素位移，避免移动端 100vh 动态变化导致的错位
          transform: `translateY(-${currentIndex * viewportHeight}px)`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {videos.map((videoUrl, index) => (
          <VideoPlayer
            key={`video-${index}`}
            videoUrl={videoUrl}
            onEnd={handleVideoEnd}
            onSwipeUp={handleSwipeUp}
            onSwipeDown={handleSwipeDown}
            isActive={index === currentIndex}
            hasUserInteracted={hasUserInteracted}
            onUserInteract={() => setHasUserInteracted(true)}
            showPauseIcon={showPauseIcon}
            autoPlay={autoPlay}
            suppressGuideOverlay={showEntranceOverlay}
            lastSwipeUpTimeRef={lastSwipeUpTimeRef}
            onShowToast={showToastMessage}
          />
        ))}
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className={`toast ${showToast ? 'toast-show' : ''}`}>
          <span className="toast-text">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default App
