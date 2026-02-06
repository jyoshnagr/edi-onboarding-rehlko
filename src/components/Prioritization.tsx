import { useEffect, useState } from 'react';
import { supabase, OnboardingRequest } from '../lib/supabase';
import { ListChecks, TrendingUp, AlertCircle, Clock, DollarSign, Zap, ArrowUpDown, CheckCircle2, Circle, Download, FileJson, FileSpreadsheet, ExternalLink, Edit3, Trash2 } from 'lucide-react';
import { exportActionItemsToJira } from '../lib/jiraExport';

type SortCriteria = 'ai_recommended' | 'business_value' | 'readiness' | 'timeline';
type ViewMode = 'requests' | 'action_items';

interface ActionItem {
  id: string;
  intake_id: string;
  title: string;
  description: string;
  priority: string;
  assigned_to: string;
  status: string;
  due_date: string;
  created_at: string;
  company_name?: string;
  category?: string;
  story_points?: number;
  labels?: string[];
  acceptance_criteria?: string;
  blocked_reason?: string;
  jira_issue_key?: string;
}

export default function Prioritization() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('action_items');
  const [sortBy, setSortBy] = useState<SortCriteria>('ai_recommended');
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'requests') {
      loadRequests();
    } else {
      loadActionItems();
    }
  }, [viewMode]);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('onboarding_requests')
      .select('*, trading_partner:trading_partners(*)')
      .in('status', ['intake', 'review'])
      .order('readiness_score', { ascending: false });

    if (data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const loadActionItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('action_items')
      .select(`
        *,
        intake:intake_extractions(company_name)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setActionItems(data.map(item => ({
        ...item,
        company_name: item.intake?.company_name
      })));
    }
    setLoading(false);
  };

  const updateActionItemStatus = async (id: string, newStatus: string) => {
    await supabase
      .from('action_items')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', id);

    loadActionItems();
  };

  const updateActionItem = async (id: string, updates: Partial<ActionItem>) => {
    await supabase
      .from('action_items')
      .update(updates)
      .eq('id', id);

    loadActionItems();
  };

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (selectedItems.size === actionItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(actionItems.map(item => item.id)));
    }
  };

  const handleExport = (format: 'json' | 'csv' | 'jira') => {
    const itemsToExport = selectedItems.size > 0
      ? actionItems.filter(item => selectedItems.has(item.id))
      : actionItems;

    const companyName = itemsToExport[0]?.company_name || 'EDI_Project';
    exportActionItemsToJira(itemsToExport, format, companyName);
    setShowExportMenu(false);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL action items? This cannot be undone.')) {
      return;
    }

    await supabase.from('action_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setSelectedItems(new Set());
    loadActionItems();
  };

  const getSortedRequests = () => {
    const sorted = [...requests];

    switch (sortBy) {
      case 'ai_recommended':
        return sorted.sort((a, b) => {
          const scoreA = (a.readiness_score * 0.4) + (a.business_value_score * 0.4) + (a.confidence_percentage * 0.2);
          const scoreB = (b.readiness_score * 0.4) + (b.business_value_score * 0.4) + (b.confidence_percentage * 0.2);
          return scoreB - scoreA;
        });
      case 'business_value':
        return sorted.sort((a, b) => b.business_value_score - a.business_value_score);
      case 'readiness':
        return sorted.sort((a, b) => b.readiness_score - a.readiness_score);
      case 'timeline':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.requested_go_live_date || '2099-12-31');
          const dateB = new Date(b.requested_go_live_date || '2099-12-31');
          return dateA.getTime() - dateB.getTime();
        });
      default:
        return sorted;
    }
  };

  const getAiRecommendation = (request: OnboardingRequest): string => {
    const compositeScore = (request.readiness_score * 0.4) + (request.business_value_score * 0.4) + (request.confidence_percentage * 0.2);

    if (compositeScore >= 80 && request.readiness_score >= 75) {
      return 'Approve Now - High confidence, ready to proceed';
    } else if (compositeScore >= 65 && request.readiness_score >= 60) {
      return 'Approve with Conditions - Address minor gaps during development';
    } else if (compositeScore >= 50) {
      return 'Request Information - Schedule discovery call';
    } else {
      return 'Defer - Critical gaps or constraints present';
    }
  };

  const getRecommendationColor = (request: OnboardingRequest): string => {
    const compositeScore = (request.readiness_score * 0.4) + (request.business_value_score * 0.4) + (request.confidence_percentage * 0.2);

    if (compositeScore >= 80 && request.readiness_score >= 75) {
      return 'bg-green-50 border-green-200 text-green-800';
    } else if (compositeScore >= 65 && request.readiness_score >= 60) {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    } else if (compositeScore >= 50) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    } else {
      return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const sortedRequests = getSortedRequests();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Task Management & Prioritization</h2>
        <p className="text-slate-600 mt-1">Track action items and manage project priorities</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex">
            <button
              onClick={() => setViewMode('action_items')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                viewMode === 'action_items'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Action Items
            </button>
            <button
              onClick={() => setViewMode('requests')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                viewMode === 'requests'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Project Prioritization
            </button>
          </nav>
        </div>
      </div>

      {viewMode === 'action_items' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg">
                <ListChecks className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Action Items Management</h3>
                <p className="text-sm text-slate-700 mb-4">
                  Track, manage, and export action items to JIRA
                </p>
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Total Items</p>
                    <p className="text-xl font-bold text-blue-700">{actionItems.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Pending</p>
                    <p className="text-xl font-bold text-orange-700">
                      {actionItems.filter(a => a.status === 'pending').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">In Progress</p>
                    <p className="text-xl font-bold text-blue-700">
                      {actionItems.filter(a => a.status === 'in_progress').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Completed</p>
                    <p className="text-xl font-bold text-green-700">
                      {actionItems.filter(a => a.status === 'completed').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Story Points</p>
                    <p className="text-xl font-bold text-cyan-700">
                      {actionItems.reduce((sum, item) => sum + (item.story_points || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-slate-900">All Action Items</h3>
                {selectedItems.size > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    {selectedItems.size} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
                >
                  {selectedItems.size === actionItems.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={actionItems.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={actionItems.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Export to JIRA
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-10">
                      <div className="p-2">
                        <button
                          onClick={() => handleExport('jira')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                          <ExternalLink className="w-4 h-4 text-green-600" />
                          <span>JIRA Import Format (CSV)</span>
                        </button>
                        <button
                          onClick={() => handleExport('json')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                          <FileJson className="w-4 h-4 text-blue-600" />
                          <span>JSON Format</span>
                        </button>
                        <button
                          onClick={() => handleExport('csv')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-orange-600" />
                          <span>Full CSV Export</span>
                        </button>
                      </div>
                      <div className="border-t border-slate-200 p-2">
                        <p className="text-xs text-slate-500 px-3 py-1">
                          {selectedItems.size > 0
                            ? `Export ${selectedItems.size} selected items`
                            : `Export all ${actionItems.length} items`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : actionItems.length === 0 ? (
              <div className="text-center py-12">
                <ListChecks className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Action Items Yet</h3>
                <p className="text-slate-600">Upload an intake document to generate action items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      selectedItems.has(item.id)
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="mt-1.5 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />

                      <button
                        onClick={() => updateActionItemStatus(
                          item.id,
                          item.status === 'completed' ? 'pending' : 'completed'
                        )}
                        className="mt-1 flex-shrink-0"
                      >
                        {item.status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-300 hover:text-blue-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold ${item.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                {item.title}
                              </h4>
                              {item.jira_issue_key && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                  {item.jira_issue_key}
                                </span>
                              )}
                            </div>
                            {item.company_name && (
                              <p className="text-sm text-slate-500">Project: {item.company_name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            {item.story_points && (
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                {item.story_points} SP
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-3">{item.description}</p>

                        {item.labels && item.labels.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.labels.map((label, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                {label}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.status === 'blocked' && item.blocked_reason && (
                          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Blocked:</strong> {item.blocked_reason}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6 text-xs text-slate-500">
                            <span>Assigned: <span className="font-medium text-slate-700">{item.assigned_to}</span></span>
                            <span>Due: <span className="font-medium text-slate-700">{new Date(item.due_date).toLocaleDateString()}</span></span>
                            {item.category && (
                              <span>Category: <span className="font-medium text-slate-700">{item.category}</span></span>
                            )}
                          </div>
                          <button
                            onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            {editingItem === item.id ? 'Close' : 'Edit'}
                          </button>
                        </div>

                        {editingItem === item.id && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                                <select
                                  value={item.status}
                                  onChange={(e) => updateActionItem(item.id, { status: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="blocked">Blocked</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">JIRA Issue Key</label>
                                <input
                                  type="text"
                                  value={item.jira_issue_key || ''}
                                  onChange={(e) => updateActionItem(item.id, { jira_issue_key: e.target.value })}
                                  placeholder="e.g., EDI-123"
                                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                />
                              </div>
                            </div>
                            {item.status === 'blocked' && (
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Blocked Reason</label>
                                <textarea
                                  value={item.blocked_reason || ''}
                                  onChange={(e) => updateActionItem(item.id, { blocked_reason: e.target.value })}
                                  rows={2}
                                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                  placeholder="Describe why this item is blocked..."
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'requests' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg">
            <Zap className="w-6 h-6 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Intelligent Prioritization</h3>
            <p className="text-sm text-slate-700">
              AI analyzes business value, readiness level, risk exposure, and dependencies to recommend
              optimal prioritization. Replace tribal knowledge with data-driven decision intelligence.
            </p>
            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <p className="text-slate-600 mb-1">Requests Analyzed</p>
                <p className="text-xl font-bold text-cyan-700">{requests.length}</p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">Ready to Approve</p>
                <p className="text-xl font-bold text-green-700">
                  {requests.filter(r => r.readiness_score >= 80).length}
                </p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">Need Clarification</p>
                <p className="text-xl font-bold text-orange-700">
                  {requests.filter(r => r.readiness_score >= 50 && r.readiness_score < 80).length}
                </p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">High Risk</p>
                <p className="text-xl font-bold text-red-700">
                  {requests.filter(r => r.readiness_score < 50).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Prioritization Queue</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortCriteria)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ai_recommended">AI Recommended</option>
              <option value="business_value">Business Value</option>
              <option value="readiness">Readiness Score</option>
              <option value="timeline">Requested Timeline</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {sortedRequests.map((request, index) => (
            <div
              key={request.id}
              className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  {index === 0 && sortBy === 'ai_recommended' && (
                    <span className="text-xs font-medium text-cyan-600">Top Pick</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-slate-900">{request.request_number}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(request.priority)}`}>
                          {request.priority}
                        </span>
                        {request.trading_partner?.is_existing && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Existing Partner
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600">{request.trading_partner?.name}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {request.warehouse_location} • {request.wms_type || 'WMS TBD'} • {request.protocol || 'Protocol TBD'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Go-Live Target</p>
                      <p className="font-semibold text-slate-900">
                        {request.requested_go_live_date
                          ? new Date(request.requested_go_live_date).toLocaleDateString()
                          : 'TBD'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-slate-600" />
                        <p className="text-xs text-slate-600">Business Value</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{request.business_value_score}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <AlertCircle className="w-4 h-4 text-slate-600" />
                        <p className="text-xs text-slate-600">Readiness</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{request.readiness_score}%</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-4 h-4 text-slate-600" />
                        <p className="text-xs text-slate-600">Confidence</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{request.confidence_percentage}%</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="w-4 h-4 text-slate-600" />
                        <p className="text-xs text-slate-600">Est. Effort</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {request.readiness_score >= 80 ? '3-4w' : request.readiness_score >= 50 ? '5-6w' : '6-8w'}
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${getRecommendationColor(request)}`}>
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">AI Recommendation</p>
                        <p className="text-sm">{getAiRecommendation(request)}</p>
                      </div>
                    </div>
                  </div>

                  {request.missing_items && request.missing_items.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-600 font-medium mb-2">Missing Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.missing_items.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                            {item}
                          </span>
                        ))}
                        {request.missing_items.length > 3 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                            +{request.missing_items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Prioritization Factors</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Business Value (40%)</h4>
                <p className="text-slate-600">Revenue impact, strategic importance, customer relationship value</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Readiness Level (40%)</h4>
                <p className="text-slate-600">Requirements clarity, technical feasibility, constraint validation</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Risk Exposure (15%)</h4>
                <p className="text-slate-600">Blocker severity, timeline feasibility, dependency complexity</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Resource Availability (5%)</h4>
                <p className="text-slate-600">Team capacity, skill set match, parallel work optimization</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPriorityBadge(priority: string): string {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-slate-100 text-slate-600',
  };
  return colors[priority] || 'bg-slate-100 text-slate-600';
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-slate-100 text-slate-600',
  };
  return colors[priority] || 'bg-slate-100 text-slate-600';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
}
