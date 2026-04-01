import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, ArrowLeft, ShieldCheck, CreditCard,
  Wallet, Building2, CheckCircle2, ChevronRight,
  Info, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SaaSBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planName = searchParams.get("plan") || "Premium";

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["booking-plan", planName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .ilike("name", planName)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (planLoading) return <div className="flex items-center justify-center min-h-screen bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-600">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
             <div className="p-1.5 rounded-lg bg-indigo-600">
               <ShieldCheck className="h-5 w-5 text-white" />
             </div>
             <span className="font-black tracking-tighter text-xl uppercase">EDU<span className="text-indigo-600">FLOW</span></span>
          </Link>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">Secure Checkout</span>
             <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full font-bold">Cancel</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-12">
           {/* Booking Form & Options */}
           <div className="lg:col-span-2 space-y-8">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black tracking-tight">Complete Your Subscription</h1>
                 <p className="text-slate-500 font-medium">Secure your institution's digital infrastructure with the {plan?.name} plan.</p>
              </div>

              <Card className="rounded-[2.5rem] border-none shadow-strong overflow-hidden">
                 <CardHeader className="bg-slate-50 border-b p-8">
                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                       <Wallet className="h-6 w-6 text-indigo-600" />
                       Select Payment Vector
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-8">
                    <div className="grid sm:grid-cols-2 gap-4">
                       {[
                         { id: 'esewa', name: 'eSewa', desc: 'Instant Digital Transfer', color: 'bg-[#60bb46]' },
                         { id: 'khalti', name: 'Khalti', desc: 'Secure Mobile Wallet', color: 'bg-[#5c2d91]' },
                         { id: 'bank', name: 'Bank Transfer', desc: 'Direct Banking Network', color: 'bg-slate-900' },
                         { id: 'card', name: 'Credit/Debit Card', desc: 'International Gateway', color: 'bg-indigo-600' },
                       ].map((method) => (
                         <button
                           key={method.id}
                           className="flex flex-col items-start p-6 rounded-3xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group"
                         >
                            <div className={cn("h-10 w-10 rounded-xl mb-4 flex items-center justify-center text-white", method.color)}>
                               {method.id === 'bank' ? <Building2 className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                            </div>
                            <h3 className="font-black text-lg group-hover:text-indigo-600">{method.name}</h3>
                            <p className="text-xs text-slate-500 font-medium">{method.desc}</p>
                         </button>
                       ))}
                    </div>

                    <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex gap-4">
                       <Info className="h-6 w-6 text-amber-600 shrink-0" />
                       <div className="space-y-1">
                          <p className="font-bold text-amber-900 text-sm">Automated Activation</p>
                          <p className="text-xs text-amber-700 leading-relaxed font-medium">
                             Upon successful payment verification, your institutional dashboard and all {plan?.name} modules will be activated automatically within 5-10 minutes.
                          </p>
                       </div>
                    </div>

                    <Button className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-600/20">
                       PROCEED TO SECURE PAYMENT
                    </Button>
                 </CardContent>
              </Card>

              <div className="flex items-center justify-center gap-8 opacity-40 grayscale">
                 <img src="https://cdn.worldvectorlogo.com/logos/visa-10.svg" className="h-8" alt="Visa" />
                 <img src="https://cdn.worldvectorlogo.com/logos/mastercard-2.svg" className="h-8" alt="Mastercard" />
                 <img src="https://khalti.com/static/resources/img/khalti-logo.png" className="h-6" alt="Khalti" />
              </div>
           </div>

           {/* Plan Summary Card */}
           <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                 <Card className="rounded-[2.5rem] border-none shadow-strong overflow-hidden bg-white">
                    <CardHeader className="bg-indigo-600 text-white p-8">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Order Summary</p>
                       <CardTitle className="text-3xl font-black tracking-tight">{plan?.name} Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                       <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-500 font-medium">Standard License</span>
                             <span className="font-black text-slate-700">₹{plan?.original_price || plan?.price}</span>
                          </div>
                          {plan?.discount_amount && (
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-emerald-600 font-bold">Introductory Discount</span>
                               <span className="font-black text-emerald-600">- ₹{plan.discount_amount}</span>
                            </div>
                          )}
                          <div className="pt-4 border-t flex justify-between items-baseline">
                             <span className="font-black text-slate-900">TOTAL DUE</span>
                             <span className="text-3xl font-black text-indigo-600">₹{plan?.price}</span>
                          </div>
                       </div>

                       <div className="space-y-3 pt-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Included in {plan?.name}</p>
                          <ul className="space-y-2">
                             {['Full Administrative Suite', 'Teacher & Parent Portals', 'Advanced Reporting', '24/7 Priority Support'].map((f, i) => (
                               <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  {f}
                               </li>
                             ))}
                          </ul>
                       </div>
                    </CardContent>
                 </Card>

                 <div className="p-6 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center gap-3">
                    <AlertCircle className="h-6 w-6 text-slate-400" />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                       Need a custom package for a large university? <br/>
                       <Link to="/contact-sales" className="text-indigo-600 font-black underline underline-offset-4">Talk to Enterprise Sales</Link>
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
