import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight,BookOpen,Clock3,GraduationCap,ShieldCheck} from 'lucide-react';

export default function StudentHome(){
  const nav=useNavigate();
  const [code,setCode]=useState('');
  const [error,setError]=useState('');
  const openTest=e=>{
    e.preventDefault();
    const clean=code.trim().toUpperCase();
    if(!clean){setError('Please enter your Test ID');return;}
    setError('');
    nav(`/test/${encodeURIComponent(clean)}`);
  };
  return <div className="min-h-screen overflow-hidden bg-[#070b16]">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(37,99,235,.18),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(124,58,237,.16),transparent_28%)]"/>
    <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
      <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600"><GraduationCap size={24}/></div><div><p className="font-bold">MockTest Pro</p><p className="text-xs text-slate-500">Student Portal</p></div></div>
      <button onClick={()=>nav('/login')} className="glass rounded-xl px-4 py-2 text-sm text-slate-300 hover:text-white">Admin Login</button>
    </header>
    <main className="relative mx-auto grid min-h-[calc(100vh-90px)] max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-2">
      <section><span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300"><ShieldCheck size={15}/> SECURE ONLINE EXAMINATION</span><h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">Your test starts <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">here.</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-400 md:text-lg">Enter the Test ID shared by your teacher or placement coordinator. Verify your details, read the instructions and start your exam.</p><div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3"><Feature Icon={BookOpen} title="Easy Access" text="Join using Test ID"/><Feature Icon={Clock3} title="Live Timer" text="Auto-submit enabled"/><Feature Icon={ShieldCheck} title="Secure Exam" text="Violation tracking"/></div></section>
      <section className="lg:pl-10"><form onSubmit={openTest} className="glass mx-auto max-w-lg rounded-[2rem] p-6 shadow-2xl shadow-blue-950/20 md:p-9"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600"><GraduationCap/></div><p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-blue-400">Student Access</p><h2 className="mt-2 text-3xl font-bold">Enter your test</h2><p className="mt-2 text-sm text-slate-400">Use the Test ID provided by the admin.</p>{error&&<p className="mt-5 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p>}<label className="mt-7 block text-sm font-medium text-slate-300">Test ID</label><input autoFocus value={code} onChange={e=>setCode(e.target.value)} className="field mt-2 uppercase tracking-wider" placeholder="e.g. APT-2026-X7K92"/><button className="btn-primary mt-5 flex w-full items-center justify-center gap-2 py-3">Continue to Test <ArrowRight size={18}/></button><p className="mt-7 text-center text-xs text-slate-600">Designed & Developed by <span className="text-violet-400">Hridyansh Chaudhary</span></p></form></section>
    </main>
  </div>
}
function Feature({Icon,title,text}){return <div className="glass rounded-2xl p-4"><Icon className="text-blue-400" size={20}/><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-slate-500">{text}</p></div>}
