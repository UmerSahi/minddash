import { useNavigate } from 'react-router-dom';
import { Sparkles, BarChart3, Bot, TrendingUp, LineChart, Shield, Upload, ArrowRight, CheckCircle, LayoutDashboard, FileText, Search } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

const features = [
  { icon: Sparkles, title: 'AI-Powered Analytics', desc: 'Automatically analyze datasets and discover insights with AI.' },
  { icon: LayoutDashboard, title: 'Interactive Dashboards', desc: 'Beautiful, interactive dashboards with real-time filtering.' },
  { icon: Bot, title: 'Natural Language Queries', desc: 'Ask questions about your data in plain English.' },
  { icon: Search, title: 'Anomaly Detection', desc: 'Automatically detect unusual patterns and outliers.' },
  { icon: LineChart, title: 'Forecasting', desc: 'Predict future trends with statistical forecasting.' },
  { icon: FileText, title: 'Report Generation', desc: 'Generate executive reports with one click.' },
];

const steps = [
  { num: '01', title: 'Upload Your Data', desc: 'Drag and drop your CSV dataset. MindDash analyzes it automatically.' },
  { num: '02', title: 'Explore Insights', desc: 'Interactive dashboards, KPIs, and AI-generated insights appear instantly.' },
  { num: '03', title: 'Ask Your AI Analyst', desc: 'Ask questions in plain English and get data-backed answers.' },
  { num: '04', title: 'Make Better Decisions', desc: 'Use forecasts, reports, and recommendations to drive business growth.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Sign In</button>
            <button onClick={() => navigate('/signup')} className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all cursor-pointer font-medium active:scale-[0.97]">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
            <Sparkles size={14} /> AI-Powered Business Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            <span className="gradient-text">Transform</span>{' '}
            <span className="text-foreground">Data</span>
            <br />
            <span className="text-foreground">Into</span>{' '}
            <span className="gradient-text">Decisions</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            MindDash turns raw business data into interactive dashboards, intelligent insights, forecasts, and actionable recommendations — powered by AI.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/signup')} className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all cursor-pointer font-semibold text-base active:scale-[0.97] flex items-center gap-2">
              Get Started Free <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login?demo=true')} className="px-8 py-3.5 bg-card border border-card-border text-foreground rounded-xl hover:border-primary/40 transition-all cursor-pointer font-medium text-base active:scale-[0.97] flex items-center gap-2">
              <BarChart3 size={18} /> Explore Demo
            </button>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
            <div><div className="text-2xl font-bold gradient-text">Upload</div><div className="text-xs text-muted-foreground mt-1">CSV Data</div></div>
            <div><div className="text-2xl font-bold gradient-text">AI</div><div className="text-xs text-muted-foreground mt-1">Analyzes</div></div>
            <div><div className="text-2xl font-bold gradient-text">Insights</div><div className="text-xs text-muted-foreground mt-1">Delivered</div></div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="card p-6 md:p-8 rounded-2xl shadow-glow">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Revenue', value: '$2.45M', change: '+18.6%' },
                { label: 'Total Profit', value: '$1.02M', change: '+12.3%' },
                { label: 'Total Orders', value: '8,732', change: '+8.2%' },
                { label: 'Profit Margin', value: '41.6%', change: '+3.2%' },
              ].map((kpi, i) => (
                <div key={i} className="bg-background/50 rounded-xl p-4 border border-card-border">
                  <div className="text-muted-foreground text-xs mb-1">{kpi.label}</div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="text-xs text-success mt-1">{kpi.change} vs previous period</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-xl p-4 border border-card-border h-48 flex items-center justify-center">
                <div className="text-center">
                  <LineChart size={32} className="text-primary mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Revenue Trend Chart</div>
                </div>
              </div>
              <div className="bg-background/50 rounded-xl p-4 border border-card-border h-48 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 size={32} className="text-secondary mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Category Breakdown</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" id="features">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">From data upload to AI-powered insights — MindDash handles the entire analytics workflow.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="card p-6 hover:translate-y-[-2px]">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Get started in minutes — no technical skills required.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">{step.num}</span>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                {i < steps.length - 1 && <div className="hidden md:block absolute w-full h-px bg-gradient-to-r from-primary/20 to-transparent top-7 -right-1/2" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center card p-12 rounded-2xl">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Turn Your Data Into Your Competitive Advantage</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Upload your first dataset and see what MindDash can do — no credit card required.</p>
          <button onClick={() => navigate('/signup')} className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all cursor-pointer font-semibold text-base active:scale-[0.97] inline-flex items-center gap-2">
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="text-xs text-muted-foreground">AI • DATA • INSIGHTS</div>
          <div className="text-xs text-muted-foreground">© 2025 MindDash. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}