import React, { useState, useEffect } from 'react';
import {
  Video,
  Calendar,
  Plus,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Meeting {
  id: string;
  meeting_title: string;
  meeting_date: string;
  participants: any[];
  status: string;
  ai_avatar_active: boolean;
  intake_id: string | null;
  company_name?: string;
}

export default function AIAvatarMeeting() {
  const [view, setView] = useState<'list' | 'schedule' | 'meeting'>('list');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Form state
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [selectedIntake, setSelectedIntake] = useState('');
  const [participants, setParticipants] = useState('');
  const [includeAI, setIncludeAI] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const { data: meetingsData } = await supabase
      .from('meeting_sessions')
      .select(`
        *,
        intake:intake_extractions(company_name)
      `)
      .order('meeting_date', { ascending: false });

    const { data: intakesData } = await supabase
      .from('intake_extractions')
      .select('id, company_name')
      .order('created_at', { ascending: false });

    if (meetingsData) {
      setMeetings(meetingsData.map(m => ({
        ...m,
        company_name: m.intake?.company_name
      })));
    }

    if (intakesData) {
      setIntakes(intakesData);
    }

    setLoading(false);
  };

  const scheduleMeeting = async () => {
    if (!meetingTitle || !meetingDate || !meetingTime) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);

    const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
    const participantList = participants.split(',').map(p => p.trim()).filter(p => p);

    const { error } = await supabase
      .from('meeting_sessions')
      .insert({
        meeting_title: meetingTitle,
        meeting_date: meetingDateTime.toISOString(),
        participants: participantList,
        intake_id: selectedIntake || null,
        ai_avatar_active: includeAI,
        status: 'scheduled'
      });

    setCreating(false);

    if (error) {
      console.error('Error scheduling meeting:', error);
      alert('Failed to schedule meeting');
    } else {
      alert('Meeting scheduled successfully!');
      resetForm();
      loadData();
      setView('list');
    }
  };

  const resetForm = () => {
    setMeetingTitle('');
    setMeetingDate('');
    setMeetingTime('');
    setSelectedIntake('');
    setParticipants('');
    setIncludeAI(true);
  };

  const joinMeeting = async (meeting: Meeting) => {
    await supabase
      .from('meeting_sessions')
      .update({ status: 'in_progress' })
      .eq('id', meeting.id);

    setSelectedMeeting(meeting);
    setView('meeting');
  };

  const endMeeting = async () => {
    if (selectedMeeting) {
      await supabase
        .from('meeting_sessions')
        .update({ status: 'completed' })
        .eq('id', selectedMeeting.id);

      setSelectedMeeting(null);
      setView('list');
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Avatar Meetings</h2>
          <p className="text-slate-600 mt-1">Schedule and join meetings with RHELO, your professional AI assistant</p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('schedule')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Schedule Meeting
          </button>
        )}
        {view !== 'list' && view !== 'meeting' && (
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Back to List
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-Time Meetings with RHELO</h3>
                <p className="text-sm text-slate-700 mb-4">
                  Schedule meetings with RHELO, your professional and energetic AI assistant who delivers instant answers,
                  provides valuable insights, and captures decisions with precision in real-time.
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Total Meetings</p>
                    <p className="text-xl font-bold text-blue-700">{meetings.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Scheduled</p>
                    <p className="text-xl font-bold text-orange-700">
                      {meetings.filter(m => m.status === 'scheduled').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Completed</p>
                    <p className="text-xl font-bold text-green-700">
                      {meetings.filter(m => m.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Meetings</h3>

            {meetings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Meetings Scheduled</h3>
                <p className="text-slate-600 mb-4">Schedule your first meeting to get started</p>
                <button
                  onClick={() => setView('schedule')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Meeting
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900">{meeting.meeting_title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            meeting.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {meeting.status}
                          </span>
                          {meeting.ai_avatar_active && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              RHELO
                            </span>
                          )}
                        </div>

                        {meeting.company_name && (
                          <p className="text-sm text-slate-600 mb-2">Project: {meeting.company_name}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(meeting.meeting_date).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {Array.isArray(meeting.participants) ? meeting.participants.length : 0} participants
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {meeting.status === 'scheduled' && (
                          <button
                            onClick={() => joinMeeting(meeting)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Join Meeting
                          </button>
                        )}
                        {meeting.status === 'completed' && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
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

      {view === 'schedule' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Schedule New Meeting</h3>

          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meeting Title *
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g., EDI Implementation Kickoff"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Related Project (Optional)
              </label>
              <select
                value={selectedIntake}
                onChange={(e) => setSelectedIntake(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No project selected</option>
                {intakes.map((intake) => (
                  <option key={intake.id} value={intake.id}>
                    {intake.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Participants (comma-separated emails)
              </label>
              <textarea
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="john@example.com, jane@example.com"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeAI"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="includeAI" className="text-sm text-slate-700">
                Include RHELO (AI Avatar) in this meeting
              </label>
            </div>

            {includeAI && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-700">
                    <p className="font-medium text-slate-900 mb-1">RHELO will:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Answer questions with professional expertise and enthusiasm</li>
                      <li>Provide instant, context-aware insights from intake documents</li>
                      <li>Efficiently capture key decisions and action items</li>
                      <li>Generate comprehensive, actionable meeting summaries</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={scheduleMeeting}
                disabled={creating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Schedule Meeting
                  </>
                )}
              </button>
              <button
                onClick={() => setView('list')}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'meeting' && selectedMeeting && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedMeeting.meeting_title}</h3>
              <p className="text-sm text-slate-600">Meeting in progress</p>
            </div>
            <button
              onClick={endMeeting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              End Meeting
            </button>
          </div>

          <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center mb-6">
            <div className="text-center">
              <Video className="w-16 h-16 text-white mx-auto mb-4" />
              <p className="text-white text-lg font-medium mb-2">Video Meeting Interface</p>
              <p className="text-slate-400 text-sm">
                Real-time video meeting powered by WebRTC
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Integration ready for Daily.co or custom WebRTC implementation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">Participants</h4>
              <div className="space-y-2">
                {Array.isArray(selectedMeeting.participants) && selectedMeeting.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-700">{p}</span>
                  </div>
                ))}
                {selectedMeeting.ai_avatar_active && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-700 font-medium">RHELO (AI)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">Meeting Info</h4>
              <div className="space-y-1 text-sm text-slate-600">
                <p>Started: {new Date(selectedMeeting.meeting_date).toLocaleTimeString()}</p>
                {selectedMeeting.company_name && <p>Project: {selectedMeeting.company_name}</p>}
                <p className="text-green-600 font-medium mt-2">Recording in progress...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
