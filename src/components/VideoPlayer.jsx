import React, { useRef, useState, useEffect } from 'react'
import './VideoPlayer.css'

const VideoPlayer = ({ videoUrl, onEnd, onSwipeUp, onSwipeDown, isActive, hasUserInteracted, onUserInteract, showPauseIcon = true, suppressGuideOverlay = false }) => {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchStartTime, setTouchStartTime] = useState(0)

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
  }

  const handleTouchEnd = (e) => {
    if (!isActive) return
    
    // 检查是否点击了类型选择器区域（防止干扰）
    const target = e.target
    if (target && (target.closest?.('.video-type-selector') || target.closest?.('.selector-backdrop'))) {
      return // 忽略选择器区域的点击
    }
    
    const touch = e.changedTouches[0]
    const touchEndY = touch.clientY
    const touchEndTime = Date.now()
    const deltaY = touchStartY - touchEndY
    const deltaTime = touchEndTime - touchStartTime

    // 快速滑动判定（超过80px，且时间少于500ms，或滑动距离超过屏幕1/4）
    const screenHeight = window.innerHeight
    const threshold = Math.max(80, screenHeight * 0.2)
    
    if (Math.abs(deltaY) > threshold || (Math.abs(deltaY) > 50 && deltaTime < 500)) {
      if (deltaY > 0) {
        // 向上滑动 - 下一个视频
        onSwipeUp && onSwipeUp()
      } else {
        // 向下滑动 - 上一个视频
        onSwipeDown && onSwipeDown()
      }
    } else if (Math.abs(deltaY) < 10 && deltaTime < 200) {
      // 点击播放/暂停
      handlePlayClick()
    }
  }
  
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
        loop={false}
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
      {hasUserInteracted && !isPlaying && showPauseIcon && (
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
