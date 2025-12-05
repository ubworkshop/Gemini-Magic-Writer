export function htmlToMarkdown(html: string): string {
  // Create a temporary DOM element to parse the HTML safely
  const div = document.createElement('div');
  div.innerHTML = html;

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      // Basic text
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    let content = '';
    
    // Process children recursively
    el.childNodes.forEach(child => {
      content += processNode(child);
    });

    const tagName = el.tagName.toLowerCase();

    switch (tagName) {
      case 'h1': return `# ${content}\n\n`;
      case 'h2': return `## ${content}\n\n`;
      case 'h3': return `### ${content}\n\n`;
      case 'h4': return `#### ${content}\n\n`;
      case 'h5': return `##### ${content}\n\n`;
      case 'h6': return `###### ${content}\n\n`;
      
      case 'p': return `${content}\n\n`;
      
      case 'strong': 
      case 'b': return `**${content}**`;
      
      case 'em':
      case 'i': return `*${content}*`;
      
      case 'u': return content; // Markdown doesn't standardly support underline
      
      case 'ul': return `${content}\n`;
      case 'ol': return `${content}\n`;
      
      case 'li': 
        // Determine parent type to handle ordered lists if possible, 
        // though standard simple markdown parsers often just default to bullets 
        // if context tracking is complex. 
        // For simplicity here, we check parent.
        const parent = el.parentElement;
        if (parent && parent.tagName.toLowerCase() === 'ol') {
             // To do real numbering we'd need index, but '1.' is often auto-fixed by renderers
             return `1. ${content}\n`; 
        }
        return `- ${content}\n`;
      
      case 'blockquote': return `> ${content}\n\n`;
      
      case 'br': return '\n';
      case 'hr': return '---\n\n';
      
      case 'div': return `${content}\n`;
      
      case 'a': 
        const href = el.getAttribute('href');
        return href ? `[${content}](${href})` : content;

      default: return content;
    }
  }

  // Initial pass and cleanup
  let markdown = processNode(div);
  
  // Collapse multiple newlines (more than 2) into 2
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  return markdown.trim();
}