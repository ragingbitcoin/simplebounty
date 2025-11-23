import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Parses markdown frontmatter and extracts title and body
 * @param {string} text - The markdown text with optional frontmatter
 * @returns {{title: string|null, body: string}} - Object with title and body
 */
export function parseMarkdownWithFrontmatter(text) {
  if (!text) {
    return { title: null, body: text || '' };
  }

  // Check for frontmatter pattern: ---\ntitle: ...\n---
  // Match title on the same line or next line, handle multiline titles
  const frontmatterRegex = /^---\s*\ntitle:\s*([^\n]+?)\s*\n---\s*\n?(.*)$/s;
  const match = text.match(frontmatterRegex);

  if (match) {
    const title = match[1].trim();
    return {
      title: title || null,
      body: match[2] || '',
    };
  }

  // No frontmatter found, return original text as body
  return {
    title: null,
    body: text,
  };
}

/**
 * Formats text with markdown frontmatter
 * @param {string} title - The title to include in frontmatter
 * @param {string} body - The body text
 * @returns {string} - Formatted markdown with frontmatter
 */
export function formatMarkdownWithFrontmatter(title, body) {
  if (!title || !title.trim()) {
    return body || '';
  }

  // Escape newlines in title (replace with space)
  const sanitizedTitle = title.trim().replace(/\n/g, ' ');
  const frontmatter = `---\ntitle: ${sanitizedTitle}\n---\n\n`;
  return frontmatter + (body || '');
}

/**
 * React component wrapper for rendering markdown
 * @param {string} markdown - The markdown text to render
 * @param {object} className - Additional className for the wrapper
 * @returns {JSX.Element} - React component rendering the markdown
 */
export function MarkdownRenderer({ markdown, className = '' }) {
  if (!markdown) {
    return null;
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

