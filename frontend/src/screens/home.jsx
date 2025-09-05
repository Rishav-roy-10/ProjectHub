import React, { useEffect, useState } from "react";
import axios from "../config/axios";
import Project from "./project.jsx";
import RealTimeChat from "../components/RealTimeChat.jsx";
import FileExplorer from "../components/FileExplorer.jsx";
import FileViewer from "../components/FileViewer.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const Home = () => {
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectPanelOpen, setIsProjectPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFiles, setOpenFiles] = useState([]); // Array of open files
  const [activeFileIndex, setActiveFileIndex] = useState(0); // Index of currently active file
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  function fetchProjects() {
    setProjectsLoading(true);
    setListError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setProjects([]);
      setListError("Login to get or start your project");
      setProjectsLoading(false);
      return;
    }
    
    axios
      .get("/project/all")
      .then((res) => {
        setProjects(res.data?.projects || []);
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          setListError("Login to get or start your project");
        } else {
          setListError("Failed to fetch projects");
        }
      })
      .finally(() => setProjectsLoading(false));
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openProjects')) {
      setIsProjectPanelOpen(true);
      params.delete('openProjects');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [location, navigate]);

  function createProjectFromModal(e) {
    e.preventDefault();
    setError("");
    const name = projectName.trim();
    if (!name) {
      setError("Project name is required");
      return;
    }
    axios
      .post("/project/create", { name })
      .then(() => {
        setProjectName("");
        fetchProjects();
        setIsModalOpen(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || "Failed to create project");
      });
  }

  function openProject(projectId) {
    const basic = projects.find((p) => p._id === projectId);
    if (basic) {
      setSelectedProject({ _id: basic._id, name: basic.name });
    } else {
      setSelectedProject({ _id: projectId, name: "Project" });
    }
    setIsProjectPanelOpen(false);
    setOpenFiles([]);
    setActiveFileIndex(0);
  }

  function handleFileSelect(filePath) {
    const existingFileIndex = openFiles.findIndex(file => file.path === filePath);
    
    if (existingFileIndex !== -1) {
      setActiveFileIndex(existingFileIndex);
    } else {
      const newFile = {
        path: filePath,
        content: "",
        isLoading: true
      };
      
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFileIndex(openFiles.length);
      
      loadFileContent(filePath, openFiles.length);
    }
  }

  const loadFileContent = async (filePath, fileIndex) => {
    try {
      const response = await axios.get(`/file/project/${selectedProject._id}/file/${encodeURIComponent(filePath)}`);
      if (response.data.success) {
        setOpenFiles(prev => prev.map((file, index) => 
          index === fileIndex 
            ? { ...file, content: response.data.file.content, isLoading: false }
            : file
        ));
      }
    } catch (error) {
      setOpenFiles(prev => prev.map((file, index) => 
        index === fileIndex 
          ? { ...file, content: '', isLoading: false }
          : file
      ));
    }
  };

  function handleCloseFile(fileIndex) {
    setOpenFiles(prev => prev.filter((_, index) => index !== fileIndex));
    
    // Adjust active file index
    if (openFiles.length === 1) {
      // Last file closed
      setActiveFileIndex(0);
    } else if (fileIndex === activeFileIndex) {
      // Closed the active file, switch to previous or next
      if (fileIndex === 0) {
        setActiveFileIndex(0); // Switch to first remaining file
      } else {
        setActiveFileIndex(fileIndex - 1); // Switch to previous file
      }
    } else if (fileIndex < activeFileIndex) {
      // Closed a file before the active one, adjust index
      setActiveFileIndex(activeFileIndex - 1);
    }
  }

  function handleTabClick(fileIndex) {
    setActiveFileIndex(fileIndex);
  }

  function handleAIFilesCreated(files) {
    if (files && files.length > 0) {
      // Refresh the file explorer to show new files
      if (selectedProject) {
        setRefreshTrigger(prev => prev + 1);
      }
    }
  }

  function handleFileDeleted(deletedFilePath) {
    // Close any open tabs for the deleted file
    setOpenFiles(prev => {
      const newOpenFiles = prev.filter(file => file.path !== deletedFilePath);
      
      // Adjust active file index if the deleted file was active
      if (newOpenFiles.length !== prev.length) {
        const deletedIndex = prev.findIndex(file => file.path === deletedFilePath);
        if (deletedIndex === activeFileIndex) {
          // The active file was deleted, switch to previous or next
          if (newOpenFiles.length === 0) {
            setActiveFileIndex(0);
          } else if (deletedIndex === 0) {
            setActiveFileIndex(0); // Switch to first remaining file
          } else {
            setActiveFileIndex(deletedIndex - 1); // Switch to previous file
          }
        } else if (deletedIndex < activeFileIndex) {
          // A file before the active one was deleted, adjust index
          setActiveFileIndex(activeFileIndex - 1);
        }
      }
      
      return newOpenFiles;
    });
  }

  function handleProjectDeleted(deletedProjectId) {
    // Remove the deleted project from the projects list
    setProjects(prev => prev.filter(project => project._id !== deletedProjectId));
    
    // If the deleted project was currently selected, clear the selection
    if (selectedProject && selectedProject._id === deletedProjectId) {
      setSelectedProject(null);
      setOpenFiles([]);
      setActiveFileIndex(0);
    }
  }

  // Listen for file save events to update open files
  useEffect(() => {
    const handleFileSaved = (event) => {
      const { filePath, content } = event.detail;
      
      // Update the content of the saved file in openFiles
      setOpenFiles(prev => prev.map(file => 
        file.path === filePath 
          ? { ...file, content: content }
          : file
      ));
    };

    window.addEventListener('fileSaved', handleFileSaved);
    return () => window.removeEventListener('fileSaved', handleFileSaved);
  }, []);

  return (
    <main className="home h-screen p-6 grid grid-cols-12 gap-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 overflow-hidden">
      {/* Left: Chat Area - 1.5/6 (3/12) */}
      <div className="col-span-3 flex flex-col h-full">
        <div className="mb-4 flex-shrink-0">
          <button
            onClick={() => {
              setError("");
              setIsModalOpen(true);
            }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition font-semibold"
          >
            + Create Project
          </button>
        </div>

        <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex-1 min-h-0 relative">
          <RealTimeChat 
            projectId={selectedProject?._id} 
            projectName={selectedProject?.name}
            onOpenProjects={() => setIsProjectPanelOpen(true)}
            onAIFilesCreated={handleAIFilesCreated}
          />
        </div>
      </div>

      {/* Middle: File Explorer - col-span-2 (2/12 = 14.37%) */}
      <div className="col-span-2 bg-gray-800/80 rounded-2xl border border-gray-700 shadow-xl overflow-hidden h-full">
        {selectedProject ? (
          <FileExplorer 
            projectId={selectedProject._id} 
            onFileSelect={handleFileSelect}
            refreshTrigger={refreshTrigger}
            onFileDeleted={handleFileDeleted}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <div className="text-center">
              <p className="font-semibold text-lg text-emerald-400">
                📁 File Explorer
              </p>
              <p className="text-sm">Select a project to view files</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Code Viewer - 2.7/5 (6.48/12 ≈ 7/12) */}
      <div className="col-span-7 bg-gray-800/80 rounded-2xl border border-gray-700 shadow-xl overflow-hidden h-full min-h-0">
        {selectedProject ? (
          <FileViewer
            projectId={selectedProject._id}
            openFiles={openFiles}
            activeFileIndex={activeFileIndex}
            onTabClick={handleTabClick}
            onCloseFile={handleCloseFile}
            onFileContentUpdate={setOpenFiles}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <div className="text-center">
              <p className="font-semibold text-lg text-emerald-400">
                📄 Code Viewer
              </p>
              <p className="text-sm">Select a project to view code</p>
            </div>
          </div>
        )}
      </div>

      {/* Slide Project Panel */}
      <Project
        isOpen={isProjectPanelOpen}
        onClose={() => setIsProjectPanelOpen(false)}
        projects={projects}
        onProjectSelect={openProject}
        onProjectDeleted={handleProjectDeleted}
        loading={projectsLoading}
        error={listError}
      />

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={createProjectFromModal}>
              <input
                type="text"
                placeholder="Project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white mb-4"
              />
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
