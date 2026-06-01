import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 text-[200px]">💍</div>
          <div className="absolute bottom-10 left-10 text-[150px]">🤝</div>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-8">
            🏛️ Since 2016
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6">About Bhartiya Rishtey</h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
            India's trusted matrimonial platform connecting families with values, tradition, and trust at the heart of every match.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-4">Our Mission</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-6">Building Lifelong Bonds Through Trust</h3>
            <p className="text-gray-500 text-lg leading-relaxed mb-6">
              At Bhartiya Rishtey, we believe that marriage is not just about two individuals — it's about two families coming together. We're committed to making this sacred journey safer, more transparent, and deeply respectful of Indian traditions.
            </p>
            <p className="text-gray-500 text-lg leading-relaxed">
              Since our founding in 2016, we have helped thousands of families find the perfect match through our verified profiles, dedicated mediators, and a commitment to privacy that sets us apart.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <StatBlock value="10,000+" label="Verified Profiles" icon="👥" />
            <StatBlock value="2,500+" label="Successful Matches" icon="💑" />
            <StatBlock value="8+" label="Years of Trust" icon="🏆" />
            <StatBlock value="98%" label="Satisfaction Rate" icon="⭐" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20 sm:py-28 border-y">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-4">Why Choose Us</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">What Makes Us Different</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <ValueCard
              icon="🔒"
              title="100% Verified Profiles"
              description="Every profile goes through a strict verification process. We prioritize your safety and trust above everything else."
            />
            <ValueCard
              icon="🤝"
              title="Dedicated Mediators"
              description="Our VIP members get a personal relationship mediator who handles family-to-family communication with utmost professionalism."
            />
            <ValueCard
              icon="🛡️"
              title="Privacy First"
              description="Your personal details are never shared without your explicit consent. We follow the highest standards of data privacy."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[3rem] p-12 sm:p-16 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-black mb-3 tracking-tight">Ready to Find Your Life Partner?</h3>
            <p className="text-gray-400 text-lg">Join thousands of families who trust Bhartiya Rishtey.</p>
          </div>
          <Link
            to="/signup"
            className="w-full md:w-auto bg-brand text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-rose-700 transition shadow-xl shadow-rose-900/40 text-center"
          >
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
};

const StatBlock = ({ value, label, icon }: { value: string; label: string; icon: string }) => (
  <div className="bg-white p-8 rounded-3xl border shadow-sm text-center hover:shadow-md transition">
    <div className="text-3xl mb-3">{icon}</div>
    <div className="text-2xl font-black text-gray-900 tracking-tight">{value}</div>
    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</div>
  </div>
);

const ValueCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <div className="bg-gray-50 p-10 rounded-[2.5rem] border hover:shadow-lg transition-shadow group">
    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner mb-6 group-hover:scale-110 transition-transform">{icon}</div>
    <h4 className="text-xl font-black text-gray-900 mb-3">{title}</h4>
    <p className="text-gray-500 leading-relaxed">{description}</p>
  </div>
);

export default AboutPage;
