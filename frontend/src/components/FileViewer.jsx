import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getFileIcon, getLanguageFromFile } from '../utils/fileIcons.jsx';
import axios from '../config/axios';
import { bootWebContainer, mountProject, runNpmInstall, runNpmStart, onServerReady, stopAllProcesses } from '../utils/webcontainer.js';

const FileViewer = ({ projectId, openFiles, activeFileIndex, onTabClick, onCloseFile, onFileContentUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionType, setExecutionType] = useState('iframe'); // 'iframe' or 'api'
  const [inputData, setInputData] = useState('');
  const [showInputField, setShowInputField] = useState(false);
  const [wcRunning, setWcRunning] = useState(false);
  const [wcUrl, setWcUrl] = useState('');
  const [wcLogs, setWcLogs] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const prevActiveFileIndex = useRef(activeFileIndex);
  const prevOpenFilesLength = useRef(openFiles.length);

  // Update execution type when active file changes
  useEffect(() => {
    if (openFiles[activeFileIndex]) {
      const language = getLanguageFromFile(openFiles[activeFileIndex].path);
      const isIframeLanguage = ['html', 'css', 'javascript', 'js'].includes(language.toLowerCase());
      setExecutionType(isIframeLanguage ? 'iframe' : 'api');
      setShowInputField(!isIframeLanguage);
    }
  }, [activeFileIndex, openFiles]);

  useEffect(() => {
    setEditedContent(openFiles[activeFileIndex]?.content ?? '');
  }, [activeFileIndex, openFiles]);

  // Reset WebContainer state when switching files or when files change
  useEffect(() => {
    const resetState = async () => {
      // Only clean up if we actually switched files or files were deleted
      const fileChanged = prevActiveFileIndex.current !== activeFileIndex;
      const filesChanged = prevOpenFilesLength.current !== openFiles.length;
      
      if ((fileChanged || filesChanged) && wcRunning) {
        console.log('File changed, cleaning up WebContainer processes...');
        await stopAllProcesses();
        setWcRunning(false);
        setWcUrl('');
        setWcLogs('');
        setShowPreview(false);
        setLoadingProgress(0);
        setLoadingStage('');
      }
      
      // Update refs
      prevActiveFileIndex.current = activeFileIndex;
      prevOpenFilesLength.current = openFiles.length;
    };
    
    resetState();
  }, [activeFileIndex, openFiles.length, wcRunning]);

  const handleCopy = async () => {
    const activeFile = openFiles[activeFileIndex];
    if (!activeFile) return;

    try {
      await navigator.clipboard.writeText(editedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = editedContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunCode = async () => {
    const activeFile = openFiles[activeFileIndex];
    if (!activeFile || !editedContent) return;

    const language = getLanguageFromFile(activeFile.path);
    
    try {
      setIsExecuting(true);
      setExecutionResult(null);
      
      // Stop any running WebContainer processes first
      console.log('Stopping any existing WebContainer processes...');
      await stopAllProcesses();
      setWcRunning(false);
      setWcUrl('');
      setWcLogs('');
      setShowPreview(false);
      setLoadingProgress(0);
      setLoadingStage('');
      
      // Wait a bit for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 1) JavaScript/JSX → WebContainer (Run whole project)
             if (language === 'javascript' || activeFile.path.endsWith('.js') || activeFile.path.endsWith('.jsx')) {
         try {
           // Reset progress and logs
           setLoadingProgress(0);
           setLoadingStage('');
           setWcLogs('');
           setWcUrl('');
           
           // Get all project files to mount the complete project
           const projectFiles = {};
          
          // Add all open files to the project with safe paths
          openFiles.forEach(file => {
            if (file.content) {
              // Create a simple, safe filename for WebContainer
              let safePath = file.path;
              
              // Remove leading slash
              if (safePath.startsWith('/')) {
                safePath = safePath.substring(1);
              }
              
              // Flatten the path structure to avoid WebContainer issues
              // Convert src/main.js to main.js, backend/app.js to app.js, etc.
              const pathParts = safePath.split('/');
              const fileName = pathParts[pathParts.length - 1]; // Get just the filename
              
              // Ensure it has a .js extension for JavaScript files
              let finalPath = fileName;
              if (file.path.endsWith('.js') || file.path.endsWith('.jsx') || file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
                finalPath = fileName.replace(/\.(jsx|ts|tsx)$/, '.js');
              }
              
              // If it's a React/JSX file, create a simple Node.js version
              if (file.path.endsWith('.jsx') || file.path.endsWith('.tsx')) {
                const nodeContent = `
// Converted from ${file.path}
console.log('This is a React/JSX file converted for Node.js execution');
console.log('Original content:');
${file.content.split('\n').map(line => `console.log('${line.replace(/'/g, "\\'")}');`).join('\n')}
                `;
                projectFiles[finalPath] = { file: { contents: nodeContent } };
              } else {
                projectFiles[finalPath] = { file: { contents: file.content } };
              }
            }
          });
          
                     // Check if we have a package.json, if not create one
           const hasPackageJson = openFiles.some(file => file.path.endsWith('package.json'));
           if (!hasPackageJson) {
             const usesRequire = /require\(/.test(editedContent || '');
             const usesImport = /\bimport\s+.*from\s+['"].+['"]/m.test(editedContent || '');
             const isServer = (editedContent || '').includes('app.listen') || (editedContent || '').includes('server.listen');
             
             // Only add dependencies if actually needed
             const dependencies = {};
             if (isServer && usesRequire) {
               dependencies.express = '^4.19.2';
             }
             
             projectFiles['package.json'] = {
               file: {
                 contents: JSON.stringify({
                   name: 'wc-project',
                   version: '1.0.0',
                   ...(usesImport && !usesRequire ? { type: 'module' } : {}),
                   scripts: {
                     start: 'node server.js'
                   },
                   ...(Object.keys(dependencies).length > 0 ? { dependencies } : {})
                 }, null, 2)
               }
             };
           }
          
          // Ensure we have a server.js file to run
          if (!projectFiles['server.js'] && !projectFiles['app.js'] && !projectFiles['main.js']) {
            // Create a simple server.js from the current file
            const mainFile = openFiles[activeFileIndex];
            if (mainFile && mainFile.content) {
              let serverContent = mainFile.content;
              
                             // If it's not already a server, just run the code directly
               // No need to wrap it - just use the original code as-is
              
              projectFiles['server.js'] = { file: { contents: serverContent } };
            }
                     }

           // Reset progress
           setLoadingProgress(0);
           setLoadingStage('Initializing WebContainer...');
           
           await bootWebContainer();
           setLoadingProgress(20);
           setLoadingStage('Mounting project files...');
           
           await mountProject(projectFiles);
           setLoadingProgress(40);
           
           // Check if we actually need to install dependencies
           const needsInstall = Object.keys(projectFiles).some(file => file.includes('package.json'));
           
           if (needsInstall) {
             setLoadingStage('Installing dependencies...');
             setWcLogs('Installing...\n');
             
             const install = await runNpmInstall();
             const iReader = install.output.getReader();
             (async function iPump(){
               let installProgress = 40;
               while (true) {
                 const { done, value } = await iReader.read();
                 if (done) break;
                 
                 const output = typeof value === 'string' ? value : new TextDecoder().decode(value);
                 setWcLogs(prev => prev + output);
                 
                 // Update progress based on npm install output
                 if (output.includes('up to date') || output.includes('added') || output.includes('changed')) {
                   installProgress = Math.min(70, installProgress + 5);
                   setLoadingProgress(installProgress);
                 }
               }
               setLoadingProgress(70);
               setLoadingStage('Dependencies installed, starting server...');
               setWcLogs(prev => prev + 'Starting...\n');
             })();
             await new Promise(resolve => install.exit.then(resolve));
           } else {
             setLoadingProgress(70);
             setLoadingStage('Starting server...');
             setWcLogs('Starting...\n');
           }
          
          // Try to find the main entry point
          let startCommand = 'node server.js';
          
          // Check what files we actually have
          if (projectFiles['main.js']) {
            startCommand = 'node main.js';
          } else if (projectFiles['app.js']) {
            startCommand = 'node app.js';
          } else if (projectFiles['server.js']) {
            startCommand = 'node server.js';
          }
          
          const packageJsonFile = openFiles.find(file => file.path.endsWith('package.json'));
          if (packageJsonFile) {
            try {
              const pkg = JSON.parse(packageJsonFile.content);
              if (pkg.main) {
                // Map the main file to our flattened structure
                const mainFileName = pkg.main.split('/').pop().replace(/\.(jsx|ts|tsx)$/, '.js');
                if (projectFiles[mainFileName]) {
                  startCommand = `node ${mainFileName}`;
                }
              } else if (pkg.scripts && pkg.scripts.start) {
                startCommand = 'npm start';
              }
            } catch (error) {
              console.warn('Could not parse package.json, using default start command:', error);
            }
          }

          setLoadingProgress(80);
          setLoadingStage('Starting server...');
          
          const proc = startCommand === 'start' ? await runNpmStart() : await runNpmStart(startCommand);
          const reader = proc.output.getReader();
          setWcRunning(true);
          
          // Set up server ready listener
          let serverReadyFired = false;
          onServerReady(({ url }) => {
            console.log('onServerReady fired with URL:', url);
            serverReadyFired = true;
            setWcUrl(url);
            setLoadingProgress(100);
            setLoadingStage('Server ready!');
            clearTimeout(serverTimeout);
          });
          
          // Add timeout for server startup
          const serverTimeout = setTimeout(() => {
            if (!wcUrl) {
              setLoadingProgress(95);
              setLoadingStage('Server taking longer than expected...');
              console.log('Server startup timeout - trying manual URL');
              console.log('Current logs:', wcLogs);
              setWcUrl('http://localhost:3000');
            }
          }, 30000); // Increased to 30 seconds
           
           // Stream output and detect server startup
           (async function pump(){
             let serverStarted = false;
             while (true) {
               const { done, value } = await reader.read();
               if (done) break;
               
               const output = typeof value === 'string' ? value : new TextDecoder().decode(value);
               setWcLogs(prev => prev + output);
               
               // Check if server started successfully with more patterns
               const serverPatterns = [
                 'Server running at',
                 'listening on port',
                 '🚀',
                 'http://localhost',
                 'Server is running',
                 'listening on',
                 'started on port',
                 'Express server'
               ];
               
               // Exclude error messages and port conflicts
               const errorPatterns = [
                 'error:',
                 'eaddrinuse',
                 'address already in use',
                 'port already in use',
                 'cannot bind',
                 'permission denied',
                 'enotfound',
                 'econnrefused'
               ];
               
               const hasError = errorPatterns.some(pattern => output.toLowerCase().includes(pattern.toLowerCase()));
               const serverDetected = !hasError && serverPatterns.some(pattern => output.toLowerCase().includes(pattern.toLowerCase()));
               
               // Handle port conflicts and errors
               if (hasError && output.toLowerCase().includes('eaddrinuse')) {
                 console.log('Port conflict detected, trying to resolve...');
                 setLoadingStage('Port conflict detected, trying alternative port...');
                 
                 // Try to kill existing processes and restart
                 try {
                   const wc = await bootWebContainer();
                   await wc.spawn('pkill', ['-f', 'node']);
                   await new Promise(resolve => setTimeout(resolve, 2000));
                   
                   // Restart the server
                   const newProc = await runNpmStart(startCommand);
                   const newReader = newProc.output.getReader();
                   
                   // Continue with new process
                   (async function pumpNew(){
                     while (true) {
                       const { value, done } = await newReader.read();
                       if (done) break;
                       
                       const newOutput = typeof value === 'string' ? value : new TextDecoder().decode(value);
                       setWcLogs(prev => prev + '\n--- Restarted ---\n' + newOutput);
                       
                       // Check for successful server startup
                       const newHasError = errorPatterns.some(pattern => newOutput.toLowerCase().includes(pattern.toLowerCase()));
                       const newServerDetected = !newHasError && serverPatterns.some(pattern => newOutput.toLowerCase().includes(pattern.toLowerCase()));
                       
                       if (newServerDetected) {
                         console.log('Server started successfully after restart:', newOutput);
                         setLoadingProgress(95);
                         setLoadingStage('Server is running, preparing preview...');
                         clearTimeout(serverTimeout);
                         
                         setTimeout(async () => {
                           if (!wcUrl) {
                             try {
                               const url = wc.url;
                               if (url) {
                                 console.log('Got WebContainer URL after restart:', url);
                                 setWcUrl(url);
                               } else {
                                 setWcUrl('http://localhost:3000');
                               }
                             } catch (error) {
                               console.warn('Could not get WebContainer URL after restart:', error);
                               setWcUrl('http://localhost:3000');
                             }
                           }
                         }, 3000);
                         break;
                       }
                     }
                   })();
                 } catch (error) {
                   console.error('Failed to resolve port conflict:', error);
                   setLoadingStage('Port conflict - using fallback URL');
                   setWcUrl('http://localhost:3000');
                 }
                 return;
               }
               
               if (!serverStarted && serverDetected) {
                 serverStarted = true;
                 setLoadingProgress(95);
                 setLoadingStage('Server is running, preparing preview...');
                 console.log('Detected server startup in logs:', output);
                 
                 // Clear the timeout since server started
                 clearTimeout(serverTimeout);
                 
                 // Try to get the WebContainer URL manually if onServerReady didn't fire
                 setTimeout(async () => {
                   if (!serverReadyFired && !wcUrl) {
                     try {
                       const wc = await bootWebContainer();
                       const url = wc.url;
                       if (url) {
                         console.log('Got WebContainer URL manually:', url);
                         setWcUrl(url);
                       } else {
                         console.log('WebContainer URL not available, using localhost fallback');
                         setWcUrl('http://localhost:3000');
                       }
                     } catch (error) {
                       console.warn('Could not get WebContainer URL:', error);
                       setWcUrl('http://localhost:3000');
                     }
                   } else if (serverReadyFired) {
                     console.log('Server ready already fired, skipping fallback');
                   } else {
                     console.log('WebContainer URL already set:', wcUrl);
                   }
                 }, 2000); // Reduced wait time
               }
             }
           })();
          setShowPreview(true);
          return;
        } catch (wcError) {
          console.error('WebContainer error:', wcError);
          setExecutionResult({ success:false, status:'Error', error: wcError.message });
          setShowPreview(true);
          return;
        }
      }

      // 2) HTML/CSS → iframe
      if (executionType === 'iframe') {
        // Execute in iframe for HTML, CSS, JavaScript
        let htmlContent = '';
        
        if (language === 'html' || activeFile.path.endsWith('.html')) {
          htmlContent = editedContent;
        } else if (language === 'css' || activeFile.path.endsWith('.css')) {
          htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>CSS Preview</title>
              <style>${editedContent}</style>
            </head>
            <body>
              <div class="demo-content">
                <h1>CSS Preview</h1>
                <p>This is a demo paragraph to show your CSS styles.</p>
                <button class="demo-button">Demo Button</button>
                <div class="demo-box">Demo Box</div>
                <div class="demo-card">
                  <h3>Demo Card</h3>
                  <p>This card demonstrates various CSS properties.</p>
                </div>
              </div>
            </body>
            </html>
          `;
        } else if (language === 'javascript' || activeFile.path.endsWith('.js')) {
          htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>JavaScript Preview</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                #output { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .error { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 4px; border-left: 4px solid #dc2626; }
                .success { color: #059669; background: #f0fdf4; padding: 10px; border-radius: 4px; border-left: 4px solid #059669; }
                .warning { color: #d97706; background: #fffbeb; padding: 10px; border-radius: 4px; border-left: 4px solid #d97706; }
                .info { color: #2563eb; background: #eff6ff; padding: 10px; border-radius: 4px; border-left: 4px solid #2563eb; }
                .console { background: #1f2937; color: #f9fafb; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 10px; }
                .console div { margin: 2px 0; }
                .console .log { color: #10b981; }
                .console .error { color: #ef4444; }
                .console .warn { color: #f59e0b; }
                .console .info { color: #3b82f6; }
              </style>
            </head>
            <body>
              <div id="output">
                <h2>JavaScript Output</h2>
                <div id="result"></div>
                <div id="console" class="console"></div>
              </div>
              <script>
                // Override console methods to capture output
                const originalLog = console.log;
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalInfo = console.info;
                
                const consoleDiv = document.getElementById('console');
                const resultDiv = document.getElementById('result');
                
                function addToConsole(message, type = 'log') {
                  const div = document.createElement('div');
                  div.className = type;
                  div.textContent = \`[\${type.toUpperCase()}] \${message}\`;
                  consoleDiv.appendChild(div);
                }
                
                console.log = (...args) => {
                  originalLog.apply(console, args);
                  addToConsole(args.join(' '), 'log');
                };
                
                console.error = (...args) => {
                  originalError.apply(console, args);
                  addToConsole(args.join(' '), 'error');
                };
                
                console.warn = (...args) => {
                  originalWarn.apply(console, args);
                  addToConsole(args.join(' '), 'warn');
                };
                
                console.info = (...args) => {
                  originalInfo.apply(console, args);
                  addToConsole(args.join(' '), 'info');
                }
                
                // Check if code contains Node.js specific syntax
                const code = \`${editedContent}\`;
                const nodeJsPatterns = [
                  'require(', 'module.exports', 'exports.', 'process.', 'Buffer', 'global.',
                  '__dirname', '__filename', 'setImmediate', 'clearImmediate'
                ];
                
                const hasNodeJsCode = nodeJsPatterns.some(pattern => code.includes(pattern));
                
                if (hasNodeJsCode) {
                  resultDiv.innerHTML = \`
                    <div class="warning">
                      <strong>⚠️ Node.js Code Detected</strong><br>
                      This code contains Node.js-specific features that won't work in the browser.<br>
                      <br>
                      <strong>Detected patterns:</strong><br>
                      \${nodeJsPatterns.filter(pattern => code.includes(pattern)).map(p => '• ' + p).join('<br>')}
                      <br><br>
                      <strong>Solutions:</strong><br>
                      • Use browser-compatible JavaScript<br>
                      • Replace \`require()\` with ES6 imports<br>
                      • Use browser APIs instead of Node.js APIs
                    </div>
                  \`;
                  addToConsole('Node.js code detected - some features may not work in browser', 'warn');
                } else {
                  try {
                    // Execute the JavaScript code
                    eval(code);
                    addToConsole('Code executed successfully', 'success');
                  } catch (error) {
                    resultDiv.innerHTML = \`<div class="error"><strong>❌ JavaScript Error:</strong> \${error.message}</div>\`;
                    addToConsole(\`Error: \${error.message}\`, 'error');
                  }
                }
              </script>
            </body>
            </html>
          `;
        }
        
        setPreviewCode(htmlContent);
        setShowPreview(true);
      } else {
        // 3) Other languages → Not supported (RapidAPI removed)
        setExecutionResult({ success:false, status:'Unsupported', error:`Execution for ${language} is not enabled.` });
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setExecutionResult({
        success: false,
        status: 'Error',
        error: error.message || 'Code execution failed'
      });
      setShowPreview(true);
    } finally {
      setIsExecuting(false);
    }
  };

  const activeFile = openFiles[activeFileIndex];

  if (openFiles.length === 0) {
    return (
      <div className="flex-1 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium mb-2">No Files Open</h3>
          <p className="text-sm">Select a file from the explorer to view its content</p>
        </div>
      </div>
    );
  }

  const language = activeFile ? getLanguageFromFile(activeFile.path) : 'javascript';

  return (
    <div className="flex-1 bg-gray-900 flex flex-col h-full min-h-0">
      {/* Tab Bar */}
      <div className="bg-gray-800 border-b border-gray-700 flex items-center overflow-x-auto">
        {openFiles.map((file, index) => {
          const isActive = index === activeFileIndex;
          const fileName = file.path.split('/').pop();
          
          return (
            <div
              key={`${file.path}-${index}`}
              className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer min-w-0 flex-shrink-0 transition-colors ${
                isActive 
                  ? 'bg-gray-900 text-gray-200' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-300'
              }`}
              onClick={() => onTabClick(index)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(fileName, 'w-4 h-4')}
                <span className="text-sm font-medium truncate" title={file.path}>
                  {fileName}
                </span>
                {file.isLoading && (
                  <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(index);
                }}
                className={`ml-2 p-1 rounded hover:bg-gray-700 transition-colors ${
                  isActive ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-300'
                }`}
                title="Close tab"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* File Header */}
      {activeFile && (
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
            {getFileIcon(activeFile.path, 'w-5 h-5')}
            <span className="ml-2 text-sm font-medium text-gray-200">{activeFile.path}</span>
          <span className="ml-2 px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">
            {language.toUpperCase()}
          </span>
            {projectId && (
              <span className="ml-2 px-2 py-1 bg-blue-600 text-xs text-white rounded">
                🆔 {projectId.substring(0, 8)}...
              </span>
            )}
        </div>
        <div className="flex items-center gap-2">
            {/* Run in WebContainer */}
            {language === 'javascript' && (
              <button
                onClick={async () => {
                  try {
                    const pkg = {
                      name: 'wc-app',
                      type: 'module',
                      scripts: { start: 'node server.js' },
                      dependencies: { express: '^4.19.2' }
                    };
                    await bootWebContainer();
                    await mountProject({
                      'package.json': { file: { contents: JSON.stringify(pkg, null, 2) } },
                      'server.js': { file: { contents: editedContent || 'console.log("Hello")' } }
                    });
                    setWcLogs('Installing...\n');
                    await runNpmInstall();
                    setWcLogs(prev => prev + 'Starting...\n');
                    const proc = await runNpmStart();
                    const reader = proc.output.getReader();
                    setWcRunning(true);
                    onServerReady(({ url }) => setWcUrl(url));
                    (async function pump(){
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        setWcLogs(prev => prev + new TextDecoder().decode(value));
                      }
                    })();
                    setShowPreview(true);
                  } catch (e) {
                    console.error('WebContainer error:', e);
                    setWcLogs(prev => prev + `\nError: ${e.message}`);
                    setShowPreview(true);
                  }
                }}
                className="transition-colors p-2 rounded hover:bg-gray-700 text-blue-400 hover:text-blue-300"
                title="Run in WebContainer"
              >
                WebContainer
              </button>
            )}
            {/* Input Data Field (for API execution) */}
            {showInputField && (
              <div className="relative">
                <input
                  type="text"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Input data..."
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-xs text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500 w-32"
                />
              </div>
            )}

            {/* Run Code Button */}
            <button
              onClick={handleRunCode}
              disabled={isExecuting}
              className={`transition-colors p-2 rounded hover:bg-gray-700 flex items-center gap-2 ${
                isExecuting 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-green-400 hover:text-green-300'
              }`}
              title={isExecuting ? 'Executing...' : 'Run code'}
            >
              {isExecuting ? (
                <div className="w-5 h-5 border border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="w-5 h-5">▶️</div>
              )}
              <span className="text-xs font-medium">
                {isExecuting ? 'Running...' : (showPreview ? 'Hide Preview' : 'Run Code')}
              </span>
            </button>
            {/* Save Button */}
            <button
              onClick={async () => {
                try {
                  const filePath = openFiles[activeFileIndex].path;
                  await axios.put(`/file/project/${projectId}/file/${encodeURIComponent(filePath)}`, {
                    content: editedContent
                  });
                  
                  // Update the file content in the frontend state immediately
                  if (onFileContentUpdate) {
                    onFileContentUpdate(prev => prev.map((file, index) => 
                      index === activeFileIndex 
                        ? { ...file, content: editedContent }
                        : file
                    ));
                  }
                  
                  // Also trigger the custom event for other components
                  window.dispatchEvent(new CustomEvent('fileSaved', { 
                    detail: { filePath, content: editedContent } 
                  }));
                  
                  console.log('File saved and state updated:', filePath);
                  
                  // Show success feedback
                  const saveButton = event.target;
                  const originalText = saveButton.textContent;
                  saveButton.textContent = 'Saved!';
                  saveButton.className = 'p-2 rounded hover:bg-gray-700 text-green-400 hover:text-green-300';
                  
                  setTimeout(() => {
                    saveButton.textContent = originalText;
                    saveButton.className = 'p-2 rounded hover:bg-gray-700 text-amber-400 hover:text-amber-300';
                  }, 2000);
                  
                } catch (e) {
                  console.error('Save failed:', e);
                  
                  // Show error feedback
                  const saveButton = event.target;
                  const originalText = saveButton.textContent;
                  saveButton.textContent = 'Error!';
                  saveButton.className = 'p-2 rounded hover:bg-gray-700 text-red-400 hover:text-red-300';
                  
                  setTimeout(() => {
                    saveButton.textContent = originalText;
                    saveButton.className = 'p-2 rounded hover:bg-gray-700 text-amber-400 hover:text-amber-300';
                  }, 2000);
                }
              }}
              className="p-2 rounded hover:bg-gray-700 text-amber-400 hover:text-amber-300"
              title="Save file"
            >
              Save
            </button>
            
            {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded hover:bg-gray-700"
            title="Copy code to clipboard"
          >
            {copied ? (
              <CheckIcon className="w-5 h-5 text-green-400" />
            ) : (
              <ClipboardDocumentIcon className="w-5 h-5" />
            )}
          </button>
          </div>
        </div>
      )}
      
      {/* File Content and Preview - Full Height Container */}
      <div className="flex-1 w-full overflow-hidden relative group min-h-0 h-full">
        {activeFile && editedContent ? (
          <div className="flex h-full min-h-0">
            {/* Code Editor - Left Side (Monaco) */}
            <div className={`${showPreview ? 'hidden' : 'w-full'} transition-all duration-300 ease-in-out flex flex-col min-h-0`}>
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage={language}
                  language={language}
                  theme="vs-dark"
                  value={editedContent}
                  onChange={(v) => setEditedContent(v ?? '')}
                  onMount={(editor, monaco) => {
                    // Set the language explicitly
                    monaco.editor.setModelLanguage(editor.getModel(), language);
                    
                    // Configure syntax highlighting
                    editor.updateOptions({
                      semanticHighlighting: { enabled: true },
                      bracketPairColorization: { enabled: true }
                    });
                  }}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    // Enhanced syntax highlighting options
                    semanticHighlighting: { enabled: true },
                    bracketPairColorization: { enabled: true },
                    guides: {
                      bracketPairs: true,
                      indentation: true
                    },
                    // Better color contrast
                    renderLineHighlight: 'all',
                    selectionHighlight: true,
                    occurrencesHighlight: true,
                    // Language-specific features
                    suggest: { enabled: true },
                    quickSuggestions: true,
                    parameterHints: { enabled: true },
                    hover: { enabled: true },
                    // Force syntax highlighting
                    tokenColorCustomizations: {
                      textMateRules: []
                    }
                  }}
                />
              </div>
            </div>

            {/* Live Preview - Right Side */}
            {showPreview && (
              <div className="w-full bg-white transition-all duration-300 ease-in-out flex flex-col min-h-0 h-full">
                <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${executionType === 'iframe' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                    <span className="text-sm font-medium text-gray-200">
                      {executionType === 'iframe' ? 'Live Preview' : 'Execution Output'}
                    </span>
                    {executionType === 'api' && executionResult && (
                      <span className={`px-2 py-1 text-xs rounded ${
                        executionResult.success 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {executionResult.status}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded hover:bg-gray-700"
                    title="Close preview"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {wcRunning ? (
                  <div className="flex-1 overflow-hidden min-h-0 h-full">
                    {wcUrl ? (
                      <iframe src={wcUrl} className="w-full h-full border-0 block" title="WebContainer Preview" />
                    ) : (
                      <div className="flex flex-col h-full">
                        {/* Show logs in a smaller area */}
                        <div className="bg-gray-900 text-green-400 p-2 text-xs border-b border-gray-700 max-h-32 overflow-auto">
                          <div className="font-mono">{wcLogs}</div>
                        </div>
                                                 {/* Show server status with progress bar */}
                         <div className="flex-1 flex items-center justify-center bg-gray-800">
                           <div className="text-center text-gray-300 w-full max-w-md">
                             {/* Progress Bar */}
                             <div className="mb-6">
                               <div className="flex justify-between text-sm text-gray-400 mb-2">
                                 <span>{loadingStage}</span>
                                 <span>{loadingProgress}%</span>
                               </div>
                               <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                 <div 
                                   className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out rounded-full"
                                   style={{ width: `${loadingProgress}%` }}
                                 ></div>
                               </div>
                             </div>
                             
                             {/* Status Message */}
                             {wcLogs.includes('Server running at') || wcLogs.includes('listening on port') || wcLogs.includes('🚀') ? (
                               <div>
                                 <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                 <p className="text-lg font-medium text-green-400">Server is Running!</p>
                                 <p className="text-sm text-gray-400 mt-2">Waiting for preview to load...</p>
                                 <button 
                                   onClick={() => {
                                     // Try to manually set a localhost URL
                                     setWcUrl('http://localhost:3000');
                                   }}
                                   className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                 >
                                   Try Localhost Preview
                                 </button>
                               </div>
                             ) : (
                               <div>
                                 <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                 <p className="text-lg font-medium">Starting Server...</p>
                                 <p className="text-sm text-gray-400 mt-2">Please wait while we set up your environment</p>
                               </div>
                             )}
                           </div>
                         </div>
                      </div>
                    )}
                  </div>
                ) : executionType === 'iframe' ? (
                  // Iframe Preview
                  <div className="flex-1 overflow-hidden min-h-0 h-full">
                    <iframe
                      srcDoc={previewCode}
                      className="w-full h-full border-0 block"
                      title="Code Preview"
                      sandbox="allow-scripts allow-same-origin"
                      style={{
                        minHeight: '100%',
                        border: 'none'
                      }}
                    />
                  </div>
                ) : (
                  // API Execution Results
                  <div className="flex-1 overflow-auto p-4 min-h-0">
                    {executionResult ? (
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 h-full">
                        {/* Status */}
                        <div className="mb-4">
                          <h3 className="text-lg font-medium text-gray-200 mb-2">Execution Result</h3>
                          <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                            executionResult.success 
                              ? 'bg-green-600 text-white' 
                              : 'bg-red-600 text-white'
                          }`}>
                            {executionResult.status}
                          </div>
                        </div>

                        {/* Output */}
                        {executionResult.output && (
                          <div className="mb-4">
                            <h4 className="text-md font-medium text-gray-300 mb-2">Output:</h4>
                            <pre className="bg-gray-900 p-3 rounded border border-gray-600 text-gray-200 text-sm overflow-x-auto">
                              {executionResult.output}
                            </pre>
                          </div>
                        )}

                        {/* Error */}
                        {executionResult.error && (
                          <div className="mb-4">
                            <h4 className="text-md font-medium text-red-400 mb-2">Error:</h4>
                            <pre className="bg-red-900/20 p-3 rounded border border-red-600 text-red-300 text-sm overflow-x-auto">
                              {executionResult.error}
                            </pre>
                          </div>
                        )}

                        {/* Execution Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {executionResult.executionTime && (
                            <div>
                              <span className="text-gray-400">Execution Time:</span>
                              <span className="ml-2 text-gray-200">{executionResult.executionTime}ms</span>
                            </div>
                          )}
                          {executionResult.memory && (
                            <div>
                              <span className="text-gray-400">Memory Used:</span>
                              <span className="ml-2 text-gray-200">{executionResult.memory}KB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        <div className="w-8 h-8 border border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p>Executing code...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeFile && activeFile.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="w-8 h-8 border border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading file...</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">File is empty</h3>
              <p className="text-sm">This file doesn't contain any content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
