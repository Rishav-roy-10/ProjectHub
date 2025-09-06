import React, { useState, useEffect, useRef, useContext } from 'react';
import { io } from "socket.io-client";
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
const RealTimeChat = ({ projectId, projectName, onOpenProjects, onAIFilesCreated }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const { user } = useContext(UserContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

 useEffect(() => {
  if (!projectId) return;

  // Use environment variable in production, fallback to localhost in dev
  const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
    withCredentials: true,
  });

  setSocket(newSocket);
  newSocket.emit("join-project", projectId);

  newSocket.on("new-message", (messageData) => {
    if (messageData.projectId === projectId) {
      setMessages((prev) => [...prev, messageData]);
      if (messageData.sender === "ai") {
        setAiTyping(false);

        // Check if AI response contains file creation
        if (messageData.content && messageData.content.includes("**Files Created:**")) {
          const fileMatches = messageData.content.match(/- (.+)/g);
          if (fileMatches && onAIFilesCreated) {
            const files = fileMatches.map((match) => match.replace("- ", ""));
            onAIFilesCreated(files);
          }
        }
      }
    }
  });

  return () => {
    newSocket.disconnect();
  };
}, [projectId]);



    newSocket.on('message-deleted', (data) => {
      if (data.projectId === projectId && data.deleteForEveryone) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    loadExistingMessages();

    return () => {
      newSocket.emit('leave-project', projectId);
      newSocket.close();
    };
  }, [projectId]);

  const loadExistingMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/chat/recent/${projectId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      // Failed to load messages
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    if (messageContent.includes('@ai')) {
      setAiTyping(true);
    }

    try {
      await axios.post('/chat/send-message', {
        projectId,
        content: messageContent
      });

      socket.emit('send-message', {
        projectId,
        content: messageContent,
        sender: { _id: user._id },
        senderName: user.name || user.email
      });
    } catch (error) {
      setNewMessage(messageContent);
      setAiTyping(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fetchProjectUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(`/project/${projectId}/users`);
      setProjectUsers(response.data.users || []);
    } catch (error) {
      setProjectUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserListClick = () => {
    fetchProjectUsers();
    setShowUserList(true);
  };

  const handleCreateFilesFromRecentAI = async () => {
    try {
      // Find the most recent AI message with code
      const recentAIMessage = messages
        .filter(msg => msg.sender === 'ai')
        .reverse()
        .find(msg => msg.content && msg.content.includes('```'));

      if (!recentAIMessage) {
        alert('No recent AI code found. Ask AI for code first!');
        return;
      }

      await createFilesFromMessage(recentAIMessage);
    } catch (error) {
      alert('Error creating files. Please try again.');
    }
  };

  const createFilesFromMessage = async (message) => {
    try {
      // Extract code blocks from the AI message with exact file paths
      // Look for both formats: ```language:path/to/file.ext and ```language\ncontent
      const codeBlockRegex = /```(\w+)(?::([^\n]+))?\n([\s\S]*?)```/g;
      const codeBlocks = [];
      let match;

      while ((match = codeBlockRegex.exec(message.content)) !== null) {
        const language = match[1];
        const filePath = match[2] || `code.${language}`;
        const content = match[3].trim();
        
        // Only add if we have a proper file path (not just language)
        if (match[2]) {
          codeBlocks.push({ language, filePath, content });
        }
      }

      // If no code blocks with file paths found, try to extract from AI's structured response
      if (codeBlocks.length === 0) {
        // Look for file structure patterns in AI response
        const fileStructureRegex = /(?:File Structure|Files to create|Implementation files?):\s*\n((?:[-*]\s*[^\n]+\n?)+)/gi;
        const fileStructureMatch = fileStructureRegex.exec(message.content);
        
        if (fileStructureMatch) {
          const fileList = fileStructureMatch[1].split('\n').filter(line => line.trim());
          
          // Extract file paths from the list
          fileList.forEach(line => {
            const filePathMatch = line.match(/[-*]\s*(.+)/);
            if (filePathMatch) {
              const filePath = filePathMatch[1].trim();
              // Try to find corresponding code block for this file
              const fileCodeRegex = new RegExp(`\`\`\`(\\w+)(?::\\s*${filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\n([\\s\\S]*?)\`\`\``, 'i');
              const fileCodeMatch = fileCodeRegex.exec(message.content);
              
              if (fileCodeMatch) {
                codeBlocks.push({
                  language: fileCodeMatch[1],
                  filePath: filePath,
                  content: fileCodeMatch[2].trim()
                });
              }
            }
          });
        }
      }

      if (codeBlocks.length === 0) {
        alert('No code blocks with file paths found in this message! Make sure AI provides code with file paths like: ```javascript:src/components/Button.jsx');
        return;
      }

      // Create files for each code block with exact paths
      const createdFiles = [];
      for (const block of codeBlocks) {
        try {
          // Use the exact file path as suggested by AI
          const response = await axios.post(`/file/project/${projectId}/file`, {
            filePath: block.filePath,
            content: block.content,
            language: block.language
          });
          
          if (response.data.success) {
            createdFiles.push(block.filePath);
          }
        } catch (error) {
          // Failed to create file
        }
      }

      if (createdFiles.length > 0) {
        alert(`Successfully implemented ${createdFiles.length} files:\n${createdFiles.join('\n')}`);
        // Trigger file explorer refresh
        if (onAIFilesCreated) {
          onAIFilesCreated(createdFiles);
        }
      } else {
        alert('Failed to create any files. Please try again.');
      }
    } catch (error) {
      alert('Error creating files. Please try again.');
    }
  };

  const deleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      const response = await axios.delete('/chat/delete-message', {
        data: { projectId, messageId, deleteForEveryone }
      });

      if (response.data.success) {
        socket.emit('delete-message', { projectId, messageId, deleteForEveryone });
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    } catch (error) {
      // Failed to delete message
    }
  };

  const handleMessageClick = (message, event) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedMessage(message);
    setShowDeleteMenu(true);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowDeleteMenu(false);
      setSelectedMessage(null);
    };

    if (showDeleteMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDeleteMenu]);

  if (!projectId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 font-semibold">
          <div>
            <p className="font-semibold text-emerald-400">💬 Chat</p>
            <p className="text-xs text-gray-400">Select a project to start chatting</p>
          </div>
          <button
            onClick={onOpenProjects}
            className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-700 bg-gray-700 hover:bg-gray-600 active:scale-95 transition"
            title="Open Projects"
          >
            <i className="ri-menu-line text-lg text-emerald-400" />
          </button>
        </div>
        <div className="flex-1 grid place-items-center p-6 text-center text-gray-400">
          <p className="text-lg font-semibold">No project selected</p>
          <p className="text-sm">Click the menu button to open a project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col max-h-full overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 font-semibold">
        <div>
          <p className="font-semibold text-emerald-400">💬 Chat: {projectName}</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUserListClick}
            className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-700 bg-gray-700 hover:bg-gray-600 active:scale-95 transition"
            title="View Project Users"
          >
            <i className="ri-group-line text-lg text-emerald-400" />
          </button>
          <button
            onClick={handleCreateFilesFromRecentAI}
                         className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-700 bg-gray-700 hover:bg-gray-600 active:scale-95 transition"
             title="Implement Recent AI Code"
          >
            <i className="ri-arrow-right-fill text-lg text-emerald-400" />
          </button>
          <button
            onClick={onOpenProjects}
            className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-700 bg-gray-700 hover:bg-gray-600 active:scale-95 transition"
            title="Open Projects"
          >
            <i className="ri-menu-line text-lg text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 min-h-0 max-h-full overflow-y-auto p-3 space-y-3 bg-gray-900 chat-messages-container">
        {loading ? (
          <div className="text-center text-gray-400">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender?._id === user._id ? "justify-end" : "justify-start"}`}
            >
              <div
                onClick={(e) => handleMessageClick(msg, e)}
                className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-sm transition-all cursor-pointer hover:opacity-80 group relative chat-message-content ${
                  msg.sender?._id === user._id
                    ? "bg-emerald-500 text-white rounded-br-none"
                    : "bg-gray-700 border border-gray-600 text-gray-200 rounded-bl-none"
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {msg.sender?._id === user._id ? 'You' : (msg.senderName || 'Unknown User')}
                </div>
                <div className="text-sm markdown-content max-w-full overflow-hidden">
                                     <ReactMarkdown
                     components={{
                       code({ inline, className, children, ...props }) {
                         const match = /language-(\w+)/.exec(className || '');
                         return !inline && match ? (
                           <SyntaxHighlighter
                             style={tomorrow}
                             language={match[1]}
                             PreTag="div"
                             customStyle={{
                               maxWidth: '100%',
                               overflow: 'auto'
                             }}
                             {...props}
                           >
                             {String(children).replace(/\n$/, '')}
                           </SyntaxHighlighter>
                         ) : (
                           <code className={className} {...props}>
                             {children}
                           </code>
                         );
                       },
                       p: ({ children }) => <p className="break-words mb-2">{children}</p>,
                       div: ({ children }) => <div className="break-words">{children}</div>,
                       h1: ({ children }) => <h1 className="text-lg font-bold text-blue-400 mb-3 mt-4">{children}</h1>,
                       h2: ({ children }) => <h2 className="text-md font-semibold text-green-400 mb-2 mt-3">{children}</h2>,
                       h3: ({ children }) => <h3 className="text-sm font-semibold text-yellow-400 mb-2 mt-2">{children}</h3>,
                       ul: ({ children }) => <ul className="list-disc list-inside mb-3 text-gray-300 space-y-1">{children}</ul>,
                       ol: ({ children }) => <ol className="list-decimal list-inside mb-3 text-gray-300 space-y-1">{children}</ol>,
                       li: ({ children }) => <li className="mb-1">{children}</li>,
                       blockquote: ({ children }) => (
                         <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 mb-3 bg-gray-800 py-2 rounded-r">
                           {children}
                         </blockquote>
                       ),
                       strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                       em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                       pre: ({ children }) => <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto mb-3">{children}</pre>
                     }}
                   >
                     {msg.content}
                   </ReactMarkdown>
                  
                  {/* File creation button for AI messages with code */}
                  {msg.sender === 'ai' && msg.content && msg.content.includes('```') && (
                    <div className="mt-3 pt-2 border-t border-gray-600">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          createFilesFromMessage(msg);
                        }}
                                                 className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-lg hover:scale-105 active:scale-95 transition-all font-medium"
                         title="Implement code from this message"
                       >
                         <i className="ri-arrow-right-fill text-sm"></i>
                         Implement
                       </button>
                    </div>
                  )}
                </div>
                <div className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</div>
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {msg.sender === 'ai' && msg.content && msg.content.includes('```') && (
                    <div 
                                             className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer hover:bg-blue-600"
                       onClick={(e) => {
                         e.stopPropagation();
                         createFilesFromMessage(msg);
                       }}
                       title="Implement code from this message"
                    >
                      📁
                    </div>
                  )}
                  <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer hover:bg-red-600">
                    🗑️
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {aiTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-3 py-2 rounded-2xl shadow-sm bg-gray-700 border border-gray-600 text-gray-200 rounded-bl-none">
              <div className="text-sm font-medium mb-1">AI Assistant</div>
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <span>🤖 AI is responding...</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={sendMessage} className="flex-shrink-0 p-3 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-600 bg-gray-900 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
            title="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>

      {/* Modals */}
      {showDeleteMenu && selectedMessage && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setShowDeleteMenu(false)}
          />
          <div 
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl py-3 min-w-[300px] max-w-[400px]"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="px-4 py-2 border-b border-gray-600">
              <div className="text-sm font-semibold text-gray-200">Message Options</div>
              <div className="text-xs text-gray-400">
                {selectedMessage.sender?._id === user._id ? 'Your message' : `${selectedMessage.senderName}'s message`}
              </div>
            </div>
            <div className="py-1">
              <button
                onClick={() => { deleteMessage(selectedMessage._id, false); setShowDeleteMenu(false); }}
                className="w-full px-4 py-3 text-left text-gray-200 hover:bg-gray-700 text-sm flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">👁️</div>
                <div>
                  <div className="font-medium">Delete for me</div>
                  <div className="text-xs text-gray-400">Remove from your view only</div>
                </div>
              </button>
              {selectedMessage.sender?._id === user._id && (
                <button
                  onClick={() => { deleteMessage(selectedMessage._id, true); setShowDeleteMenu(false); }}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/20 text-sm flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">🗑️</div>
                  <div>
                    <div className="font-medium">Delete for everyone</div>
                    <div className="text-xs text-red-300">Remove for all users</div>
                  </div>
                </button>
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-600">
              <button
                onClick={() => setShowDeleteMenu(false)}
                className="w-full px-4 py-2 text-center text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {showUserList && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setShowUserList(false)}
          />
          <div 
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl py-3 min-w-[300px] max-w-[400px]"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="px-4 py-2 border-b border-gray-600">
              <div className="text-sm font-semibold text-gray-200">👥 Project Users</div>
              <div className="text-xs text-gray-400">{projectName}</div>
            </div>
            <div className="py-1 max-h-[300px] overflow-y-auto">
              {loadingUsers ? (
                <div className="px-4 py-3 text-center text-gray-400">
                  <p>Loading users...</p>
                </div>
              ) : projectUsers.length === 0 ? (
                <div className="px-4 py-3 text-center text-gray-400">
                  <p>No users found in this project.</p>
                </div>
              ) : (
                projectUsers.map((projectUser, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {projectUser.name ? projectUser.name.charAt(0).toUpperCase() : projectUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-200">{projectUser.name || 'No Name'}</div>
                      <div className="text-xs text-gray-400">{projectUser.email}</div>
                    </div>
                    {projectUser._id === user._id && (
                      <div className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full">You</div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-600">
              <button
                onClick={() => setShowUserList(false)}
                className="w-full px-4 py-2 text-center text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}


    </div>
  );
};

export default RealTimeChat;
