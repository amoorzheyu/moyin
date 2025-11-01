import React, { useRef, useState, useEffect } from 'react'
import './VideoPlayer.css'

// 从环境变量读取上滑间隔（毫秒），默认3000ms（3秒）
const SWIPE_UP_COOLDOWN = parseInt(import.meta.env.VITE_SWIPE_UP_COOLDOWN || '3000', 10)
console.log('上滑冷却时间配置:', SWIPE_UP_COOLDOWN, 'ms')

const VideoPlayer = ({ videoUrl, onEnd, onSwipeUp, onSwipeDown, isActive, hasUserInteracted, onUserInteract, showPauseIcon = true, suppressGuideOverlay = false, autoPlay = false, lastSwipeUpTimeRef, onShowToast, onSwipeMove }) => {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // 使用原生事件监听器处理触摸移动，确保可以 preventDefault
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchMoveNative = (e) => {
      if (!isActive || !isDragging) return
      
      // 检查是否点击了类型选择器区域（防止干扰）
      const target = e.target
      if (target && (target.closest?.('.video-type-selector') || target.closest?.('.selector-backdrop'))) {
        return
      }
      
      const touch = e.touches[0]
      if (!touch) return
      
      const currentY = touch.clientY
      const deltaY = touchStartY - currentY
      
      // 实时更新滑动距离，传递给父组件
      if (onSwipeMove) {
        onSwipeMove(deltaY)
      }
      
      // 防止默认滚动行为
      e.preventDefault()
    }

    // 使用 { passive: false } 确保可以调用 preventDefault
    container.addEventListener('touchmove', handleTouchMoveNative, { passive: false })

    return () => {
      container.removeEventListener('touchmove', handleTouchMoveNative)
    }
  }, [isActive, isDragging, touchStartY, onSwipeMove])

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current
      
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)
      const handleEnded = () => {
        setIsPlaying(false)
        if (onEnd && isActive) onEnd()
      }

      const handleCanPlay = () => {
        // 当视频可以播放时，如果用户已经交互过，且是活动视频，则自动播放（非静音）
        if (isActive && hasUserInteracted) {
          video.muted = false
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log('自动播放失败:', err)
            })
          }
        }
      }

      const handleLoadedMetadata = () => {
        // 视频元数据加载完成后，如果用户已经交互过，且是活动视频，则尝试自动播放
        if (isActive && hasUserInteracted) {
          video.muted = false
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log('自动播放失败:', err)
            })
          }
        }
      }

      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)
      video.addEventListener('ended', handleEnded)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)

      // 如果用户已经交互过，且是活动视频，则设置非静音并尝试播放
      if (isActive && hasUserInteracted) {
        video.muted = false
        // 如果视频已经可以播放，立即播放
        if (video.readyState >= 2) {
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log('自动播放失败:', err)
            })
          }
        }
      }

      // 如果不是活动视频，暂停播放
      if (!isActive) {
        video.pause()
      }

      return () => {
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
        video.removeEventListener('ended', handleEnded)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [videoUrl, isActive, onEnd, hasUserInteracted])

  // 触摸事件处理
  const handleTouchStart = (e) => {
    if (!isActive) return
    
    // 检查是否点击了类型选择器区域（防止干扰）
    const target = e.target
    if (target && (target.closest?.('.video-type-selector') || target.closest?.('.selector-backdrop'))) {
      return // 忽略选择器区域的触摸
    }
    
    const touch = e.touches[0]
    setTouchStartY(touch.clientY)
    setTouchStartTime(Date.now())
    setIsDragging(true)
    
    // 通知父组件开始滑动
    if (onSwipeMove) {
      onSwipeMove(0)
    }
  }

  // handleTouchMove 现在只是备用，主要逻辑在原生事件监听器中
  // 保留 React 事件处理器用于兼容性
  const handleTouchMove = (e) => {
    // 主要逻辑已通过原生事件监听器处理，这里不需要做任何事
    // 但保留这个函数以避免 React 警告
  }

  const handleTouchEnd = (e) => {
    if (!isActive || !isDragging) return
    
    // 检查是否点击了类型选择器区域（防止干扰）
    const target = e.target
    if (target && (target.closest?.('.video-type-selector') || target.closest?.('.selector-backdrop'))) {
      setIsDragging(false)
      // 清除滑动偏移
      if (onSwipeMove) {
        onSwipeMove(0)
      }
      return // 忽略选择器区域的点击
    }
    
    const touch = e.changedTouches[0]
    const touchEndY = touch.clientY
    const touchEndTime = Date.now()
    const deltaY = touchStartY - touchEndY
    const deltaTime = touchEndTime - touchStartTime

    // 清除拖拽状态
    setIsDragging(false)
    
    // 清除滑动偏移（通知父组件滑动结束）
    if (onSwipeMove) {
      onSwipeMove(0)
    }

    // 快速滑动判定（降低阈值，提高响应性）
    const screenHeight = window.innerHeight
    // 降低阈值：屏幕高度的10%或至少40px，比之前的20%和80px更敏感
    const threshold = Math.max(40, screenHeight * 0.1)
    
    // 更宽松的条件：滑动超过阈值，或者快速滑动（30px且时间少于600ms）
    if (Math.abs(deltaY) > threshold || (Math.abs(deltaY) > 30 && deltaTime < 600)) {
      if (deltaY > 0) {
        // 向上滑动 - 下一个视频（频率限制）
        const now = Date.now()
        const lastTime = lastSwipeUpTimeRef.current
        
        // 如果是第一次上滑（lastTime === 0），直接允许
        if (lastTime === 0) {
          console.log('✓ 首次上滑，允许')
          lastSwipeUpTimeRef.current = now
          setIsExiting(true)
          onSwipeUp && onSwipeUp()
        } else {
          const timeSinceLastSwipeUp = now - lastTime
          console.log('上滑检测 - 距上次:', timeSinceLastSwipeUp, 'ms, 需要:', SWIPE_UP_COOLDOWN, 'ms')
          
          if (timeSinceLastSwipeUp >= SWIPE_UP_COOLDOWN) {
            console.log('✓ 允许上滑')
            lastSwipeUpTimeRef.current = now
            setIsExiting(true)
            onSwipeUp && onSwipeUp()
          } else {
            // 频率限制中，忽略此次上滑
            const remainingSeconds = Math.ceil((SWIPE_UP_COOLDOWN - timeSinceLastSwipeUp) / 1000)
            console.log(`✗ 上滑冷却中，还需等待 ${remainingSeconds} 秒`)
            // 显示 Toast 提示
            if (onShowToast) {
              onShowToast(`冷却中 ${remainingSeconds}s`)
            }
          }
        }
      } else {
        // 向下滑动 - 上一个视频
        setIsExiting(true)
        onSwipeDown && onSwipeDown()
      }
    } else if (Math.abs(deltaY) < 10 && deltaTime < 200) {
      // 点击播放/暂停
      handlePlayClick()
    }
  }

  // 当该项重新成为活动项时，清除退出状态
  useEffect(() => {
    if (isActive) {
      setIsExiting(false)
    }
  }, [isActive])
  
  const handleClick = (e) => {
    if (!isActive) return
    
    // 检查是否点击了类型选择器区域（防止干扰）
    const target = e.target
    if (target && (target.closest?.('.video-type-selector') || target.closest?.('.selector-backdrop'))) {
      return // 忽略选择器区域的点击
    }
    
    // 点击视频区域时切换播放/暂停
    handlePlayClick()
  }

  const handlePlayClick = () => {
    if (videoRef.current) {
      const video = videoRef.current
      
      // 如果是首次交互，标记并取消静音
      if (!hasUserInteracted && onUserInteract) {
        onUserInteract()
        video.muted = false
      }
      
      if (isPlaying) {
        video.pause()
      } else {
        video.play().catch(err => {
          console.error('播放失败:', err)
        })
      }
    }
  }

  const togglePlayPause = handlePlayClick

  if (!videoUrl) {
    return (
      <div className="video-player-container">
        <div className="loading-placeholder">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="video-player-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        className="video-player"
        src={videoUrl}
        loop={!autoPlay}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        x5-video-player-fullscreen="false"
        muted={false}
        preload="auto"
      />
      
      {/* 首次播放引导 */}
      {!hasUserInteracted && isActive && !suppressGuideOverlay && (
        <div className="play-guide-overlay" onClick={handlePlayClick}>
          <div className="play-guide-content">
            <div className="play-guide-icon">
              <svg width="80" height="80" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="30" fill="rgba(255,255,255,0.9)"/>
                <path d="M25 20L25 40L40 30L25 20Z" fill="#000"/>
              </svg>
            </div>
            <p className="play-guide-text">点击开始播放</p>
          </div>
        </div>
      )}
      
      {/* 播放/暂停按钮 - 根据 showPauseIcon 开关控制显示 */}
      {hasUserInteracted && !isPlaying && showPauseIcon && isActive && !isExiting && (
        <div className="play-button-overlay" onClick={togglePlayPause}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="30" fill="rgba(0,0,0,0.5)"/>
            <path d="M25 20L25 40L40 30L25 20Z" fill="white"/>
          </svg>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer
