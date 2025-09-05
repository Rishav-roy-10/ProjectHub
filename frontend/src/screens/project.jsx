import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";

const Project = ({
  isOpen,
  onClose,
  projects,
  loading,
  error,
  onProjectSelect,
  selectedProjectId,
  onProjectDeleted,
}) => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    setDeleting(true);
    try {
      const response = await axios.delete(`/project/${projectToDelete._id}`);
      if (response.data.success) {
        // Notify parent component about project deletion
        if (onProjectDeleted) {
          onProjectDeleted(projectToDelete._id);
        }
        setShowDeleteConfirm(false);
        setProjectToDelete(null);
      } else {
        alert('Failed to delete project: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to delete project: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-[360px] bg-gray-900/95 shadow-2xl border-r border-gray-700 transform transition-transform duration-400 ease-in-out z-50 rounded-r-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 rounded-tr-2xl">
          <div>
            <div className="font-semibold text-emerald-400">📁 Your Projects</div>
            {user?.email && (
              <div className="text-xs text-gray-400">Logged in as {user.email}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-3.5rem)] flex flex-col px-3 pb-4 overflow-y-auto bg-gray-900">
          {loading ? (
            <p className="text-emerald-400 text-sm animate-pulse">
              Loading...
            </p>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : projects.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No projects yet</p>
          ) : (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li
                  key={p._id}
                  className={`flex items-center justify-between bg-gray-800/90 backdrop-blur-md rounded-xl px-3 py-2 shadow-md border transition ${
                    selectedProjectId === p._id
                      ? "border-emerald-400"
                      : "border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold capitalize text-emerald-400 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{p._id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      title="Add user to this project"
                      className="text-emerald-400 hover:text-emerald-300 transition text-lg"
                      onClick={() => navigate(`/add-user?projectId=${p._id}`)}
                    >
                      <i className="ri-user-add-line" />
                    </button>
                    <button
                      title="Delete this project"
                      className="text-red-400 hover:text-red-300 transition text-lg"
                      onClick={() => handleDeleteClick(p)}
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                    <button
                      className="text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.02] active:scale-95 transition text-sm rounded-lg px-3 py-1 shadow-lg"
                      onClick={() => onProjectSelect?.(p._id)}
                    >
                      Open
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleDeleteCancel}
          />
          <div 
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl py-4 min-w-[400px] max-w-[500px]"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="px-6 py-3 border-b border-gray-600">
              <div className="text-lg font-semibold text-red-400">⚠️ Delete Project</div>
              <div className="text-sm text-gray-400">
                This action cannot be undone!
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="text-gray-300 mb-4">
                <strong>Are you sure you want to delete this project?</strong>
                <div className="mt-2 p-3 bg-gray-700 rounded-lg">
                  <div className="font-semibold text-emerald-400">{projectToDelete.name}</div>
                  <div className="text-xs text-gray-400 mt-1">ID: {projectToDelete._id}</div>
                </div>
                <span className="text-red-400 block text-sm mt-3">
                  ⚠️ This will permanently delete the project and all its files!
                </span>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-600 flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-center text-gray-400 hover:text-gray-200 text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-center text-red-400 hover:text-red-300 text-sm transition-colors bg-red-900/20 hover:bg-red-900/30 rounded disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Project;
