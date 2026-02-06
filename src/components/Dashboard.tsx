import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Activity,
  Zap,
  Target,
  Users,
  BarChart3,
  Sparkles,
  Timer,
  TrendingDown,
  AlertCircle
} from 'lucide-react';

interface LifecycleStage {
  name: string;
  shortName: string;
  count: number;
  percentage: number;
  color: string;
  icon: any;
}

interface Partner {
  name: string;
  status: string;
  stage: string;
  progress: number;
  lastUpdate: string;
}

export default function Dashboard() {
  const [lifecycleStages, setLifecycleStages] = useState<LifecycleStage[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [metrics, setMetrics] = useState({
    totalPartners: 0,
    successRate: 88,
    avgCycleTimeWithAI: 8.5,
    avgCycleTimeWithoutAI: 18,
    timeSaved: 53,
    automationLevel: 72,
    qualityImprovement: 85,
    manualHoursSaved: 450,
    activeIntakes: 0,
    completedThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    const { data: intakes } = await supabase
      .from('intake_extractions')
      .select(`
        *,
        ai_analysis(readiness_score, complexity_level),
        action_items(status)
      `)
      .order('created_at', { ascending: false });

    if (intakes) {
      const stageData: LifecycleStage[] = [
        {
          name: 'Initial Contact',
          shortName: 'Contact',
          count: intakes.filter(i => {
            const score = i.ai_analysis?.[0]?.readiness_score || 0;
            return score < 40;
          }).length,
          percentage: 0,
          color: 'from-green-400 to-green-600',
          icon: Users
        },
        {
          name: 'System Setup',
          shortName: 'Setup',
          count: intakes.filter(i => {
            const score = i.ai_analysis?.[0]?.readiness_score || 0;
            return score >= 40 && score < 60;
          }).length,
          percentage: 0,
          color: 'from-yellow-400 to-yellow-600',
          icon: Activity
        },
        {
          name: 'Testing & Validation',
          shortName: 'Testing',
          count: intakes.filter(i => {
            const score = i.ai_analysis?.[0]?.readiness_score || 0;
            const actionItems = i.action_items || [];
            return score >= 60 && score < 85 && actionItems.length > 0;
          }).length,
          percentage: 0,
          color: 'from-orange-400 to-orange-600',
          icon: Target
        },
        {
          name: 'Post-Launch Support',
          shortName: 'Support',
          count: intakes.filter(i => {
            const score = i.ai_analysis?.[0]?.readiness_score || 0;
            const completedActions = i.action_items?.filter((a: any) => a.status === 'completed').length || 0;
            const totalActions = i.action_items?.length || 0;
            return score >= 85 || (totalActions > 0 && completedActions / totalActions >= 0.8);
          }).length,
          percentage: 0,
          color: 'from-cyan-400 to-cyan-600',
          icon: CheckCircle
        }
      ];

      const total = stageData.reduce((sum, stage) => sum + stage.count, 0);
      stageData.forEach(stage => {
        stage.percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0;
      });

      const partnerData: Partner[] = intakes.slice(0, 5).map(intake => {
        const score = intake.ai_analysis?.[0]?.readiness_score || 0;
        let stage = 'Initial Contact';
        let status = 'IN PROGRESS';

        if (score >= 85) {
          stage = 'Post-Launch Support';
          const completedActions = intake.action_items?.filter((a: any) => a.status === 'completed').length || 0;
          const totalActions = intake.action_items?.length || 0;
          if (totalActions > 0 && completedActions === totalActions) {
            status = 'COMPLETE';
          }
        } else if (score >= 60) {
          stage = 'Testing & Validation';
        } else if (score >= 40) {
          stage = 'System Setup';
        }

        const daysAgo = Math.floor((Date.now() - new Date(intake.created_at).getTime()) / (1000 * 60 * 60 * 24));

        return {
          name: intake.company_name || 'Unknown Partner',
          status,
          stage,
          progress: score,
          lastUpdate: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`
        };
      });

      const completedThisMonth = intakes.filter(i => {
        const score = i.ai_analysis?.[0]?.readiness_score || 0;
        const created = new Date(i.created_at);
        const now = new Date();
        return score >= 85 &&
               created.getMonth() === now.getMonth() &&
               created.getFullYear() === now.getFullYear();
      }).length;

      setLifecycleStages(stageData);
      setPartners(partnerData);
      setMetrics(prev => ({
        ...prev,
        totalPartners: total,
        activeIntakes: intakes.length,
        completedThisMonth
      }));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Executive Overview</h2>
          <p className="text-slate-600 text-sm mt-1">
            Real-time lifecycle tracking and efficiency analytics
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-700 font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })} EST
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{metrics.automationLevel}%</div>
              <div className="text-xs text-blue-100 mt-1">Automation Level</div>
            </div>
          </div>
          <div className="text-sm text-blue-100">
            AI-powered intake processing and intelligent routing
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <Timer className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{metrics.timeSaved}%</div>
              <div className="text-xs text-green-100 mt-1">Time Reduction</div>
            </div>
          </div>
          <div className="text-sm text-green-100">
            {metrics.avgCycleTimeWithAI} days avg vs {metrics.avgCycleTimeWithoutAI} days traditional
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{metrics.manualHoursSaved}</div>
              <div className="text-xs text-orange-100 mt-1">Hours Saved</div>
            </div>
          </div>
          <div className="text-sm text-orange-100">
            Manual effort eliminated through intelligent automation
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{metrics.qualityImprovement}%</div>
              <div className="text-xs text-cyan-100 mt-1">Quality Improvement</div>
            </div>
          </div>
          <div className="text-sm text-cyan-100">
            Fewer errors and rework through structured intake process
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">AI-Powered Value Delivery</h3>
              <p className="text-sm text-slate-600">Platform capabilities driving efficiency</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900 text-sm mb-1">Intelligent Document Processing</div>
                <div className="text-xs text-slate-600">Automated intake form extraction with 95% accuracy</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '95%' }} />
                  </div>
                  <span className="text-xs font-semibold text-blue-600">95%</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="p-2 bg-green-600 rounded-lg">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900 text-sm mb-1">Proactive Risk Detection</div>
                <div className="text-xs text-slate-600">Early identification of onboarding blockers</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: '87%' }} />
                  </div>
                  <span className="text-xs font-semibold text-green-600">87%</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900 text-sm mb-1">Automated Action Planning</div>
                <div className="text-xs text-slate-600">AI-generated work breakdown and assignments</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-orange-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-600 rounded-full" style={{ width: '92%' }} />
                  </div>
                  <span className="text-xs font-semibold text-orange-600">92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Efficiency Impact</h3>
              <p className="text-sm text-slate-600">Key performance improvements</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Intake Processing Time</span>
                <span className="text-sm font-bold text-green-600">↓ 75%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="text-slate-600 mb-1">Before AI</div>
                  <div className="font-bold text-slate-900">4-6 hours</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-green-700 mb-1">With AI</div>
                  <div className="font-bold text-green-900">15-20 min</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Missing Info Detection</span>
                <span className="text-sm font-bold text-green-600">↑ 3.5x faster</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="text-slate-600 mb-1">Manual Review</div>
                  <div className="font-bold text-slate-900">Discovery delayed</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-green-700 mb-1">AI Analysis</div>
                  <div className="font-bold text-green-900">Instant identification</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Project Planning</span>
                <span className="text-sm font-bold text-green-600">↓ 60%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="text-slate-600 mb-1">Manual</div>
                  <div className="font-bold text-slate-900">2-3 days</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-green-700 mb-1">Automated</div>
                  <div className="font-bold text-green-900">~1 day</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Onboarding Lifecycle Stages</h3>
              <p className="text-sm text-slate-300">Current partner distribution across onboarding phases</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {lifecycleStages.map((stage, index) => (
              <div key={stage.name} className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${stage.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <stage.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-300 mb-1">{stage.shortName}</div>
                      <div className="text-2xl font-bold">{stage.count}</div>
                      <div className="text-xs text-slate-400 mt-1">{stage.percentage}%</div>
                    </div>
                  </div>
                </div>
                {index < lifecycleStages.length - 1 && (
                  <div className="absolute top-1/3 -right-2 w-4 h-0.5 bg-white/30 hidden lg:block" />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{metrics.successRate}%</div>
              <div className="text-xs text-slate-300">Overall Success Rate</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{metrics.activeIntakes}</div>
              <div className="text-xs text-slate-300">Active Partners</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Active Partners</h3>
          </div>

          <div className="space-y-3">
            {partners.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No active partners</p>
              </div>
            ) : (
              partners.map((partner, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 text-sm mb-1">{partner.name}</div>
                      <div className="text-xs text-slate-600">{partner.stage}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      partner.status === 'COMPLETE'
                        ? 'bg-green-100 text-green-700'
                        : partner.status === 'IN PROGRESS'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {partner.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Progress</span>
                    <span className="font-semibold">{partner.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${
                        partner.progress >= 85
                          ? 'from-green-400 to-green-600'
                          : partner.progress >= 60
                          ? 'from-blue-400 to-blue-600'
                          : 'from-orange-400 to-orange-600'
                      } transition-all duration-500`}
                      style={{ width: `${partner.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-2">Last update: {partner.lastUpdate}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Platform ROI Summary</h3>
            <p className="text-sm text-slate-600 mb-6">Comprehensive efficiency gains across the onboarding lifecycle</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 transition-all hover:shadow-md group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">Cycle Time Reduction</div>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">{metrics.timeSaved}%</div>
                <div className="text-xs text-slate-500 leading-relaxed">From {metrics.avgCycleTimeWithoutAI} to {metrics.avgCycleTimeWithAI} days average</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-green-300 transition-all hover:shadow-md group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Timer className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">Manual Hours Eliminated</div>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">{metrics.manualHoursSaved}</div>
                <div className="text-xs text-slate-500 leading-relaxed">Quarterly savings across all onboardings</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-orange-300 transition-all hover:shadow-md group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Zap className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">Process Automation</div>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">{metrics.automationLevel}%</div>
                <div className="text-xs text-slate-500 leading-relaxed">Of intake-to-planning workflow automated</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-cyan-300 transition-all hover:shadow-md group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors">
                    <CheckCircle className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">Quality & Accuracy</div>
                </div>
                <div className="text-3xl font-bold text-cyan-600 mb-2">{metrics.qualityImprovement}%</div>
                <div className="text-xs text-slate-500 leading-relaxed">Reduction in errors and rework cycles</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
