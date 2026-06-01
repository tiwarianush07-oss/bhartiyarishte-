import React, { useState } from 'react';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just show success. Can be connected to a backend/webhook later.
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-[200px]">📞</div>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-8">
            💬 Get In Touch
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6">Contact Us</h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Have questions or need assistance? We're here to help you on your journey to finding the perfect life partner.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="bg-white p-10 sm:p-14 rounded-[3rem] border shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Send Us a Message</h2>
            <p className="text-gray-500 text-sm mb-8">Fill out the form below and our team will get back to you within 24 hours.</p>

            {submitted && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-2xl text-sm font-bold">
                ✅ Thank you! Your message has been sent. We'll contact you shortly.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand text-sm font-medium transition"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand text-sm font-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand text-sm font-medium transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-brand text-sm font-medium transition resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-brand text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-rose-700 transition active:scale-95"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Other Ways to Reach Us</h2>
              <p className="text-gray-500 leading-relaxed">
                Whether you have a question about our services, pricing, or anything else, our team is ready to answer all your questions.
              </p>
            </div>

            <ContactInfoCard
              icon="📧"
              title="Email Us"
              primary="helpbhartiyarishtey09@gmail.com"
              secondary="bhartiyarishte03@gmail.com"
            />

            <ContactInfoCard
              icon="📍"
              title="Our Office"
              primary="Bhartiya Rishtey Matrimonial"
              secondary="India"
            />

            <ContactInfoCard
              icon="⏰"
              title="Working Hours"
              primary="Monday – Saturday"
              secondary="10:00 AM – 7:00 PM IST"
            />

            {/* Trust badges */}
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Trusted By</h3>
              <div className="flex flex-wrap gap-4">
                <span className="px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-600 border">🔒 SSL Secured</span>
                <span className="px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-600 border">✅ Verified Profiles</span>
                <span className="px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-600 border">🛡️ Privacy Protected</span>
                <span className="px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-600 border">🏆 Since 2016</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ContactInfoCard = ({ icon, title, primary, secondary }: { icon: string; title: string; primary: string; secondary: string }) => (
  <div className="bg-white p-8 rounded-3xl border shadow-sm hover:shadow-md transition flex items-start gap-5">
    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0">{icon}</div>
    <div>
      <h4 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-gray-700 font-medium">{primary}</p>
      <p className="text-gray-500 text-sm">{secondary}</p>
    </div>
  </div>
);

export default ContactPage;
