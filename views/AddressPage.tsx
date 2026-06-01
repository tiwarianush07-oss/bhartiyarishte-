import React from 'react';

const OfficeCard = ({ title, addressLine1, addressLine2, state, mapUrl }: { title: string, addressLine1: string, addressLine2: string, state: string, mapUrl: string }) => (
  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col h-full">
    <h3 className="text-[12px] font-bold text-brand uppercase tracking-widest mb-4">{title}</h3>
    <p className="text-gray-700 font-medium mb-1">
      {addressLine1}
    </p>
    <p className="text-gray-700 font-medium mb-1">
      {addressLine2}
    </p>
    <p className="text-gray-500 text-sm mb-6 flex-grow">
      {state}
    </p>
    <div className="pt-6 border-t border-gray-100 mt-auto">
      <a 
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-900 hover:text-brand transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        View on Map
      </a>
    </div>
  </div>
);

const AddressPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Contact & Support Section */}
        <div className="bg-white rounded-3xl p-10 md:p-12 shadow-sm border border-gray-100 mb-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Contact & Office Address</h1>
            <p className="text-gray-500 mt-4 md:text-lg">We're here to help you find your perfect match.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            
            {/* Email Support */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-brand">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Email Support</h3>
              <div className="space-y-2">
                <a href="mailto:helpbhartiyarishtey09@gmail.com" className="block text-sm font-bold text-gray-900 hover:text-brand transition-colors">helpbhartiyarishtey09@gmail.com</a>
                <a href="mailto:bhartiyarishte03@gmail.com" className="block text-sm font-bold text-gray-900 hover:text-brand transition-colors">bhartiyarishte03@gmail.com</a>
              </div>
            </div>

            {/* Relationship Manager */}
            <div className="flex flex-col items-center text-center p-6 bg-brand text-white rounded-2xl shadow-md transform md:-translate-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-[10px] font-bold text-rose-200 uppercase tracking-widest mb-4">Relationship Manager</h3>
              <div className="text-xl font-black tracking-widest">
                Palak Tiwari
              </div>
            </div>

            {/* Phone Numbers */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-brand">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Phone Support</h3>
              <div className="space-y-2">
                <a href="tel:+919109330332" className="block text-lg font-black text-gray-900 hover:text-brand transition-colors">+91 9109330332</a>
                <a href="tel:+917898680332" className="block text-lg font-black text-gray-900 hover:text-brand transition-colors">+91 7898680332</a>
              </div>
            </div>

          </div>
        </div>

        {/* Office Locations */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Our Offices</h2>
            <p className="text-gray-500 mt-2">Visit us at any of our office locations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <OfficeCard 
              title="1. Raipur (Registration Office)"
              addressLine1="Near Spark, Behind Airtel Office,"
              addressLine2="Ward No. 19"
              state="Raipur, Chhattisgarh – 490042, India"
              mapUrl="https://maps.google.com/?q=Raipur,+Chhattisgarh+490042"
            />
            
            <OfficeCard 
              title="2. Bhilai (Sales Team)"
              addressLine1="Bharat Infotech, Front of Ghadi Chowk,"
              addressLine2="Supela, Bhilai, District Durg"
              state="Chhattisgarh – 490023, India"
              mapUrl="https://maps.google.com/?q=Supela,+Bhilai,+District+Durg,+Chhattisgarh+490023"
            />

            <OfficeCard 
              title="3. Pune (Tech Team)"
              addressLine1="2nd Floor, Office No. 213,"
              addressLine2="Mainland Hub, Kesnand Rd"
              state="Wagholi, Pune, Maharashtra – 412207, India"
              mapUrl="https://maps.google.com/?q=Kesnand+Rd,+Wagholi,+Pune,+Maharashtra+412207"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddressPage;
