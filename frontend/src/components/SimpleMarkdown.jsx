import React from 'react';

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatInlineMarkdown = (text) => {
    const escaped = escapeHtml(text);

    return escaped
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
};

const renderMarkdownToHtml = (markdown) => {
    const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let paragraph = [];
    let listItems = [];
    let codeFence = null;
    let codeLines = [];

    const flushParagraph = () => {
        if (!paragraph.length) return;
        blocks.push(`<p>${formatInlineMarkdown(paragraph.join('<br/>'))}</p>`);
        paragraph = [];
    };

    const flushList = () => {
        if (!listItems.length) return;
        blocks.push(`<ul>${listItems.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join('')}</ul>`);
        listItems = [];
    };

    const flushCodeFence = () => {
        if (codeFence === null) return;
        blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeFence = null;
        codeLines = [];
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('```')) {
            if (codeFence !== null) {
                flushCodeFence();
            } else {
                flushParagraph();
                flushList();
                codeFence = trimmed.slice(3).trim() || 'plain';
            }
            continue;
        }

        if (codeFence !== null) {
            codeLines.push(line);
            continue;
        }

        if (!trimmed) {
            flushParagraph();
            flushList();
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            blocks.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
            continue;
        }

        const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
        if (listMatch) {
            flushParagraph();
            listItems.push(listMatch[1]);
            continue;
        }

        paragraph.push(line);
    }

    flushParagraph();
    flushList();
    flushCodeFence();

    return blocks.join('');
};

const SimpleMarkdown = ({ content, className = '' }) => {
    if (!String(content ?? '').trim()) return null;

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
        />
    );
};

export default SimpleMarkdown;
