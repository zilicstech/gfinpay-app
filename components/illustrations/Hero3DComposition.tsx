import React from "react";
import { Zap, ShieldCheck, Wallet, Smartphone, CreditCard, Monitor, User } from "lucide-react";

export function Hero3DComposition() {
  return (
    <div className="relative w-full h-[500px] lg:h-[600px] rounded-[2.5rem] overflow-hidden bg-slate-900 flex items-center justify-center perspective-[2000px]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIvPjwvZz48L3N2Zz4=')] opacity-50 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
      </div>

      {/* 3D Composition Group */}
      <div 
        className="relative z-10 w-[90%] max-w-4xl h-full flex items-center justify-center transform-gpu pf-float"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(15deg) rotateY(-15deg)',
        }}
      >
        {/* Main Laptop Screen Mockup */}
        <div 
          className="relative w-[500px] h-[320px] bg-slate-800 rounded-t-2xl rounded-b-md border-[8px] border-slate-700 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          style={{ transform: 'translateZ(0px)' }}
        >
          {/* Laptop Screen Header */}
          <div className="w-full bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-700/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-slate-400 text-[10px] font-mono tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Gfinpay Retailer Portal
            </div>
            <div className="w-10"></div>
          </div>

          {/* Laptop Screen Content */}
          <div className="flex-1 bg-slate-900 p-4 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-end mb-4 relative z-10">
              <div>
                <p className="text-slate-400 text-xs mb-1">Today's Earnings</p>
                <h3 className="text-white text-2xl font-bold font-mono">₹ 14,250<span className="text-emerald-400 text-sm ml-2">▲ 12%</span></h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 flex-1 relative z-10">
              {[
                { label: 'Recharge', icon: Smartphone, color: 'text-emerald-400' },
                { label: 'AEPS', icon: Wallet, color: 'text-blue-400' },
                { label: 'Cards', icon: CreditCard, color: 'text-purple-400' },
                { label: 'Bills', icon: Zap, color: 'text-amber-400' },
                { label: 'Loans', icon: Wallet, color: 'text-rose-400' },
                { label: 'Insurance', icon: ShieldCheck, color: 'text-indigo-400' },
                { label: 'DTH', icon: Monitor, color: 'text-teal-400' },
                { label: 'More', icon: User, color: 'text-slate-400' },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-800/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-700/50 hover:bg-slate-700 transition-colors">
                  <item.icon className={`w-5 h-5 mb-1.5 ${item.color}`} />
                  <span className="text-[9px] text-slate-300 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Laptop Keyboard Base */}
        <div 
          className="absolute top-[50%] left-[50%] w-[580px] h-[340px] bg-slate-700 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-slate-600 before:content-[''] before:absolute before:inset-x-8 before:top-4 before:bottom-8 before:bg-slate-800 before:rounded-xl"
          style={{ 
            transform: 'translate(-50%, 70px) rotateX(75deg) translateZ(-80px)',
            transformOrigin: 'top center'
          }}
        >
          {/* Trackpad */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-16 bg-slate-900/50 rounded-lg border border-slate-600/50" />
        </div>

        {/* Floating 3D Elements (Loud & Modern) */}
        
        {/* PoS Machine / Card Reader Floating */}
        <div 
          className="absolute -right-8 top-12 w-48 h-64 bg-slate-800/90 backdrop-blur-md rounded-2xl border-[4px] border-slate-700 shadow-2xl p-4 flex flex-col items-center justify-between"
          style={{ transform: 'translateZ(100px) rotateY(-25deg) rotateZ(5deg)' }}
        >
          <div className="w-full h-8 bg-slate-900 rounded-t-lg border-b border-slate-700" />
          <div className="w-full flex-1 bg-emerald-500/10 rounded-md my-2 flex items-center justify-center flex-col border border-emerald-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5" />
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-2 relative z-10" />
            <span className="text-emerald-400 font-bold text-sm relative z-10">Payment</span>
            <span className="text-emerald-400 font-bold text-lg relative z-10">Successful</span>
          </div>
          <div className="w-full grid grid-cols-3 gap-1.5 h-20">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-slate-700 rounded-sm border-t border-slate-600" />
            ))}
          </div>
        </div>

        {/* Mobile App View Floating */}
        <div 
          className="absolute -left-12 bottom-20 w-40 h-72 bg-slate-900 rounded-[2rem] border-[6px] border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden"
          style={{ transform: 'translateZ(150px) rotateY(20deg) rotateZ(-10deg) rotateX(10deg)' }}
        >
          <div className="w-16 h-4 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20" />
          <div className="p-4 pt-8 h-full flex flex-col bg-gradient-to-b from-indigo-900/40 to-slate-900 relative">
            <div className="w-full bg-slate-800/80 rounded-xl p-3 mb-3 border border-slate-700/50 backdrop-blur-sm z-10">
              <p className="text-slate-400 text-[10px]">UPI Transfer</p>
              <p className="text-white font-bold text-sm">₹ 2,500.00</p>
            </div>
            
            <div className="flex-1 flex items-center justify-center z-10">
              <div className="w-24 h-24 bg-white rounded-xl p-2 relative shadow-lg shadow-emerald-500/20">
                 <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                    <Zap className="w-8 h-8 text-emerald-500" />
                 </div>
                 {/* QR Corner marks */}
                 <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-slate-900" />
                 <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-slate-900" />
                 <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-slate-900" />
                 <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-slate-900" />
              </div>
            </div>
            
            <div className="w-full h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/30 z-10">
              Scan to Pay
            </div>
          </div>
        </div>

        {/* Abstract 3D Shapes */}
        <div 
          className="absolute -bottom-10 right-20 w-24 h-24 bg-emerald-500 rounded-full blur-[2px] opacity-80"
          style={{ transform: 'translateZ(-50px) rotateX(70deg)', boxShadow: '0 20px 40px rgba(16,185,129,0.5)' }}
        />
        
        <div 
          className="absolute top-10 left-20 w-16 h-16 bg-rose-500 rounded-xl blur-[1px] opacity-70"
          style={{ transform: 'translateZ(80px) rotateX(45deg) rotateY(45deg)', boxShadow: '0 20px 40px rgba(244,63,114,0.4)' }}
        />

        {/* Floating Badges */}
        <div 
          className="absolute top-4 -right-4 bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 border border-slate-200"
          style={{ transform: 'translateZ(120px)' }}
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          Live Services
        </div>

      </div>
    </div>
  );
}
