import React from 'react';
import { 
  SiJavascript, SiTypescript, SiReact, SiCss3, SiHtml5, 
  SiJson, SiPython, SiGit, SiNpm, SiVite
} from 'react-icons/si';
import { 
  FaFileCode, FaFileImage, FaFileArchive, FaFilePdf,
  FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileVideo, FaFileAudio,
  FaCog
} from 'react-icons/fa';

/**
 * File Icons Utility
 * Provides language-specific icons for different file types
 */

export const getFileIcon = (fileName, size = 'w-4 h-4') => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const iconSize = size === 'w-4 h-4' ? 16 : size === 'w-5 h-5' ? 20 : 16;
  
  switch (extension) {
    // JavaScript/TypeScript
    case 'js':
      return <SiJavascript className={`${size} text-yellow-400`} size={iconSize} title="JavaScript" />;
    case 'jsx':
      return <SiReact className={`${size} text-blue-400`} size={iconSize} title="React JSX" />;
    case 'ts':
      return <SiTypescript className={`${size} text-blue-500`} size={iconSize} title="TypeScript" />;
    case 'tsx':
      return <SiReact className={`${size} text-blue-600`} size={iconSize} title="React TypeScript" />;
    
    // CSS/Styling
    case 'css':
      return <SiCss3 className={`${size} text-blue-400`} size={iconSize} title="CSS" />;
    case 'scss':
    case 'sass':
    case 'less':
      return <SiCss3 className={`${size} text-pink-400`} size={iconSize} title="CSS" />;
    
    // HTML
    case 'html':
    case 'htm':
      return <SiHtml5 className={`${size} text-orange-500`} size={iconSize} title="HTML" />;
    
    // JSON/Data
    case 'json':
      return <SiJson className={`${size} text-green-400`} size={iconSize} title="JSON" />;
    case 'xml':
    case 'yaml':
    case 'yml':
      return <FaFileCode className={`${size} text-orange-300`} size={iconSize} title="Data File" />;
    
    // Markdown
    case 'md':
    case 'markdown':
      return <FaFileCode className={`${size} text-gray-400`} size={iconSize} title="Markdown" />;
    
    // Python
    case 'py':
    case 'pyc':
      return <SiPython className={`${size} text-yellow-500`} size={iconSize} title="Python" />;
    
    // Java
    case 'java':
    case 'class':
    case 'jar':
      return <FaFileCode className={`${size} text-red-500`} size={iconSize} title="Java" />;
    
    // C/C++
    case 'c':
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'h':
    case 'hpp':
      return <FaFileCode className={`${size} text-blue-600`} size={iconSize} title="C/C++" />;
    
    // PHP
    case 'php':
      return <FaFileCode className={`${size} text-purple-500`} size={iconSize} title="PHP" />;
    
    // Ruby
    case 'rb':
    case 'erb':
      return <FaFileCode className={`${size} text-red-400`} size={iconSize} title="Ruby" />;
    
    // Go
    case 'go':
      return <FaFileCode className={`${size} text-cyan-500`} size={iconSize} title="Go" />;
    
    // Rust
    case 'rs':
      return <FaFileCode className={`${size} text-orange-600`} size={iconSize} title="Rust" />;
    
    // SQL/Databases
    case 'sql':
    case 'psql':
    case 'mongo':
      return <FaFileCode className={`${size} text-blue-300`} size={iconSize} title="Database" />;
    
    // Shell/Bash
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'ps1':
      return <FaFileCode className={`${size} text-green-500`} size={iconSize} title="Shell" />;
    
    // Docker
    case 'dockerfile':
    case 'docker-compose.yml':
    case 'docker-compose.yaml':
      return <FaFileCode className={`${size} text-blue-500`} size={iconSize} title="Docker" />;
    
    // Git
    case 'gitignore':
    case 'gitattributes':
      return <SiGit className={`${size} text-red-400`} size={iconSize} title="Git" />;
    
    // Package managers
    case 'package.json':
      return <SiNpm className={`${size} text-green-500`} size={iconSize} title="Package.json" />;
    case 'yarn.lock':
    case 'webpack.config.js':
      return <FaFileCode className={`${size} text-blue-500`} size={iconSize} title="Config" />;
    
    // Frameworks
    case 'vue':
    case 'angular':
    case 'next.config.js':
      return <FaFileCode className={`${size} text-green-500`} size={iconSize} title="Framework" />;
    case 'vite.config.js':
      return <SiVite className={`${size} text-purple-500`} size={iconSize} title="Vite" />;
    
    // Backend
    case 'server.js':
    case 'app.py':
    case 'requirements.txt':
      return <FaFileCode className={`${size} text-green-600`} size={iconSize} title="Backend" />;
    
    // Configuration files
    case 'env':
    case 'config':
    case 'ini':
      return <FaCog className={`${size} text-gray-400`} size={iconSize} title="Config" />;
    
    // Images
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'ico':
    case 'webp':
      return <FaFileImage className={`${size} text-purple-400`} size={iconSize} title="Image" />;
    
    // Archives
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <FaFileArchive className={`${size} text-orange-400`} size={iconSize} title="Archive" />;
    
    // Documents
    case 'pdf':
      return <FaFilePdf className={`${size} text-red-500`} size={iconSize} title="PDF" />;
    case 'doc':
    case 'docx':
      return <FaFileWord className={`${size} text-blue-500`} size={iconSize} title="Word Document" />;
    case 'xls':
    case 'xlsx':
      return <FaFileExcel className={`${size} text-green-500`} size={iconSize} title="Excel Spreadsheet" />;
    case 'ppt':
    case 'pptx':
      return <FaFilePowerpoint className={`${size} text-orange-500`} size={iconSize} title="PowerPoint" />;
    
    // Media
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return <FaFileVideo className={`${size} text-purple-500`} size={iconSize} title="Video" />;
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return <FaFileAudio className={`${size} text-green-400`} size={iconSize} title="Audio" />;
    
    // Default
    default:
      return <FaFileCode className={`${size} text-gray-400`} size={iconSize} title="File" />;
  }
};

/**
 * Get language name from file extension
 */
export const getLanguageFromFile = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
      return 'javascript';
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
