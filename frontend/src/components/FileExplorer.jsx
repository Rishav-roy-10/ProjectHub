import React, { useState, useEffect, useRef } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import axios from '../config/axios';
import { getFileIcon } from '../utils/fileIcons';

const FileExplorer = ({ projectId, onFileSelect, refreshTrigger, onFileDeleted, onFilesLoaded }) => {
  const [files, setFiles] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [createMenuPosition, setCreateMenuPosition] = useState({ x: 0, y: 0 });
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollMax, setScrollMax] = useState(0);
  const scrollContainerRef = useRef(null);

  // Load files from backend
  useEffect(() => {
    if (projectId) {
      loadProjectFiles();
    }
  }, [projectId, refreshTrigger]);

  // Listen for file save events to refresh content
  useEffect(() => {
    const handleFileSaved = (event) => {
      // Refresh the file tree to get updated content
      if (projectId) {
        loadProjectFiles();
      }
    };

    window.addEventListener('fileSaved', handleFileSaved);
    return () => window.removeEventListener('fileSaved', handleFileSaved);
  }, [projectId]);

  // Check scroll state when files are loaded
  useEffect(() => {
    if (!loading && files.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        handleScroll();
      }, 100);
    }
  }, [loading, files]);

  const loadProjectFiles = async () => {
    try {
      setLoading(true);
      // Use the new tree endpoint for better directory structure
      const response = await axios.get(`/file/project/${projectId}/tree`);
      if (response.data.success) {
        const fileTree = response.data.fileTree;
        setFiles(fileTree);
        
        // Notify parent component about loaded files
        if (onFilesLoaded) {
          const allProjectFiles = flattenFileTree(fileTree);
          onFilesLoaded(allProjectFiles);
        }
        
        // Auto-select first file if no file is currently selected and files exist
        const firstFile = findFirstFile(fileTree);
        if (firstFile && !selectedFile) {
          handleFileClick(firstFile.path);
        }
      }
    } catch (error) {
      console.error('Failed to load project files:', error);
      // Fallback to old endpoint if tree endpoint fails
      try {
        const fallbackResponse = await axios.get(`/file/project/${projectId}`);
        if (fallbackResponse.data.success) {
          const newFiles = fallbackResponse.data.files;
          setFiles(newFiles);
          
          // Notify parent component about loaded files
          if (onFilesLoaded) {
            onFilesLoaded(newFiles);
          }
          
          if (newFiles.length > 0 && !selectedFile) {
            const firstFile = newFiles[0];
            handleFileClick(firstFile.path);
          }
        }
      } catch (fallbackError) {
        console.error('Failed to load project files (fallback):', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const flattenFileTree = (tree, basePath = '') => {
    const files = [];
    for (const [name, item] of Object.entries(tree)) {
      const fullPath = basePath ? `${basePath}/${name}` : name;
      if (item.type === 'file') {
        files.push({
          path: fullPath,
          content: item.content || '',
          language: item.language || 'text'
        });
      } else if (item.children) {
        files.push(...flattenFileTree(item.children, fullPath));
      }
    }
    return files;
  };

  const findFirstFile = (tree) => {
    for (const [, item] of Object.entries(tree)) {
      if (item.type === 'file') return item;
      if (item.children) {
        const firstFile = findFirstFile(item.children);
        if (firstFile) return firstFile;
      }
    }
    return null;
  };

  const countFilesInTree = (tree) => {
    let count = 0;
    for (const [, item] of Object.entries(tree)) {
      if (item.type === 'file') count++;
      else if (item.children) count += countFilesInTree(item.children);
    }
    return count;
  };



  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = async (filePath) => {
    setSelectedFile(filePath);
    if (onFileSelect) {
      onFileSelect(filePath);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    
    try {
      const response = await axios.post(`/file/project/${projectId}/file`, {
        filePath: newFileName,
        content: '// New file created',
        language: 'text'
      });
      
      if (response.data.success) {
        setNewFileName('');
        setShowNewFileInput(false);
        loadProjectFiles();
      } else {
        alert('Failed to create file: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to create file: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const folderPath = `${newFolderName}/.gitkeep`;
      const response = await axios.post(`/file/project/${projectId}/file`, {
        filePath: folderPath,
        content: '# Folder placeholder',
        language: 'text'
      });
      
      if (response.data.success) {
        setNewFolderName('');
        setShowNewFolderInput(false);
        loadProjectFiles();
      } else {
        alert('Failed to create folder: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to create folder: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setCreateMenuPosition({ x: e.clientX, y: e.clientY });
    setShowCreateMenu(true);
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      if (action === 'file') {
        handleCreateFile();
      } else if (action === 'folder') {
        handleCreateFolder();
      }
    } else if (e.key === 'Escape') {
      setShowNewFileInput(false);
      setShowNewFolderInput(false);
      setNewFileName('');
      setNewFolderName('');
    }
  };

  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // Encode the file path for URL safety
      const encodedPath = encodeURIComponent(itemToDelete.path);
      const response = await axios.delete(`/file/project/${projectId}/file/${encodedPath}`);
      
      if (response.data.success) {
        // Notify parent component about file deletion
        if (onFileDeleted) {
          onFileDeleted(itemToDelete.path);
        }
        
        // Remove from selected file if it was deleted
        if (selectedFile === itemToDelete.path) {
          setSelectedFile(null);
          if (onFileSelect) {
            onFileSelect(null);
          }
        }
        loadProjectFiles(); // Refresh the file list
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleDeleteAll = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = async () => {
    try {
      const getAllPaths = (tree) => {
        const paths = [];
        for (const [path, item] of Object.entries(tree)) {
          if (item.type === 'file') {
            paths.push(path);
          } else if (item.children) {
            paths.push(path + '/');
            paths.push(...getAllPaths(item.children));
          }
        }
        return paths;
      };

      const allPaths = getAllPaths(fileTree);
      
      if (allPaths.length === 0) {
        alert('No files to delete.');
        setShowDeleteAllConfirm(false);
        return;
      }

      let deletedCount = 0;
      for (const path of allPaths) {
        try {
          const response = await axios.delete(`/file/project/${projectId}/file/${encodeURIComponent(path)}`);
          if (response.data.success) {
            deletedCount++;
          }
        } catch (error) {
          // Silent fail
        }
      }

      if (deletedCount > 0) {
        alert(`Successfully deleted ${deletedCount} items.`);
        setShowDeleteAllConfirm(false);
        loadProjectFiles();
      } else {
        alert('Failed to delete any items. Please try again.');
      }
    } catch (error) {
      alert('Failed to delete all items. Please try again.');
    }
  };

  const cancelDeleteAll = () => {
    setShowDeleteAllConfirm(false);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      
      setScrollPosition(scrollTop);
      setScrollMax(maxScroll);
      setShowScrollTop(scrollTop > 20);
      setShowScrollBottom(scrollTop < maxScroll - 20);
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ 
        top: scrollContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  };

  const buildFileTree = (files) => {
    const tree = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = { 
            type: 'file', 
            language: file.language,
            path: file.path,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt
          };
        } else {
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} };
          }
          current = current[part].children;
        }
      });
    });
    
    return tree;
  };

  const renderFileTree = (structure, currentPath = '') => {
    return Object.entries(structure).map(([name, item]) => {
      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      const uniqueKey = `file-${fullPath.replace(/[^a-zA-Z0-9]/g, '-')}-${fullPath.length}-${name.length}`;
      
      if (item.type === 'file') {
        return (
          <div
            key={uniqueKey}
            className={`flex items-center justify-between px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 rounded group ${
              selectedFile === fullPath ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
            }`}
            onClick={() => handleFileClick(fullPath)}
            style={{ paddingLeft: `${(fullPath.split('/').length - 1) * 16 + 8}px` }}
          >
            <div className="flex items-center">
              <span className="w-4 h-4 text-gray-400" title={getFileIcon(name)}>{getFileIcon(name)}</span>
              <span className="ml-2">{name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem({ path: fullPath, name, type: 'file' });
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-xs p-1"
              title="Delete file"
            >
              🗑️
            </button>
          </div>
        );
      } else {
        const isExpanded = expandedFolders.has(fullPath);
        const children = item.children || item;
        return (
          <div key={uniqueKey}>
            <div
              className="flex items-center justify-between px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 rounded text-gray-300 group"
              onClick={() => toggleFolder(fullPath)}
              style={{ paddingLeft: `${(fullPath.split('/').length - 1) * 16 + 8}px` }}
            >
              <div className="flex items-center">
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                )}
                <FolderIcon className="w-4 h-4 text-blue-500 ml-1" />
                <span className="ml-2">{name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem({ path: fullPath, name, type: 'folder' });
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-xs p-1"
                title="Delete folder"
              >
                🗑️
              </button>
            </div>
            {isExpanded && (
              <div className="ml-2">
                {renderFileTree(children, fullPath)}
              </div>
            )}
          </div>
        );
      }
    });
  };

  // Use the tree structure directly if it's already a tree, otherwise build it
  const fileTree = typeof files === 'object' && files !== null && !Array.isArray(files) ? files : buildFileTree(files);

  return (
    <div className="bg-gray-800 border-r border-gray-700 w-full flex flex-col h-full">
      {/* File Tree */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto py-2 relative min-h-0"
        onContextMenu={handleContextMenu}
        onClick={() => setShowCreateMenu(false)}
        onScroll={handleScroll}
      >
        <div className="text-xs text-gray-400 px-4 py-1 font-medium flex items-center justify-between">
          <span>PROJECT FILES</span>
          <div className="flex gap-1">
            {/* Scroll indicator */}
            {(showScrollTop || showScrollBottom) && (
              <div className="text-xs text-gray-500 mr-2 flex items-center gap-1">
                <span>📜</span>
                {scrollMax > 0 && (
                  <span className="text-xs">
                    {Math.round((scrollPosition / scrollMax) * 100)}%
                  </span>
                )}
              </div>
            )}
            <button
              onClick={() => setShowNewFileInput(true)}
              className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center justify-center text-gray-300 hover:text-white transition-colors"
              title="New File"
            >
              +
            </button>
            <button
              onClick={() => setShowNewFolderInput(true)}
              className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center justify-center text-gray-300 hover:text-white transition-colors"
              title="New Folder"
            >
              📁
            </button>
            <button
              onClick={handleDeleteAll}
              className="w-5 h-5 bg-red-700 hover:bg-red-600 rounded text-xs flex items-center justify-center text-white hover:text-red-100 transition-colors"
              title="Delete All Files"
            >
              🗑️
            </button>
          </div>
        </div>
        
        {/* New File Input */}
        {showNewFileInput && (
          <div className="px-4 py-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, 'file')}
              placeholder="Enter file name..."
              className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-600 rounded text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 outline-none"
              autoFocus
            />
          </div>
        )}
        
        {/* New Folder Input */}
        {showNewFolderInput && (
          <div className="px-4 py-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, 'folder')}
              placeholder="Enter folder name..."
              className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-600 rounded text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 outline-none"
              autoFocus
            />
          </div>
        )}
        
        {loading ? (
          <div className="px-4 py-2 text-sm text-gray-400">
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="px-4 py-2 text-sm text-gray-400">
            No files yet. Ask AI to create some!
          </div>
        ) : (
          renderFileTree(fileTree)
        )}
        
        {/* Scroll Controls */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="absolute right-2 top-16 z-30 w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200 shadow-lg text-xs"
            title="Scroll to top"
          >
            ↑
          </button>
        )}
        
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute right-2 bottom-16 z-30 w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200 shadow-lg text-xs"
            title="Scroll to bottom"
          >
            ↓
          </button>
        )}
        
        {/* Scroll Progress Bar */}
        {scrollMax > 0 && (showScrollTop || showScrollBottom) && (
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gray-700 z-20">
            <div 
              className="bg-blue-500 transition-all duration-200"
              style={{ 
                height: `${(scrollPosition / scrollMax) * 100}%`,
                minHeight: '2px'
              }}
            />
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-900 px-4 py-2 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          {Array.isArray(files) ? files.length : countFilesInTree(files)} files
        </div>
      </div>

      {/* Context Menu */}
      {showCreateMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowCreateMenu(false)}
          />
          <div 
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 min-w-[150px]"
            style={{ left: createMenuPosition.x, top: createMenuPosition.y }}
          >
            <button
              onClick={() => {
                setShowNewFileInput(true);
                setShowCreateMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 text-sm flex items-center gap-2 transition-colors"
            >
              <span className="text-xs">📄</span>
              New File
            </button>
            <button
              onClick={() => {
                setShowNewFolderInput(true);
                setShowCreateMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 text-sm flex items-center gap-2 transition-colors"
            >
              <span className="text-xs">📁</span>
              New Folder
            </button>
          </div>
        </>
             )}

       {/* Delete Confirmation Modal */}
       {showDeleteConfirm && itemToDelete && (
         <>
           <div 
             className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
             onClick={cancelDelete}
           />
           <div 
             className="fixed z-50 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl py-3 min-w-[300px] max-w-[400px]"
             style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
           >
             <div className="px-4 py-2 border-b border-gray-600">
               <div className="text-sm font-semibold text-gray-200">Confirm Delete</div>
               <div className="text-xs text-gray-400">
                 Are you sure you want to delete this {itemToDelete.type}?
               </div>
             </div>
             <div className="px-4 py-3">
               <div className="text-sm text-gray-300 mb-3">
                 <strong>{itemToDelete.name}</strong>
                 {itemToDelete.type === 'folder' && (
                   <span className="text-red-400 block text-xs mt-1">
                     ⚠️ This will delete the folder and all its contents!
                   </span>
                 )}
               </div>
             </div>
             <div className="px-4 py-2 border-t border-gray-600 flex gap-2">
               <button
                 onClick={cancelDelete}
                 className="flex-1 px-4 py-2 text-center text-gray-400 hover:text-gray-200 text-sm transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={confirmDelete}
                 className="flex-1 px-4 py-2 text-center text-red-400 hover:text-red-300 text-sm transition-colors bg-red-900/20 hover:bg-red-900/30 rounded"
               >
                 Delete
               </button>
             </div>
           </div>
         </>
       )}

       {/* Delete All Confirmation Modal */}
       {showDeleteAllConfirm && (
         <>
           <div 
             className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
             onClick={cancelDeleteAll}
           />
           <div 
             className="fixed z-50 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl py-3 min-w-[400px] max-w-[500px]"
             style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
           >
             <div className="px-4 py-2 border-b border-gray-600">
               <div className="text-sm font-semibold text-red-400">⚠️ Delete All Files</div>
               <div className="text-xs text-gray-400">
                 This action cannot be undone!
               </div>
             </div>
             <div className="px-4 py-3">
               <div className="text-sm text-gray-300 mb-3">
                 <strong>Are you sure you want to delete ALL files and folders in this project?</strong>
                 <span className="text-red-400 block text-xs mt-2">
                   ⚠️ This will permanently delete everything in the current project!
                 </span>
                 <span className="text-gray-400 block text-xs mt-1">
                   Files to be deleted: {Array.isArray(files) ? files.length : countFilesInTree(files)} items
                 </span>
               </div>
             </div>
             <div className="px-4 py-2 border-t border-gray-600 flex gap-2">
               <button
                 onClick={cancelDeleteAll}
                 className="flex-1 px-4 py-2 text-center text-gray-400 hover:text-gray-200 text-sm transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={confirmDeleteAll}
                 className="flex-1 px-4 py-2 text-center text-red-400 hover:text-red-300 text-sm transition-colors bg-red-900/20 hover:bg-red-900/30 rounded"
               >
                 Delete All
               </button>
             </div>
           </div>
         </>
       )}
     </div>
   );
 };

export default FileExplorer;
