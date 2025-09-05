import React, { useEffect, useState } from 'react';
import axios from '../config/axios';
import { useLocation, useNavigate } from 'react-router-dom';

const AddUser = () => {
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [projectsError, setProjectsError] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Prefill from query param if provided
    const params = new URLSearchParams(location.search);
    const qProjectId = params.get('projectId');
    if (qProjectId) setProjectId(qProjectId);

    // Load current user's projects to select from
    setProjectsError('');
    axios.get('/project/getAll')
      .then((res) => {
        const list = res.data?.projects || [];
        setProjects(list);
      })
      .catch((err) => {
        setProjects([]);
        if (err?.response?.status === 401) {
          setProjectsError('Login to view your projects');
        } else {
          setProjectsError('Failed to load your projects');
        }
      });
  }, [location.search]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      let resolvedUserId = userId.trim();
      const email = userEmail.trim();
      if (!resolvedUserId && email) {
        // resolve user by email from /user/all-users
        const usersRes = await axios.get('/user/all-users');
        const match = (usersRes.data?.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!match) {
          throw new Error('No user found with that email');
        }
        resolvedUserId = match._id;
      }
      if (!resolvedUserId) {
        throw new Error('Provide User ID or Email');
      }
      // Resolve project by entered ID or name
      let resolvedProjectId = projectId.trim();
      const enteredName = projectName.trim();
      if (!resolvedProjectId && enteredName) {
        const match = (projects || []).find((p) => (p.name || '').toLowerCase() === enteredName.toLowerCase());
        if (!match) {
          throw new Error('No project found with that name');
        }
        resolvedProjectId = match._id;
      }
      if (!resolvedProjectId) {
        throw new Error('Provide Project ID or Name');
      }
      await axios.put('/project/add-user', { projectId: resolvedProjectId, user: resolvedUserId });
      setSuccess('User added/transferred to the project successfully.');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      const apiErr = err?.response?.data?.error;
      setError(apiErr || err.message || 'Failed to add user to project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-emerald-400">Add User to Project</h2>
        <p className="text-xs text-gray-400 mb-4 text-center">This will transfer project ownership to the target user.</p>

        {error && <div className="bg-red-500 text-white p-3 rounded-lg text-sm mb-4">{error}</div>}
        {projectsError && <div className="bg-yellow-600 text-white p-3 rounded-lg text-sm mb-4">{projectsError}</div>}
        {success && <div className="bg-emerald-600 text-white p-3 rounded-lg text-sm mb-4">{success}</div>}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-2">Project ID</label>
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Enter Project ID (optional if name provided)"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Project Name</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter Project Name (optional if ID provided)"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">Provide either Project ID or exact Name.</p>
              {projects.length > 0 && projectName.trim().length >= 1 && (
                <div className="mt-2 bg-gray-700 border border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                  {projects
                    .filter((p) => (p.name || '').toLowerCase().includes(projectName.trim().toLowerCase()))
                    .slice(0, 5)
                    .map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => { setProjectId(p._id); setProjectName(p.name); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-600 text-sm text-gray-200"
                      >
                        {p.name} <span className="text-gray-400">({p._id})</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">User ID (optional if email provided)</label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter User ID to add"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">User Email (optional)</label>
            <input
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              type="email"
              placeholder="Enter user email to add"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Provide either User ID or Email.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 transition rounded-lg py-3 font-medium"
          >
            {loading ? 'Submitting...' : 'Add User'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AddUser;


