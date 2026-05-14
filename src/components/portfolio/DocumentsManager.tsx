'use client';

import React, { useState, useEffect } from 'react';

type Blog = {
  id: string;
  title: string;
  date: string;
  content: string;
  author: string;
};

export default function DocumentsManager({ isDarkMode }: { isDarkMode: boolean }) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newBlog, setNewBlog] = useState({ title: '', content: '', author: 'Harshit Agarwal' });

  // Load blogs from localStorage on mount
  useEffect(() => {
    const savedBlogs = localStorage.getItem('harshit_blogs');
    if (savedBlogs) {
      setBlogs(JSON.parse(savedBlogs));
    } else {
      // Default blogs
      const defaultBlogs: Blog[] = [
        { 
          id: '1', 
          title: 'Welcome to my Documents', 
          date: '2026-05-15', 
          content: 'This is where I store my thoughts and technical write-ups. Feel free to explore!', 
          author: 'Harshit Agarwal' 
        }
      ];
      setBlogs(defaultBlogs);
      localStorage.setItem('harshit_blogs', JSON.stringify(defaultBlogs));
    }
  }, []);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlog.title || !newBlog.content) return;

    const blog: Blog = {
      id: Date.now().toString(),
      title: newBlog.title,
      content: newBlog.content,
      author: newBlog.author,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedBlogs = [blog, ...blogs];
    setBlogs(updatedBlogs);
    localStorage.setItem('harshit_blogs', JSON.stringify(updatedBlogs));
    setIsUploading(false);
    setNewBlog({ title: '', content: '', author: 'Harshit Agarwal' });
  };

  const deleteBlog = (id: string) => {
    const updatedBlogs = blogs.filter(b => b.id !== id);
    setBlogs(updatedBlogs);
    localStorage.setItem('harshit_blogs', JSON.stringify(updatedBlogs));
    if (selectedBlog?.id === id) setSelectedBlog(null);
  };

  return (
    <div className="docs-manager">
      <div className="docs-toolbar">
        <div className="docs-breadcrumb">
          <i className="fas fa-folder-open"></i> Documents / Blogs
        </div>
        <button className="upload-btn" onClick={() => setIsUploading(true)}>
          <i className="fas fa-plus"></i> New Blog
        </button>
      </div>

      <div className="docs-layout">
        {/* Sidebar / List */}
        <div className="docs-sidebar">
          {blogs.length === 0 ? (
            <div className="empty-state">No documents found.</div>
          ) : (
            blogs.map(blog => (
              <div 
                key={blog.id} 
                className={`doc-item ${selectedBlog?.id === blog.id ? 'active' : ''}`}
                onClick={() => setSelectedBlog(blog)}
              >
                <div className="doc-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="doc-info">
                  <div className="doc-name">{blog.title}</div>
                  <div className="doc-meta">{blog.date}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Content Area */}
        <div className="docs-viewer">
          {selectedBlog ? (
            <div className="blog-view">
              <div className="blog-header">
                <h1>{selectedBlog.title}</h1>
                <div className="blog-meta">
                  <span><i className="fas fa-user"></i> {selectedBlog.author}</span>
                  <span><i className="fas fa-calendar"></i> {selectedBlog.date}</span>
                  <button className="delete-btn" onClick={() => deleteBlog(selectedBlog.id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="blog-body">
                {selectedBlog.content.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="viewer-empty">
              <i className="fas fa-file-signature"></i>
              <p>Select a document to view its content</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploading && (
        <div className="docs-modal-overlay">
          <div className="docs-modal">
            <div className="modal-header">
              <h2>Upload New Blog</h2>
              <button onClick={() => setIsUploading(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Blog Title</label>
                <input 
                  type="text" 
                  value={newBlog.title} 
                  onChange={e => setNewBlog({...newBlog, title: e.target.value})}
                  placeholder="The Future of Agentic AI..."
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea 
                  value={newBlog.content} 
                  onChange={e => setNewBlog({...newBlog, content: e.target.value})}
                  placeholder="Write your thoughts here..."
                  rows={10}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsUploading(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Upload Blog</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .docs-manager {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: ${isDarkMode ? '#1e1e1e' : '#fff'};
          color: ${isDarkMode ? '#eee' : '#333'};
        }

        .docs-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          background: ${isDarkMode ? '#252525' : '#f5f5f7'};
        }

        .docs-breadcrumb {
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .upload-btn {
          background: var(--accent-color);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .docs-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .docs-sidebar {
          width: 250px;
          border-right: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          overflow-y: auto;
          background: ${isDarkMode ? '#252525' : '#f9f9f9'};
        }

        .doc-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
        }

        .doc-item:hover {
          background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
        }

        .doc-item.active {
          background: var(--accent-color);
          color: white;
        }

        .doc-icon {
          font-size: 20px;
          opacity: 0.8;
        }

        .doc-name {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }

        .doc-meta {
          font-size: 11px;
          opacity: 0.6;
        }

        .docs-viewer {
          flex: 1;
          overflow-y: auto;
          padding: 30px;
          position: relative;
        }

        .blog-view {
          max-width: 700px;
          margin: 0 auto;
        }

        .blog-header h1 {
          font-size: 28px;
          margin: 0 0 15px 0;
          font-weight: 700;
        }

        .blog-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 12px;
          opacity: 0.6;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
        }

        .delete-btn {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #ff453a;
          cursor: pointer;
          padding: 5px;
        }

        .blog-body p {
          line-height: 1.6;
          margin-bottom: 15px;
          font-size: 15px;
        }

        .viewer-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          opacity: 0.3;
        }

        .viewer-empty i {
          font-size: 60px;
          margin-bottom: 15px;
        }

        .docs-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .docs-modal {
          background: ${isDarkMode ? '#2c2c2e' : '#fff'};
          width: 500px;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: ${isDarkMode ? '#eee' : '#333'};
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          font-size: 12px;
          margin-bottom: 5px;
          opacity: 0.7;
        }

        .form-group input, .form-group textarea {
          width: 100%;
          background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
          border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 6px;
          padding: 10px;
          color: inherit;
          font-family: inherit;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        .cancel-btn {
          background: transparent;
          border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
          color: inherit;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .submit-btn {
          background: var(--accent-color);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .empty-state {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
