import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  HiSearch, HiPlusCircle, HiShieldCheck, HiLightningBolt, 
  HiDeviceMobile, HiIdentification, HiShoppingBag, HiSpeakerphone,
  HiBriefcase, HiKey
} from 'react-icons/hi';

const features = [
  { icon: <HiSearch className="w-7 h-7" />, title: 'Smart Matching', desc: 'AI-powered matching using text and image analysis to find your items faster.' },
  { icon: <HiLightningBolt className="w-7 h-7" />, title: 'Instant Alerts', desc: 'Get notified the moment a potential match is found for your lost item.' },
  { icon: <HiShieldCheck className="w-7 h-7" />, title: 'Secure & Private', desc: 'Your data is encrypted and your contact info is only shared when you choose.' },
];

const stats = [
  { value: '10K+', label: 'Recovered' },
  { value: '50K+', label: 'Active Users' },
  { value: '95%', label: 'Match Rate' },
  { value: '24/7', label: 'AI Monitoring' },
];

export default function Landing() {
  const { dark } = useTheme();
  return (
    <div className="relative overflow-hidden bg-surface-50 font-sans">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,var(--color-primary-500),transparent_80%)] opacity-[0.03] dark:opacity-[0.07]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-bold text-primary-600 dark:text-primary-400 mb-8 tracking-widest uppercase">
              <HiLightningBolt className="w-4 h-4" />
              <span>Smart Match v2.0 is live</span>
            </div>
            
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-surface-950 dark:text-surface-950 leading-[0.85] mb-8">
              Smart<br />
              <span className="text-primary-600 dark:text-primary-500">Lost & Found</span><br />
              System
            </h1>
            
            <p className="text-lg md:text-xl text-surface-600 dark:text-surface-400 max-w-xl leading-relaxed mb-12">
              The fastest way to find what you've lost. Report items, discover matches, and reconnect with your belongings in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/report/lost"
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary-500 to-blue-600 text-white font-black rounded-full hover:scale-[1.02] transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2"
              >
                GET STARTED
              </Link>
              <Link
                to="/report/found"
                className="w-full sm:w-auto px-10 py-4 bg-transparent text-surface-950 dark:text-surface-950 font-black rounded-full border-2 border-surface-950 dark:border-surface-950 hover:bg-surface-950/5 transition-all flex items-center justify-center gap-2"
              >
                LEARN MORE
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary-500/10 rounded-[2.5rem] blur-3xl -z-10" />
            <div className="relative rounded-[2.5rem] border border-surface-200 dark:border-surface-800 bg-surface-100/30 backdrop-blur-md p-3 overflow-hidden shadow-2xl">
              <img 
                src="/dashboard-mockup.png" 
                alt="Product Dashboard Mockup" 
                className="w-full h-auto rounded-[1.8rem] shadow-2xl border border-white/10"
              />
              {/* Floating Shield */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 -left-6 p-4 rounded-2xl glass border border-white/20 shadow-2xl flex items-center gap-4 z-20"
              >
                <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center text-white shadow-lg">
                  <HiShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-left pr-2">
                  <p className="text-xs font-bold text-surface-950 dark:text-white">Secure Match</p>
                  <p className="text-[10px] text-surface-500">Secure & Verified</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Stats Divider */}
      <section className="border-y border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-100 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center space-y-2"
            >
              <div className="text-4xl font-bold text-surface-900 dark:text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-surface-500 dark:text-surface-400 uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-6 tracking-tight">
            Designed for results.
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400 font-light leading-relaxed">
            We've combined advanced computer vision with a seamless user experience to make recovering lost items remarkably simple.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15 }}
              className="group p-10 rounded-[2.5rem] bg-surface-50 dark:bg-surface-100 border border-surface-100 dark:border-surface-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 leading-relaxed font-light">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 max-w-7xl mx-auto mb-20 relative z-10">
        <div className="rounded-[3rem] bg-slate-900 overflow-hidden relative p-12 md:p-24 text-center flex flex-col items-center">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary-500),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--color-indigo-500),transparent)]" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">
              Let's find it together.
            </h2>
            <p className="text-indigo-100/80 text-lg md:text-xl font-light mb-12">
              Join thousands of users who have already recovered their most precious items using our smart platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-10 py-5 bg-surface-50 dark:bg-surface-50 text-surface-950 dark:text-surface-950 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-10 py-5 bg-transparent text-white font-bold rounded-2xl border border-white/20 hover:bg-surface-50/10 transition-all"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
