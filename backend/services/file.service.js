// In-memory file storage for AI-created files
const projectFiles = new Map();

// Helper function to create directory structure
const createDirectoryStructure = (filePath) => {
  const parts = filePath.split('/');
  const fileName = parts.pop(); // Remove the file name
  const directories = parts;
  
  return {
    directories,
    fileName,
    fullPath: filePath
  };
};

// Helper function to build file tree structure
const buildFileTree = (files) => {
  const tree = {};
  
  files.forEach(file => {
    const { directories, fileName, fullPath } = createDirectoryStructure(file.path);
    let currentLevel = tree;
    
    // Create directory structure
    directories.forEach(dir => {
      if (!currentLevel[dir]) {
        currentLevel[dir] = { type: 'folder', children: {} };
      }
      currentLevel = currentLevel[dir].children;
    });
    
    // Add file at the end
    currentLevel[fileName] = {
      type: 'file',
      path: fullPath,
      language: file.language,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    };
  });
  
  return tree;
};

export const createFile = (projectId, filePath, content, language) => {
  if (!projectFiles.has(projectId)) {
    projectFiles.set(projectId, new Map());
  }
  
  const projectFileMap = projectFiles.get(projectId);
  projectFileMap.set(filePath, {
    content,
    language,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  console.log(`Created file: ${filePath} in project ${projectId}`);
  return { success: true, filePath };
};

export const getFile = (projectId, filePath) => {
  if (!projectFiles.has(projectId)) {
    return null;
  }
  
  const projectFileMap = projectFiles.get(projectId);
  return projectFileMap.get(filePath) || null;
};

export const getProjectFiles = (projectId) => {
  if (!projectFiles.has(projectId)) {
    return [];
  }
  
  const projectFileMap = projectFiles.get(projectId);
  const files = [];
  
  for (const [filePath, fileData] of projectFileMap.entries()) {
    files.push({
      path: filePath,
      language: fileData.language,
      createdAt: fileData.createdAt,
      updatedAt: fileData.updatedAt
    });
  }
  
  return files.sort((a, b) => a.path.localeCompare(b.path));
};

// New function to get file tree structure
export const getProjectFileTree = (projectId) => {
  const files = getProjectFiles(projectId);
  return buildFileTree(files);
};

export const updateFile = (projectId, filePath, content) => {
  if (!projectFiles.has(projectId)) {
    return { success: false, error: 'Project not found' };
  }
  
  const projectFileMap = projectFiles.get(projectId);
  if (!projectFileMap.has(filePath)) {
    return { success: false, error: 'File not found' };
  }
  
  const fileData = projectFileMap.get(filePath);
  fileData.content = content;
  fileData.updatedAt = new Date();
  
  return { success: true, filePath };
};

export const deleteFile = (projectId, filePath) => {
  console.log(`Attempting to delete file: ${filePath} from project: ${projectId}`);
  
  if (!projectFiles.has(projectId)) {
    console.log('Project not found:', projectId);
    return { success: false, error: 'Project not found' };
  }
  
  const projectFileMap = projectFiles.get(projectId);
  console.log('Project files:', Array.from(projectFileMap.keys()));
  
  // Check if this is a folder (ends with /) or a file
  if (filePath.endsWith('/')) {
    // Delete all files in the folder
    const folderPath = filePath;
    const filesToDelete = [];
    
    for (const [path] of projectFileMap.entries()) {
      if (path.startsWith(folderPath)) {
        filesToDelete.push(path);
      }
    }
    
    console.log('Files to delete in folder:', filesToDelete);
    
    let deletedCount = 0;
    filesToDelete.forEach(path => {
      if (projectFileMap.delete(path)) {
        deletedCount++;
      }
    });
    
    console.log('Deleted files count:', deletedCount);
    return { success: deletedCount > 0, filePath, deletedCount };
  } else {
    // Delete single file
    const deleted = projectFileMap.delete(filePath);
    console.log('Delete result:', deleted);
    return { success: deleted, filePath };
  }
};

export const renameFile = (projectId, oldPath, newPath) => {
  console.log(`Attempting to rename: ${oldPath} to ${newPath} in project: ${projectId}`);
  
  if (!projectFiles.has(projectId)) {
    console.log('Project not found:', projectId);
    return { success: false, error: 'Project not found' };
  }
  
  const projectFileMap = projectFiles.get(projectId);
  
  // Check if old file exists
  if (!projectFileMap.has(oldPath)) {
    console.log('Old file not found:', oldPath);
    return { success: false, error: 'File not found' };
  }
  
  // Check if new path already exists
  if (projectFileMap.has(newPath)) {
    console.log('New path already exists:', newPath);
    return { success: false, error: 'File already exists' };
  }
  
  // Get the file data
  const fileData = projectFileMap.get(oldPath);
  
  // Check if this is a folder rename
  if (oldPath.endsWith('/')) {
    // Rename all files in the folder
    const oldFolderPath = oldPath;
    const newFolderPath = newPath;
    const filesToRename = [];
    
    for (const [path] of projectFileMap.entries()) {
      if (path.startsWith(oldFolderPath)) {
        filesToRename.push(path);
      }
    }
    
    console.log('Files to rename in folder:', filesToRename);
    
    let renamedCount = 0;
    filesToRename.forEach(oldFilePath => {
      const newFilePath = oldFilePath.replace(oldFolderPath, newFolderPath);
      const fileData = projectFileMap.get(oldFilePath);
      
      // Delete old file
      projectFileMap.delete(oldFilePath);
      
      // Create new file with updated path
      projectFileMap.set(newFilePath, {
        ...fileData,
        updatedAt: new Date()
      });
      
      renamedCount++;
    });
    
    console.log('Renamed files count:', renamedCount);
    return { success: renamedCount > 0, oldPath, newPath, renamedCount };
  } else {
    // Rename single file
    // Delete old file
    projectFileMap.delete(oldPath);
    
    // Create new file with updated path
    projectFileMap.set(newPath, {
      ...fileData,
      updatedAt: new Date()
    });
    
    console.log('File renamed successfully');
    return { success: true, oldPath, newPath };
  }
};
