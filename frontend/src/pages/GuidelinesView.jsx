import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  Plus, 
  Upload, 
  Search, 
  ShieldCheck, 
  Lock, 
  AlertCircle,
  FileText
} from '../components/icons';
import { api } from '../api';
import { useRole } from '../context/RoleContext';

export default function GuidelinesView() {
  const { role } = useRole();
  const [clauses, setClauses] = useState([]);
  const [facts, setFacts] = useState([]);
  const [activeTab, setActiveTab] = useState('clauses'); // 'clauses' | 'facts' | 'admin'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin New Clause Form
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  // Admin New Fact Form
  const [newFactKey, setNewFactKey] = useState('');
  const [newFactValue, setNewFactValue] = useState('');
  const [newFactSource, setNewFactSource] = useState('');
  // Upload file
  const [uploadFile, setUploadFile] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState(null);

  const loadGuidelines = async () => {
    try {
      const [clausesData, factsData] = await Promise.all([
        api.get('/api/guidelines/clauses'),
        api.get('/api/guidelines/facts'),
      ]);
      setClauses(clausesData);
      setFacts(factsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuidelines();
  }, []);

  const handleAddClause = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminSuccess(null);
    setError(null);
    try {
      await api.post('/api/guidelines/clauses', {
        code: newCode.trim(),
        title: newTitle.trim(),
        text: newText.trim(),
      });
      setNewCode('');
      setNewTitle('');
      setNewText('');
      setAdminSuccess('Guideline clause added successfully!');
      await loadGuidelines();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAddFact = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminSuccess(null);
    setError(null);
    try {
      await api.post('/api/guidelines/facts', {
        key: newFactKey.trim(),
        value: newFactValue.trim(),
        source: newFactSource.trim() || 'Internal records',
      });
      setNewFactKey('');
      setNewFactValue('');
      setNewFactSource('');
      setAdminSuccess('Approved fact added successfully!');
      await loadGuidelines();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setAdminLoading(true);
    setAdminSuccess(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const created = await api.post('/api/guidelines/clauses/upload', formData);
      setUploadFile(null);
      setAdminSuccess(`Parsed and added ${created.length} new clause(s) from document!`);
      await loadGuidelines();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const filteredClauses = clauses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.text.toLowerCase().includes(q);
  });

  const filteredFacts = facts.filter((f) => {
    const q = searchQuery.toLowerCase();
    return f.key.toLowerCase().includes(q) || f.value.toLowerCase().includes(q) || f.source.toLowerCase().includes(q);
  });

  const isAdmin = role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <span>Northwind Guideline Library</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            The single source of truth: clauses, terminology, claim policies, and approved facts.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('clauses')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'clauses' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clauses ({clauses.length})
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'facts' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved Facts ({facts.length})
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'admin' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {!isAdmin && <Lock className="w-3 h-3 text-slate-400 mr-1" />}
            <span>Admin Management</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800">
          {error}
        </div>
      )}

      {adminSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{adminSuccess}</span>
        </div>
      )}

      {/* Clauses Tab */}
      {activeTab === 'clauses' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clauses by code, title, or text..."
              className="w-full text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClauses.map((clause) => (
              <div
                key={clause.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {clause.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">
                      {clause.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">v{clause.version}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-serif italic pt-1">
                  "{clause.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facts Tab */}
      {activeTab === 'facts' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search approved facts..."
              className="w-full text-xs focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Fact Key</th>
                  <th className="px-5 py-3">Approved Verbatim Value</th>
                  <th className="px-5 py-3">Verified Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFacts.map((fact) => (
                  <tr key={fact.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {fact.key}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-emerald-800">
                      "{fact.value}"
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {fact.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Tab */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {!isAdmin ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-2">
              <Lock className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">Admin Privileges Required</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Managing guidelines and approved facts requires the Admin role. Use the top-right role switcher to change your role to <strong>Admin</strong>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Single Clause Form */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Add New Guideline Clause</span>
                </h3>
                <form onSubmit={handleAddClause} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                      Clause Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. C-4.1"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sustainability and Material Sourcing"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                      Verbatim Clause Text
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Approved policy phrasing..."
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {adminLoading ? 'Adding...' : 'Add Clause'}
                  </button>
                </form>
              </div>

              {/* Upload Document / Split by Headings */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Bulk Upload & Split by Headings</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Upload a DOCX, MD, or TXT guideline document. The system will automatically split clauses by markdown or style headings.
                </p>
                <form onSubmit={handleUploadDoc} className="space-y-4 pt-2">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 hover:border-slate-400 transition-colors">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <label className="text-xs font-semibold text-emerald-700 cursor-pointer hover:underline block">
                      Choose .docx / .md / .txt
                      <input
                        type="file"
                        accept=".docx,.md,.txt"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    {uploadFile && (
                      <span className="text-xs text-slate-700 font-mono block">
                        Selected: {uploadFile.name}
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={adminLoading || !uploadFile}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {adminLoading ? 'Processing Document...' : 'Upload & Split Clauses'}
                  </button>
                </form>

                {/* Add Fact */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Add Approved Fact
                  </h4>
                  <form onSubmit={handleAddFact} className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Fact Key (e.g. warranty_period)"
                      value={newFactKey}
                      onChange={(e) => setNewFactKey(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Verbatim Value (e.g. 2-year limited warranty)"
                      value={newFactValue}
                      onChange={(e) => setNewFactValue(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Source (e.g. Legal doc WL-2024)"
                      value={newFactSource}
                      onChange={(e) => setNewFactSource(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded"
                    />
                    <button
                      type="submit"
                      disabled={adminLoading}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded border border-slate-300 cursor-pointer"
                    >
                      Add Fact
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
