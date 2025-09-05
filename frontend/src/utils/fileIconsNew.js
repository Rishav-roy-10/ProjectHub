import React from 'react';

/**
 * File Icons Utility
 * Provides language-specific icons for different file types
 */

export const getFileIcon = (fileName, size = 'w-4 h-4') => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    // JavaScript/TypeScript
    case 'js':
      return <span className={`${size} text-yellow-400`} title="JavaScript">⚡</span>;
    case 'jsx':
      return <span className={`${size} text-blue-400`} title="React JSX">⚛️</span>;
    case 'ts':
      return <span className={`${size} text-blue-500`} title="TypeScript">🔷</span>;
    case 'tsx':
      return <span className={`${size} text-blue-600`} title="React TypeScript">⚛️🔷</span>;
    
    // CSS/Styling
    case 'css':
      return <span className={`${size} text-blue-400`} title="CSS">🎨</span>;
    case 'scss':
      return <span className={`${size} text-pink-400`} title="SCSS">💄</span>;
    case 'sass':
      return <span className={`${size} text-pink-500`} title="Sass">💅</span>;
    case 'less':
      return <span className={`${size} text-blue-300`} title="Less">📘</span>;
    
    // HTML
    case 'html':
    case 'htm':
      return <span className={`${size} text-orange-500`} title="HTML">🌐</span>;
    
    // JSON/Data
    case 'json':
      return <span className={`${size} text-green-400`} title="JSON">📋</span>;
    case 'xml':
      return <span className={`${size} text-orange-300`} title="XML">📄</span>;
    case 'yaml':
    case 'yml':
      return <span className={`${size} text-purple-400`} title="YAML">📝</span>;
    
    // Markdown
    case 'md':
    case 'markdown':
      return <span className={`${size} text-gray-400`} title="Markdown">📖</span>;
    
    // Python
    case 'py':
    case 'pyc':
      return <span className={`${size} text-yellow-500`} title="Python">🐍</span>;
    
    // Java
    case 'java':
    case 'class':
    case 'jar':
      return <span className={`${size} text-red-500`} title="Java">☕</span>;
    
    // C/C++
    case 'c':
      return <span className={`${size} text-blue-600`} title="C">🔵</span>;
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'h':
    case 'hpp':
      return <span className={`${size} text-blue-700`} title="C++">🔷</span>;
    
    // PHP
    case 'php':
      return <span className={`${size} text-purple-500`} title="PHP">🐘</span>;
    
    // Ruby
    case 'rb':
    case 'erb':
      return <span className={`${size} text-red-400`} title="Ruby">💎</span>;
    
    // Go
    case 'go':
      return <span className={`${size} text-cyan-500`} title="Go">🐹</span>;
    
    // Rust
    case 'rs':
      return <span className={`${size} text-orange-600`} title="Rust">🦀</span>;
    
    // SQL/Databases
    case 'sql':
      return <span className={`${size} text-blue-300`} title="SQL">🗄️</span>;
    case 'psql':
      return <span className={`${size} text-blue-400`} title="PostgreSQL">🗄️</span>;
    case 'mongo':
      return <span className={`${size} text-green-500`} title="MongoDB">🗄️</span>;
    
    // Shell/Bash
    case 'sh':
    case 'bash':
    case 'zsh':
      return <span className={`${size} text-green-500`} title="Shell">🐚</span>;
    
    // PowerShell
    case 'ps1':
      return <span className={`${size} text-blue-400`} title="PowerShell">⚡</span>;
    
    // Docker
    case 'dockerfile':
    case 'docker-compose.yml':
    case 'docker-compose.yaml':
      return <span className={`${size} text-blue-500`} title="Docker">🐳</span>;
    
    // Git
    case 'gitignore':
    case 'gitattributes':
      return <span className={`${size} text-red-400`} title="Git">🚫</span>;
    
    // Package managers
    case 'package.json':
      return <span className={`${size} text-green-500`} title="Package.json">📦</span>;
    case 'yarn.lock':
      return <span className={`${size} text-blue-400`} title="Yarn">📦</span>;
    case 'webpack.config.js':
      return <span className={`${size} text-blue-500`} title="Webpack">📦</span>;
    
    // Frameworks
    case 'vue':
      return <span className={`${size} text-green-500`} title="Vue.js">⚛️</span>;
    case 'angular':
      return <span className={`${size} text-red-500`} title="Angular">⚛️</span>;
    case 'next.config.js':
      return <span className={`${size} text-gray-800`} title="Next.js">⚛️</span>;
    case 'vite.config.js':
      return <span className={`${size} text-purple-500`} title="Vite">⚡</span>;
    
    // Backend
    case 'server.js':
      return <span className={`${size} text-green-600`} title="Node.js">⚡</span>;
    case 'app.py':
      return <span className={`${size} text-yellow-500`} title="Python App">🐍</span>;
    case 'requirements.txt':
      return <span className={`${size} text-yellow-500`} title="Python Requirements">🐍📋</span>;
    
    // Configuration files
    case 'env':
    case 'config':
    case 'ini':
      return <span className={`${size} text-gray-400`} title="Config">⚙️</span>;
    
    // Images
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'ico':
    case 'webp':
      return <span className={`${size} text-purple-400`} title="Image">🖼️</span>;
    
    // Archives
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <span className={`${size} text-orange-400`} title="Archive">📦</span>;
    
    // Documents
    case 'pdf':
      return <span className={`${size} text-red-500`} title="PDF">📄</span>;
    case 'doc':
    case 'docx':
      return <span className={`${size} text-blue-500`} title="Word Document">📄</span>;
    case 'xls':
    case 'xlsx':
      return <span className={`${size} text-green-500`} title="Excel Spreadsheet">📊</span>;
    case 'ppt':
    case 'pptx':
      return <span className={`${size} text-orange-500`} title="PowerPoint">📊</span>;
    
    // Media
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return <span className={`${size} text-purple-500`} title="Video">🎥</span>;
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return <span className={`${size} text-green-400`} title="Audio">🎵</span>;
    
    // Default
    default:
      return <span className={`${size} text-gray-400`} title="File">📄</span>;
  }
};

/**
 * Get language name from file extension
 */
export const getLanguageFromFile = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'jsx';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
    case 'htm':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
      return 'c';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'bash';
    case 'ps1':
      return 'powershell';
    case 'xml':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    default:
      return 'javascript';
  }
};
