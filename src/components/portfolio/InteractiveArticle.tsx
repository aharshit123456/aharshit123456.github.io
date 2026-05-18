'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkAlert from 'remark-github-alerts';

interface Comment {
  id: string;
  blog_slug: string;
  block_id: string;
  author_name: string;
  comment_text: string;
  selected_text?: string;
  created_at: string;
}

interface InteractiveArticleProps {
  content: string;
  slug: string;
}

interface SelectionCoords {
  x: number;
  y: number;
  blockId: string;
  selectedText: string;
}

// Simple, robust deterministic string hash for stable paragraph IDs with caching
const idHashCache: Record<string, string> = {};
const generateIdHash = (text: string) => {
  if (!text) return 'empty';
  const cleanText = text.trim().substring(0, 100); // stable hash based on content start
  if (idHashCache[cleanText]) return idHashCache[cleanText];

  let hash = 0;
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const result = 'b_' + Math.abs(hash).toString(36);
  idHashCache[cleanText] = result;
  return result;
};

export default function InteractiveArticle({ content, slug }: InteractiveArticleProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dbMode, setDbMode] = useState<'supabase' | 'local'>('local');
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Selection-driven comments state
  const [selectionCoords, setSelectionCoords] = useState<SelectionCoords | null>(null);
  const [selectedTextContext, setSelectedTextContext] = useState<string>('');
  const [lastHighlightBlockId, setLastHighlightBlockId] = useState<string | null>(null);
  const [lastHighlightText, setLastHighlightText] = useState<string>('');
  const articleRef = useRef<HTMLDivElement>(null);

  const SUPABASE_URL = 'https://kolqskhjijhzghnrteqi.supabase.co/rest/v1/blog_comments';
  const SUPABASE_KEY = 'sb_publishable_yUihxNM1P39vLWQ5jS0Y-Q_mCby5zgz';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);

  // Fetch comments for this article
  const fetchComments = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}?blog_slug=eq.${slug}&order=created_at.asc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
        setDbMode('supabase');
      } else {
        throw new Error('Supabase request failed');
      }
    } catch (err) {
      console.warn('Supabase not fully setup or table blog_comments missing. Falling back to local storage database.');
      setDbMode('local');
      // Load from local storage
      const localData = localStorage.getItem(`comments_${slug}`);
      if (localData) {
        setComments(JSON.parse(localData));
      }
    }
  };

  useEffect(() => {
    fetchComments();
  }, [slug]);

  // Text selection listener inside the article with 100ms debounce and touchend safety fallback
  useEffect(() => {
    if (!isMounted) return;

    let debounceTimeout: NodeJS.Timeout;

    const checkSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelectionCoords(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();

      // Cap selected text length for bubble and db
      if (text.length < 3 || text.length > 300) {
        setSelectionCoords(null);
        return;
      }

      const articleNode = articleRef.current;
      if (articleNode && articleNode.contains(range.commonAncestorContainer)) {
        const rects = range.getClientRects();
        if (rects.length > 0) {
          const rect = rects[0];
          const containerRect = articleNode.getBoundingClientRect();

          // Calculate parent element block ID
          let containerElement: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
          if (containerElement.nodeType === Node.TEXT_NODE) {
            containerElement = containerElement.parentElement;
          }

          // Climb up to find nearest paragraph / block
          let blockElement = containerElement;
          while (
            blockElement &&
            blockElement !== articleNode &&
            !blockElement.classList.contains('interactive-block-wrapper')
          ) {
            blockElement = blockElement.parentElement as HTMLElement;
          }

          const blockId = blockElement?.id?.replace('wrap-', '') || 'general';

          // Center the comment trigger button 40px above selection
          setSelectionCoords({
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top - containerRect.top - 40,
            blockId,
            selectedText: text
          });
        }
      } else {
        setSelectionCoords(null);
      }
    };

    const handleSelectionChange = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(checkSelection, 100);
    };

    const handleTouchEnd = () => {
      // Small 80ms delay to let mobile OS finalize text selection coordinates
      setTimeout(checkSelection, 80);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    const articleNode = articleRef.current;
    if (articleNode) {
      articleNode.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (articleNode) {
        articleNode.removeEventListener('touchend', handleTouchEnd);
      }
      clearTimeout(debounceTimeout);
    };
  }, [isMounted]);

  // Submit comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeBlockId) return;

    setIsPosting(true);
    const newComment: Comment = {
      id: Math.random().toString(36).substring(2, 11),
      blog_slug: slug,
      block_id: activeBlockId,
      author_name: authorName.trim() || 'Anonymous Reader',
      comment_text: commentText.trim(),
      selected_text: selectedTextContext || undefined,
      created_at: new Date().toISOString()
    };

    if (dbMode === 'supabase') {
      try {
        let response = await fetch(SUPABASE_URL, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            blog_slug: slug,
            block_id: activeBlockId,
            author_name: newComment.author_name,
            comment_text: newComment.comment_text,
            selected_text: newComment.selected_text
          })
        });

        // Defensive fallback: If the live database table was created in a previous session
        // and doesn't have the new 'selected_text' column, retry posting without it!
        if (!response.ok && newComment.selected_text) {
          console.warn('Post failed with selected_text. Retrying standard column layout insert...');
          response = await fetch(SUPABASE_URL, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              blog_slug: slug,
              block_id: activeBlockId,
              author_name: newComment.author_name,
              comment_text: newComment.comment_text
            })
          });
        }

        if (response.ok) {
          fetchComments();
          setCommentText('');
        } else {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.message || 'Failed to insert comment');
        }
      } catch (err: any) {
        console.error('Failed to post to Supabase:', err);
        alert(`Could not submit to Supabase server: ${err.message || err}. Falling back to local database.`);
        saveLocalComment(newComment);
      }
    } else {
      saveLocalComment(newComment);
    }
    setIsPosting(false);
  };

  const saveLocalComment = (comment: Comment) => {
    const updated = [...comments, comment];
    setComments(updated);
    localStorage.setItem(`comments_${slug}`, JSON.stringify(updated));
    setCommentText('');
  };

  // Group comments by block_id for display inside blocks
  const commentsByBlock = comments.reduce((acc, comment) => {
    if (!acc[comment.block_id]) {
      acc[comment.block_id] = [];
    }
    acc[comment.block_id].push(comment);
    return acc;
  }, {} as Record<string, Comment[]>);

  // Trigger selection-based inline comment panel open
  const handleOpenComment = (blockId: string, selectionText?: string) => {
    setActiveBlockId(blockId);
    setSelectedTextContext(selectionText || '');
    if (blockId !== 'general') {
      setLastHighlightBlockId(blockId);
      setLastHighlightText(selectionText || '');
    }
    setIsDrawerOpen(true);
    
    // Clear selection
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();
  };

  // Interactive paragraph wrapper renderer (assigns stable IDs, hides speech bubble triggers)
  const renderInteractiveBlock = (type: string, children: React.ReactNode) => {
    const textContent = React.Children.toArray(children)
      .map(child => {
        if (typeof child === 'string') return child;
        if (typeof child === 'number') return String(child);
        return '';
      })
      .join('');

    const id = generateIdHash(textContent || type);
    const count = (commentsByBlock[id] || []).length;
    const Tag = type as any;

    return (
      <div className="interactive-block-wrapper" id={`wrap-${id}`}>
        <Tag className="interactive-element">{children}</Tag>
        {/* Subtle, serene underline indicator if paragraph contains discussions */}
        {count > 0 && (
          <div className="discussion-presence-line" onClick={() => handleOpenComment(id)}>
            💬 {count} discussion thread{count > 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };

  const activeComments = activeBlockId ? (commentsByBlock[activeBlockId] || []) : [];

  const memoizedMarkdownBody = useMemo(() => {
    return (
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm, remarkAlert]}
        components={{
          p: ({ children }) => renderInteractiveBlock('p', children),
          h2: ({ children }) => renderInteractiveBlock('h2', children),
          h3: ({ children }) => renderInteractiveBlock('h3', children),
          li: ({ children }) => renderInteractiveBlock('li', children),
          blockquote: ({ children }) => renderInteractiveBlock('blockquote', children),
          img: ({ src, alt }) => {
            if (!src || typeof src !== 'string') return null;
            const isScreenshot = src.includes('/assets/famcare') || src.includes('/assets/shoppin');
            if (isScreenshot) {
              return (
                <Image
                  src={src}
                  alt={alt || "Screenshot"}
                  width={210}
                  height={380}
                  quality={85}
                  unoptimized
                  style={{
                    borderRadius: '16px',
                    objectFit: 'cover'
                  }}
                />
              );
            }
            return (
              <img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
              />
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }, [content, comments]);

  return (
    <div className="interactive-article-canvas" ref={articleRef} style={{ position: 'relative' }}>
      
      {/* Floating Selection Comment Icon (Medium / Notion style) - Desktop Only */}
      {isMounted && selectionCoords && !isMobile && (
        <button
          className="floating-selection-comment-btn"
          style={{
            left: `${selectionCoords.x}px`,
            top: `${selectionCoords.y}px`
          }}
          onClick={() => handleOpenComment(selectionCoords.blockId, selectionCoords.selectedText)}
          suppressHydrationWarning
        >
          <span>💬</span> Discuss highlight
        </button>
      )}

      {/* Fixed Bottom Selection Actions Bar - Mobile Only (Portalled to document.body to prevent parent clipping) */}
      {isMounted && selectionCoords && isMobile && typeof document !== 'undefined' && createPortal(
        <div className="mobile-selection-bar">
          <div className="mobile-selection-bar-text">
            <span>Discuss Selection</span>
            <p>"{selectionCoords.selectedText}"</p>
          </div>
          <button 
            className="mobile-selection-bar-btn"
            onClick={() => handleOpenComment(selectionCoords.blockId, selectionCoords.selectedText)}
          >
            💬 Discuss
          </button>
        </div>,
        document.body
      )}

      {/* Markdown Body */}
      {memoizedMarkdownBody}
      {/* General Article Comments Footer Section */}
      {isMounted && (
        <div className="general-comments-footer-box">
          <div className="g-left">
            <span className="g-icon">💬</span>
            <div className="g-text-box">
              <h4>General Article Discussion</h4>
              <p>Share your overall thoughts, questions, and feedback about this article.</p>
            </div>
          </div>
          <button 
            className="open-general-comments-btn"
            onClick={() => handleOpenComment('general')}
          >
            View & Post Comments ({commentsByBlock['general']?.length || 0})
          </button>
        </div>
      )}

      {/* Slide-over Comments Panel rendered as a Portal to document.body */}
      {isMounted && typeof document !== 'undefined' && createPortal(
        <div className={`comments-drawer ${isDrawerOpen ? 'open' : ''}`}>
          <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
          <div className="drawer-shell">
            <div className="drawer-header">
              <div className="drawer-title-box">
                <h3>{activeBlockId === 'general' ? 'General Discussion' : 'Highlights Discussion'}</h3>
                <span className="block-subtitle">
                  {activeBlockId === 'general' 
                    ? 'Discussing the entire article' 
                    : `Selected Block: ${activeBlockId}`
                  }
                </span>
              </div>
              <button className="close-drawer-btn" onClick={() => setIsDrawerOpen(false)}>×</button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="drawer-tabs">
              <button 
                className={`drawer-tab ${activeBlockId !== 'general' ? 'active' : ''}`}
                onClick={() => {
                  if (lastHighlightBlockId) {
                    setActiveBlockId(lastHighlightBlockId);
                    setSelectedTextContext(lastHighlightText);
                  }
                }}
                disabled={!lastHighlightBlockId}
                style={!lastHighlightBlockId ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                title={!lastHighlightBlockId ? "Select or highlight a paragraph to comment on specific details!" : "Switch back to active highlights thread"}
              >
                📝 Highlights
              </button>
              <button 
                className={`drawer-tab ${activeBlockId === 'general' ? 'active' : ''}`}
                onClick={() => {
                  setActiveBlockId('general');
                  setSelectedTextContext('');
                }}
              >
                💬 General ({commentsByBlock['general']?.length || 0})
              </button>
            </div>

            <div className="drawer-body">
              {/* Comments scroll area */}
              <div className="drawer-comments-list">
                {activeComments.length === 0 ? (
                  <div className="empty-discussion">
                    <span className="empty-icon">💭</span>
                    <p>No comments on this specific part yet. Highlight a text or submit below to start discussing!</p>
                  </div>
                ) : (
                  activeComments.map(comment => (
                    <div key={comment.id} className="comment-card">
                      <div className="comment-card-header">
                        <span className="comment-author">{comment.author_name}</span>
                        <span className="comment-time">
                          {new Date(comment.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {/* Context Selection Quote */}
                      {comment.selected_text && (
                        <blockquote className="comment-selection-quote">
                          "{comment.selected_text}"
                        </blockquote>
                      )}
                      
                      <p className="comment-text">{comment.comment_text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Form */}
              <form className="drawer-comment-form" onSubmit={handleAddComment}>
                {selectedTextContext && (
                  <div className="highlighted-text-preview-box">
                    <span>Discussing highlight:</span>
                    <p>"{selectedTextContext}"</p>
                  </div>
                )}

                <h4>Contribute to the conversation</h4>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <textarea
                    placeholder="Share your thoughts on this sentence..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    required
                    maxLength={1000}
                  />
                </div>
                <button className="submit-comment-btn" type="submit" disabled={isPosting || !commentText.trim()}>
                  {isPosting ? 'Sending...' : 'Post Comment'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Scoped CSS styling for advanced inline hover speech bubbles & drawer panels */}
      <style jsx global>{`
        /* Selection Highlight Comment Trigger */
        .floating-selection-comment-btn {
          position: absolute !important;
          transform: translate3d(-50%, -50%, 0) scale(1) !important;
          will-change: transform, opacity !important;
          backface-visibility: hidden !important;
          z-index: 1000 !important;
          background: rgba(18, 18, 20, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 30px !important;
          padding: 8px 16px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          cursor: pointer !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          font-family: 'Outfit', sans-serif !important;
          white-space: nowrap !important;
          animation: commentAppear 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        @keyframes commentAppear {
          from {
            transform: translate(-50%, -30%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }

        .floating-selection-comment-btn:hover {
          background: var(--accent-gradient) !important;
          border-color: transparent !important;
          transform: translate(-50%, -50%) scale(1.06) !important;
          box-shadow: 0 12px 35px rgba(var(--accent-rgb), 0.35) !important;
        }

        /* Discussion Presence Underline Indicator */
        .discussion-presence-line {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          margin-top: 6px !important;
          font-size: 11.5px !important;
          font-weight: 700 !important;
          color: var(--accent-color) !important;
          background: rgba(var(--accent-rgb), 0.05) !important;
          border: 1px solid rgba(var(--accent-rgb), 0.12) !important;
          border-radius: 12px !important;
          padding: 4px 12px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }

        .discussion-presence-line:hover {
          background: var(--accent-gradient) !important;
          color: white !important;
          border-color: transparent !important;
          box-shadow: 0 4px 12px rgba(var(--accent-rgb), 0.2) !important;
        }

        /* Scoped block layout wrappers */
        .interactive-block-wrapper {
          position: relative !important;
          margin-bottom: 0 !important;
          display: block !important;
        }

        .interactive-element {
          display: block !important;
          margin-bottom: 0 !important;
        }

        /* Drawer Selection Preview */
        .comment-selection-quote {
          margin: 0 0 10px 0 !important;
          padding: 8px 12px !important;
          border-left: 3px solid #ff4d4d !important;
          background: #121212 !important;
          font-style: italic !important;
          font-size: 11.5px !important;
          color: #cccccc !important;
          border-radius: 0 8px 8px 0 !important;
          line-height: 1.4 !important;
        }

        .highlighted-text-preview-box {
          background: #121212 !important;
          border-radius: 16px !important;
          padding: 12px !important;
          border: 1px dashed #444444 !important;
        }

        .highlighted-text-preview-box span {
          font-size: 10px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          color: #8e8e93 !important;
          opacity: 0.9;
        }

        .highlighted-text-preview-box p {
          margin: 4px 0 0 0 !important;
          font-style: italic !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
          color: #cccccc !important;
        }

        /* Slide-over comments panel */
        .comments-drawer {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 9999 !important;
          pointer-events: none;
          visibility: hidden;
          transition: visibility 0.4s;
        }

        .comments-drawer.open {
          pointer-events: auto;
          visibility: visible;
        }

        .drawer-backdrop {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: rgba(10, 10, 12, 0.45) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          opacity: 0;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .comments-drawer.open .drawer-backdrop {
          opacity: 1;
        }

        .drawer-shell {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 360px !important;
          max-width: 100% !important;
          height: 100vh !important;
          background: #1e1e1e !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5) !important;
          display: flex !important;
          flex-direction: column !important;
          transform: translate3d(100%, 0, 0);
          will-change: transform !important;
          backface-visibility: hidden !important;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 24px 0 0 24px;
          overflow: hidden !important;
          box-sizing: border-box !important;
          z-index: 10000 !important;
        }

        .comments-drawer.open .drawer-shell {
          transform: translate3d(0, 0, 0) !important;
        }

        .drawer-header {
          padding: 30px 30px 20px 30px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
        }

        .drawer-title-box h3 {
          margin: 0 !important;
          font-family: 'Fira Code', monospace !important;
          font-size: 18px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
        }

        .block-subtitle {
          font-size: 11px !important;
          color: #8e8e93 !important;
          font-family: monospace !important;
          opacity: 0.8;
        }

        .close-drawer-btn {
          background: none !important;
          border: none !important;
          font-size: 32px !important;
          color: #8e8e93 !important;
          cursor: pointer !important;
          line-height: 1 !important;
          padding: 0 !important;
          transition: transform 0.2s;
        }

        .close-drawer-btn:hover {
          transform: scale(1.15) rotate(90deg);
          color: #ff4d4d !important;
        }

        .drawer-body {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow-y: auto !important;
          padding: 0 24px 30px 24px !important;
          box-sizing: border-box !important;
          gap: 20px !important;
        }

        /* Comments List styling */
        .drawer-comments-list {
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
          overflow-y: visible !important;
          min-height: auto !important;
        }

        .drawer-comments-list::-webkit-scrollbar {
          width: 4px;
        }
        .drawer-comments-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .empty-discussion {
          text-align: center !important;
          padding: 40px 10px !important;
          color: #8e8e93 !important;
          opacity: 0.8;
        }

        .empty-icon {
          font-size: 40px !important;
          display: block !important;
          margin-bottom: 12px !important;
        }

        .empty-discussion p {
          font-size: 13px !important;
          line-height: 1.5 !important;
          margin: 0 !important;
        }

        .comment-card {
          background: #242426 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 20px !important;
          padding: 16px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          transition: all 0.3s ease;
        }

        .comment-card:hover {
          background: #2b2b2e !important;
          border-color: rgba(255, 77, 77, 0.3) !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2) !important;
        }

        .comment-card-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 6px !important;
        }

        .comment-author {
          font-size: 13px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
        }

        .comment-time {
          font-size: 10px !important;
          color: #8e8e93 !important;
        }

        .comment-text {
          margin: 0 !important;
          font-size: 13.5px !important;
          line-height: 1.5 !important;
          color: #f0f0f0 !important;
          word-break: break-word !important;
        }

        /* Comment form inputs */
        .drawer-comment-form {
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding-top: 20px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
        }

        .drawer-comment-form h4 {
          margin: 0 !important;
          font-family: 'Fira Code', monospace !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
        }

        .form-group input, .form-group textarea {
          width: 100% !important;
          background: #121212 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 16px !important;
          padding: 10px 14px !important;
          font-size: 13px !important;
          outline: none !important;
          box-sizing: border-box !important;
          font-family: inherit !important;
          color: #ffffff !important;
          transition: all 0.3s ease;
        }

        .form-group input::placeholder, .form-group textarea::placeholder {
          color: #666666 !important;
        }

        .form-group input:focus, .form-group textarea:focus {
          background: #121212 !important;
          border-color: #ff4d4d !important;
          box-shadow: 0 0 0 3px rgba(255, 77, 77, 0.15) !important;
        }

        .form-group textarea {
          height: 75px !important;
          resize: none !important;
        }

        .submit-comment-btn {
          background: #121212 !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 20px !important;
          padding: 12px !important;
          font-size: 13.5px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
          outline: none !important;
        }

        .submit-comment-btn:hover {
          background: #ff4d4d !important;
          border-color: transparent !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(255, 77, 77, 0.25) !important;
        }

        .submit-comment-btn:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
        }

        /* Drawer Tab Navigation Styles */
        .drawer-tabs {
          display: flex !important;
          background: #121212 !important;
          padding: 4px !important;
          border-radius: 14px !important;
          margin: 10px 24px 0 24px !important;
          gap: 4px !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .drawer-tab {
          flex: 1 !important;
          background: none !important;
          border: none !important;
          padding: 8px 12px !important;
          font-family: 'Fira Code', monospace !important;
          font-size: 12.5px !important;
          font-weight: 600 !important;
          color: #8e8e93 !important;
          border-radius: 10px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          outline: none !important;
        }

        .drawer-tab.active {
          background: #1e1e1e !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }

        .drawer-tab:hover:not(:disabled):not(.active) {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.05) !important;
          box-shadow: none !important;
        }

        /* General Comments Footer Box */
        .general-comments-footer-box {
          margin: 60px 0 30px 0 !important;
          padding: 24px 30px !important;
          background: rgba(26, 26, 26, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 20px !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
        }

        .g-left {
          display: flex !important;
          align-items: center !important;
          gap: 16px !important;
        }

        .g-icon {
          font-size: 28px !important;
          background: rgba(255, 77, 77, 0.08) !important;
          padding: 10px !important;
          border-radius: 16px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 48px !important;
          height: 48px !important;
          box-sizing: border-box !important;
        }

        .g-text-box h4 {
          margin: 0 0 4px 0 !important;
          font-family: 'Fira Code', monospace !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
        }

        .g-text-box p {
          margin: 0 !important;
          font-size: 13px !important;
          color: #cccccc !important;
          line-height: 1.4 !important;
        }

        .open-general-comments-btn {
          background: #121212 !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 20px !important;
          padding: 12px 24px !important;
          font-size: 13.5px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
          outline: none !important;
          white-space: nowrap !important;
        }

        .open-general-comments-btn:hover {
          background: #ff4d4d !important;
          border-color: transparent !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(255, 77, 77, 0.25) !important;
        }

        /* Mobile selection overrides & sheet styles */
        @media (max-width: 768px) {
          .floating-selection-comment-btn {
            padding: 6px 12px !important;
            font-size: 11px !important;
          }

          .drawer-shell {
            width: 100% !important;
            max-width: 100% !important;
            height: 55vh !important;
            top: auto !important;
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            border-radius: 24px 24px 0 0 !important;
            border-left: none !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            transform: translateY(100%) !important;
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.4) !important;
            background: #1e1e1e !important;
          }

          .comments-drawer.open .drawer-shell {
            transform: translateY(0) !important;
          }

          .drawer-header {
            padding: 20px 20px 12px 20px !important;
          }

          .drawer-body {
            padding: 0 20px 20px 20px !important;
            gap: 16px !important;
          }

          .general-comments-footer-box {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 20px !important;
            gap: 16px !important;
            margin: 40px 0 20px 0 !important;
          }

          .g-left {
            gap: 12px !important;
          }

          .open-general-comments-btn {
            width: 100% !important;
            text-align: center !important;
          }
        }

        /* Mobile Selection Bar Styles */
        .mobile-selection-bar {
          position: fixed !important;
          bottom: 24px !important;
          left: 20px !important;
          right: 20px !important;
          background: rgba(30, 30, 32, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 20px !important;
          padding: 12px 18px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 12px !important;
          z-index: 9999 !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) !important;
          animation: mobileBarAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          will-change: transform, opacity !important;
        }

        @keyframes mobileBarAppear {
          from {
            transform: translate3d(0, 80px, 0) !important;
            opacity: 0 !important;
          }
          to {
            transform: translate3d(0, 0, 0) !important;
            opacity: 1 !important;
          }
        }

        .mobile-selection-bar-text {
          flex: 1 !important;
          overflow: hidden !important;
          text-align: left !important;
        }

        .mobile-selection-bar-text span {
          font-size: 10px !important;
          font-weight: 700 !important;
          color: #8e8e93 !important;
          text-transform: uppercase !important;
          display: block !important;
          margin-bottom: 2px !important;
        }

        .mobile-selection-bar-text p {
          margin: 0 !important;
          font-size: 12.5px !important;
          color: #ffffff !important;
          font-style: italic !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .mobile-selection-bar-btn {
          background: #ff4d4d !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 14px !important;
          padding: 8px 16px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          white-space: nowrap !important;
          transition: all 0.2s ease !important;
          outline: none !important;
        }

        .mobile-selection-bar-btn:active {
          transform: scale(0.95) !important;
        }
      `}</style>
    </div>
  );
}
