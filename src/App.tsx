import { useState } from 'react';
import {
  LayoutDashboard,
  FileSearch,
  MessageSquare,
  Activity,
  Target,
  ListChecks,
  FileCheck,
  Zap,
  Upload,
  BarChart3,
  Brain,
  Workflow,
  FileText
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import IntakeIntelligence from './components/IntakeIntelligence';
import MeetingCapture from './components/MeetingCapture';
import ReadinessScoring from './components/ReadinessScoring';
import ScenarioExplorer from './components/ScenarioExplorer';
import Prioritization from './components/Prioritization';
import ReviewApproval from './components/ReviewApproval';
import DocumentUpload from './components/DocumentUpload';
import IntakeAnalysis from './components/IntakeAnalysis';
import AIAvatarMeeting from './components/AIAvatarMeeting';
import AutomationHub from './components/AutomationHub';
import AIIntakeForm from './components/AIIntakeForm';

type ViewType = 'dashboard' | 'ai-intake-form' | 'intake' | 'meetings' | 'readiness' | 'scenarios' | 'prioritization' | 'review' | 'upload' | 'analysis' | 'ai-meeting' | 'automation-hub';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedIntakeId, setSelectedIntakeId] = useState<string | null>(null);

  const navigation = [
    { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'ai-intake-form', label: 'EDI Intake Form', icon: FileText, highlight: true },
    { id: 'upload', label: 'Upload Intake', icon: Upload, highlight: true },
    { id: 'analysis', label: 'Intake Analysis', icon: BarChart3, highlight: true },
    { id: 'automation-hub', label: 'Automation Hub', icon: Workflow, highlight: true },
    { id: 'ai-meeting', label: 'AI Meeting Assistant', icon: Brain, highlight: true },
    { id: 'intake', label: 'Intake Intelligence', icon: FileSearch },
    { id: 'meetings', label: 'Meeting Capture', icon: MessageSquare },
    { id: 'readiness', label: 'Readiness Scoring', icon: Activity },
    { id: 'scenarios', label: 'Scenario Explorer', icon: Target },
    { id: 'prioritization', label: 'Prioritization', icon: ListChecks },
    { id: 'review', label: 'Review & Approval', icon: FileCheck },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'ai-intake-form':
        return <AIIntakeForm />;
      case 'upload':
        return <DocumentUpload onUploadComplete={() => setCurrentView('analysis')} />;
      case 'analysis':
        return <IntakeAnalysis />;
      case 'automation-hub':
        return <AutomationHub intakeId={selectedIntakeId} />;
      case 'ai-meeting':
        return <AIAvatarMeeting />;
      case 'intake':
        return <IntakeIntelligence />;
      case 'meetings':
        return <MeetingCapture />;
      case 'readiness':
        return <ReadinessScoring />;
      case 'scenarios':
        return <ScenarioExplorer />;
      case 'prioritization':
        return <Prioritization />;
      case 'review':
        return <ReviewApproval />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-2.5 rounded-xl shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  EDI Onboarding Intelligence Platform
                </h1>
                <p className="text-sm text-slate-600">Powered by AI Document Intelligence & Smart Meetings</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium shadow-md">
                AI-Powered Automation
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1600px] mx-auto">
        <aside className="w-64 bg-white/50 backdrop-blur-sm border-r border-slate-200/50 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isHighlight = item.highlight;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ViewType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive && isHighlight
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : isActive
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                      : isHighlight
                      ? 'text-blue-700 hover:bg-blue-50 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-white' :
                    isHighlight ? 'text-blue-600' :
                    'text-slate-400'
                  }`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 mx-4 mt-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-sm text-blue-900">AI Features</h3>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Upload intake forms to extract data, get AI analysis, and use the meeting assistant for intelligent collaboration.
            </p>
          </div>
        </aside>

        <main className={`flex-1 ${currentView === 'ai-intake-form' ? 'p-1' : 'p-8'}`}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
