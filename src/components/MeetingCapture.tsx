import { useEffect, useState } from 'react';
import { supabase, Meeting, OnboardingRequest } from '../lib/supabase';
import { MessageSquare, Users, CheckCircle, HelpCircle, AlertTriangle, FileText, Sparkles } from 'lucide-react';

export default function MeetingCapture() {
  const [meetings, setMeetings] = useState<(Meeting & { onboarding_request: OnboardingRequest })[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<(Meeting & { onboarding_request: OnboardingRequest }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meetings')
      .select('*, onboarding_request:onboarding_requests(*, trading_partner:trading_partners(*))')
      .order('meeting_date', { ascending: false });

    if (data) {
      setMeetings(data as any);
      if (data.length > 0 && !selectedMeeting) {
        setSelectedMeeting(data[0] as any);
      }
    }
    setLoading(false);
  };

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
        <h2 className="text-2xl font-bold text-slate-900">Meeting & Knowledge Capture</h2>
        <p className="text-slate-600 mt-1">AI-powered extraction from discovery calls and technical discussions</p>
      </div>

      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg">
            <Sparkles className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Meeting Intelligence</h3>
            <p className="text-sm text-slate-700">
              Automatically transcribes calls, extracts decisions, identifies assumptions, captures open questions,
              and highlights constraints. No more lost context or fragmented documentation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-900">Recent Meetings</h3>
          </div>
          <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
            {meetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => setSelectedMeeting(meeting)}
                className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  selectedMeeting?.id === meeting.id ? 'bg-cyan-50 border-l-4 border-l-cyan-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getMeetingTypeColor(meeting.meeting_type)}`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 capitalize">{meeting.meeting_type} Call</p>
                    <p className="text-sm text-slate-600 truncate">
                      {meeting.onboarding_request.request_number}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(meeting.meeting_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedMeeting && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 capitalize">
                      {selectedMeeting.meeting_type} Call
                    </h3>
                    <p className="text-slate-600">{selectedMeeting.onboarding_request.request_number}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(selectedMeeting.meeting_date).toLocaleDateString()} at{' '}
                      {new Date(selectedMeeting.meeting_date).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getMeetingTypeColor(selectedMeeting.meeting_type)}`}>
                    {selectedMeeting.meeting_type}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-slate-600" />
                    <h4 className="font-semibold text-slate-900">Participants</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeeting.participants.map((participant, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm"
                      >
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">AI-Generated Summary</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedMeeting.ai_summary}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedMeeting.decisions_made && selectedMeeting.decisions_made.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-slate-900">Decisions Made</h4>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {selectedMeeting.decisions_made.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedMeeting.decisions_made.map((decision, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{decision}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMeeting.assumptions && selectedMeeting.assumptions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">Assumptions</h4>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {selectedMeeting.assumptions.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedMeeting.assumptions.map((assumption, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{assumption}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMeeting.open_questions && selectedMeeting.open_questions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-slate-900">Open Questions</h4>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {selectedMeeting.open_questions.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedMeeting.open_questions.map((question, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <HelpCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{question}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMeeting.constraints && selectedMeeting.constraints.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-slate-900">Constraints Identified</h4>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      {selectedMeeting.constraints.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedMeeting.constraints.map((constraint, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{constraint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <h4 className="font-semibold text-slate-900">Transcript</h4>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {selectedMeeting.transcript}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Value Delivered</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Automatic capture of critical decisions and action items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Structured extraction of technical constraints and open questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Eliminates manual note-taking and email follow-ups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Creates searchable knowledge base for future onboardings</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getMeetingTypeColor(type: string): string {
  const colors: Record<string, string> = {
    intake: 'bg-blue-100 text-blue-700',
    discovery: 'bg-cyan-100 text-cyan-700',
    technical: 'bg-purple-100 text-purple-700',
    review: 'bg-orange-100 text-orange-700',
  };
  return colors[type] || 'bg-slate-100 text-slate-700';
}
