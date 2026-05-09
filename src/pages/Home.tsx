import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Ruler, CheckCircle2, Search, ArrowRight, Star, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

export default function Home() {
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState<Order | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery) return;
    
    setSearching(true);
    setError('');
    setOrderStatus(null);
    
    try {
      const q = query(collection(db, 'orders'), where('__name__', '==', orderQuery));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setOrderStatus({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order);
      } else {
        setError('Order not found. Please check your Order ID.');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 group transition-transform hover:rotate-12">
              <Scissors size={20} className="sm:w-6 sm:h-6" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">STITCH<span className="text-indigo-600">MASTER</span></span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-10">
            <div className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <a href="#services" className="hover:text-indigo-600 transition-colors">Experience</a>
              <a href="#tracking" className="hover:text-indigo-600 transition-colors">Tracking</a>
              <a href="#contact" className="hover:text-indigo-600 transition-colors">Philosophy</a>
            </div>
            <Link to="/orders" className="px-5 sm:px-7 py-2.5 sm:py-3.5 bg-slate-950 text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">Admin Console</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-48 pb-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 sm:space-y-12"
          >
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
              <Star size={14} />
              <span>Couture & Precision</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] text-slate-900">
              The Art of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Perfect Fit.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-xl font-medium">
              We've digitized the bespoke experience. High-end tailoring meets modern efficiency for the modern individual who demands excellence in every thread.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#tracking" className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 group">
                Trace Your Order <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#services" className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all flex items-center justify-center">
                Explore Studio
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] relative z-10 border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1594932224828-b4b059b6f6f9?q=80&w=2680&auto=format&fit=crop" 
                alt="Tailor working"
                className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-[2s]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
            </div>
            
            <div className="absolute -bottom-10 -right-4 sm:-right-10 bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl z-20 border border-slate-100 flex items-center gap-6 animate-bounce-subtle">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 leading-none">500+</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Bespoke Clients</p>
              </div>
            </div>
            
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center">
          <div className="p-8 space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 mx-auto">
              <Ruler size={32} />
            </div>
            <h3 className="text-xl font-bold">Perfect Measurement</h3>
            <p className="text-slate-500">We store your profile digitally to ensure every future order fits exactly like the first one.</p>
          </div>
          <div className="p-8 space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 mx-auto">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold">On-Time Delivery</h3>
            <p className="text-slate-500">Real-time status updates via our tracking portal. No more guessing when your dress will be ready.</p>
          </div>
          <div className="p-8 space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 mx-auto">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold">Quality Guaranteed</h3>
            <p className="text-slate-500">From fabric selection to final stitching, we maintain top-tier standards for every stitch.</p>
          </div>
        </div>
      </section>

      {/* Order Tracking Portal */}
      <section id="tracking" className="py-24 sm:py-48 px-4 sm:px-8 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-16 sm:space-y-24 relative z-10">
          <div className="space-y-6 sm:space-y-8">
            <div className="w-20 h-20 bg-indigo-600/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/10 border border-indigo-500/20">
               <ShieldCheck size={40} />
            </div>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">Trace Your Masterpiece.</h2>
            <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
              Real-time oversight of your tailoring lifecycle. Enter your unique ID to synchronize with our workshop.
            </p>
          </div>
          
          <form onSubmit={checkStatus} className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-6 sm:left-10 flex items-center text-slate-600 group-focus-within:text-indigo-400 transition-colors">
              <Search size={28} />
            </div>
            <input 
              type="text" 
              placeholder="Unique Order Ref (e.g. ord_7f2x9z)"
              className="w-full bg-white/5 border-2 border-white/10 rounded-[3rem] pl-20 sm:pl-24 pr-8 py-7 sm:py-9 text-xl sm:text-2xl font-black placeholder:text-slate-700 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all shadow-2xl tracking-tight"
              value={orderQuery}
              onChange={e => setOrderQuery(e.target.value)}
            />
            <button 
              type="submit"
              disabled={searching}
              className="mt-6 sm:mt-0 sm:absolute sm:right-4 sm:top-4 sm:bottom-4 px-10 bg-indigo-600 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 w-full sm:w-auto"
            >
              {searching ? 'Synchronizing...' : 'Sync Status'}
            </button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-red-500/10 text-red-500 rounded-3xl font-black uppercase tracking-widest text-[10px] border border-red-500/20 max-w-md mx-auto"
            >
              {error}
            </motion.div>
          )}

          {orderStatus && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white text-slate-900 border border-white/10 rounded-[3rem] p-8 sm:p-12 text-left shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] space-y-10 sm:space-y-12 backdrop-blur-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:border-b border-slate-100 sm:pb-10">
                 <div>
                    <h3 className="text-3xl sm:text-5xl font-black tracking-tight">{orderStatus.clientName}</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Registry ID: {orderStatus.id}</p>
                 </div>
                 <div className={`self-start sm:self-center px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                   orderStatus.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' : 
                   orderStatus.status === 'pending' ? 'bg-slate-50 text-slate-500 border-slate-200' : 
                   'bg-indigo-50 text-indigo-600 border-indigo-100'
                 }`}>
                   {orderStatus.status}
                 </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Composition</p>
                    <p className="font-black text-slate-900 text-lg">{orderStatus.items.length} Units</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Date</p>
                    <p className="font-black text-slate-900 text-lg">{new Date(orderStatus.dueDate).toLocaleDateString()}</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valuation</p>
                    <p className="font-black text-slate-900 text-lg">Rs. {orderStatus.totalAmount.toLocaleString()}</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement</p>
                    <p className="font-black text-green-600 text-lg">Rs. {orderStatus.paidAmount.toLocaleString()}</p>
                 </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle Visualization</p>
                 <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
                    {[
                      { key: 'pending', label: 'Registered', color: 'bg-indigo-600 shadow-lg shadow-indigo-200' },
                      { key: 'cutting', label: 'Precision Cutting', color: orderStatus.taskStatus.cutting === 'completed' ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-100' },
                      { key: 'stitching', label: 'Structural Stitching', color: orderStatus.taskStatus.stitching === 'completed' ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-100' },
                      { key: 'finishing', label: 'Final Articulation', color: orderStatus.taskStatus.finishing === 'completed' ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-100' },
                      { key: 'finished', label: 'Ready for Fitting', color: orderStatus.status === 'finished' || orderStatus.status === 'delivered' ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-100' }
                    ].map((step, i) => (
                      <div key={i} className="flex-1 space-y-3">
                        <div className={`h-3 rounded-full ${step.color} transition-all duration-1000`}></div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{step.label}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}
        </div>
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-slate-900/50 to-transparent -z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[150px] -z-0" />
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Scissors size={18} />
              </div>
              <span className="text-xl font-black tracking-tight">STITCH<span className="text-indigo-600">MASTER</span></span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Leading the digital revolution in the tailoring industry. Precision, style, and care in every stitch.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Our History</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bulk Orders</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Measurement Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Fabric Sourcing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Contact Us</h4>
            <div className="space-y-4 text-sm text-slate-400 font-medium leading-relaxed">
              <p>Plot 42, Main Mall Road,<br />Lahore, Pakistan</p>
              <p>+92 300 1234567</p>
              <p>hello@stitchmaster.com</p>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6">Status App</h4>
            <p className="text-sm text-slate-400 mb-6 font-medium">Download our mobile app to track orders on the go.</p>
            <div className="flex gap-4">
               <div className="w-32 h-10 bg-white/10 rounded-lg border border-white/5"></div>
               <div className="w-32 h-10 bg-white/10 rounded-lg border border-white/5"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-20 mt-20 border-t border-white/5 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
          © 2024 StitchMaster ERP. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
