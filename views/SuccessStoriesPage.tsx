
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SuccessStory {
    id: string;
    partner1_name: string;
    partner2_name: string;
    wedding_date: string | null;
    story_quote: string;
    image_url: string;
    is_featured: boolean;
}

const SuccessStoriesPage: React.FC = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);

  // Default featured stories provided by users
  const featuredStories: SuccessStory[] = [
    {
      id: 'featured-1',
      partner1_name: 'Priyanka Tripathi',
      partner2_name: 'Abhay Tripathi',
      wedding_date: '2026-02-10',
      story_quote: "We found each other on Bhartiya Rishtey and connected instantly. The verification process gave us trust.",
      image_url: 'https://image2url.com/r2/default/images/1771311548543-4a727854-3779-41e8-9b9d-f3d7d09c06e8.jpeg',
      is_featured: true
    },
    {
      id: 'featured-new-2',
      partner1_name: 'Praneet Dubey',
      partner2_name: 'Manju Dubey',
      wedding_date: '2025-12-02',
      story_quote: "Bhartiya Rishtey is truly a blessing. We found our soulmate within months of joining. The personalized approach is unmatched.",
      image_url: 'https://image2url.com/r2/default/images/1771316045360-702dc817-a88e-44cc-9abe-46456cd0ae0b.jpeg',
      is_featured: true
    },
    {
      id: 'featured-new',
      partner1_name: 'Akash Tiwari',
      partner2_name: 'Supriya Pandey',
      wedding_date: '2026-02-14',
      story_quote: "Bhartiya Rishtey made our meeting possible. It's the most reliable platform for finding a genuine life partner.",
      image_url: 'https://image2url.com/r2/default/images/1771315543513-db5721e6-ea58-4468-8aa3-2b6af326d36a.jpeg',
      is_featured: true
    },
    {
      id: 'featured-2',
      partner1_name: 'Rikhita Trivedi',
      partner2_name: 'Akhil Upadhya',
      wedding_date: '2024-01-15',
      story_quote: "A perfect match made in heaven, facilitated by this amazing platform. Highly recommended for serious seekers.",
      image_url: 'https://image2url.com/r2/default/images/1771311863671-facd1ba9-cb77-4536-b077-031a85bf351f.jpeg',
      is_featured: true
    },
    {
      id: 'featured-3',
      partner1_name: 'Sameer Joshi',
      partner2_name: 'Anushka sharma',
      wedding_date: '2023-09-10',
      story_quote: "Thanks to the detailed preferences, I found someone who shares my values and lifestyle perfectly.",
      image_url: 'https://image2url.com/r2/default/images/1771312113731-c0a7b409-e44d-495a-a1c4-6be84f2fa5cd.jpeg',
      is_featured: true
    }
  ];

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('success_stories')
          .select('*')
          .order('wedding_date', { ascending: false });

        if (error) {
          console.error("Error fetching success stories:", error);
          setStories(featuredStories);
        } else {
          // Combine fetched stories with our featured ones if not already present
          const dbStories = data || [];
          const combined = [...featuredStories];
          dbStories.forEach(ds => {
              if (!combined.find(c => c.partner1_name === ds.partner1_name && c.partner2_name === ds.partner2_name)) {
                  combined.push(ds);
              }
          });
          setStories(combined);
        }
      } catch (e) {
          setStories(featuredStories);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="bg-white py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-rose-50 text-brand px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-6">
          ✨ Matches Made in Heaven
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 tracking-tight">Journeys Started on <span className="text-brand">Bhartiya Rishtey</span></h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-16 leading-relaxed">
          Every connection is unique, every story beautiful. We are proud to have been a part of thousands of happy beginnings since 2016.
        </p>

        {loading ? (
            <div className="flex justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        ) : stories.length === 0 ? (
            <div className="text-center p-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                <div className="text-5xl mb-6">💞</div>
                <h3 className="text-xl font-bold text-gray-400">No success stories found yet.</h3>
                <p className="text-gray-500 mt-2 mb-8">Be the first to share your beautiful journey with the world!</p>
                <button onClick={() => alert("Please email your beautiful story and couple photos to helpbhartiyarishtey09@gmail.com to get featured on our platform!")} className="bg-brand text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-rose-700 transition">Share Your Story</button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {stories.map(story => (
                    <div key={story.id} className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 flex flex-col text-left overflow-hidden">
                        <div className="aspect-[4/5] relative overflow-hidden">
                            <img 
                              src={story.image_url} 
                              alt={`${story.partner1_name} & ${story.partner2_name}`} 
                              loading="lazy"
                              width="400"
                              height="500"
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                            {story.is_featured && (
                              <div className="absolute top-6 left-6 bg-brand text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Featured Story</div>
                            )}
                        </div>
                        <div className="p-8 flex flex-col flex-grow">
                            <h3 className="text-2xl font-black text-gray-900 mb-1 group-hover:text-brand transition">{story.partner1_name} & {story.partner2_name}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">
                                {story.wedding_date ? `Union: ${new Date(story.wedding_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Happily Together'}
                            </p>
                            <div className="relative">
                                <span className="absolute -top-4 -left-2 text-4xl text-brand/20 font-serif leading-none">“</span>
                                <p className="text-gray-600 italic leading-relaxed relative z-10">{story.story_quote}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="mt-24 p-12 bg-gray-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
           <div className="text-left max-w-lg">
              <h2 className="text-3xl font-black mb-4 tracking-tight">Found your partner through us?</h2>
              <p className="text-gray-400">Share your story and photos to inspire others in their search for a life partner. Selected stories receive a special anniversary gift from us!</p>
           </div>
           <button onClick={() => alert("Please email your beautiful story and couple photos to helpbhartiyarishtey09@gmail.com to get featured on our platform!")} className="w-full md:w-auto bg-brand text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition shadow-xl shadow-rose-900/50 whitespace-nowrap">
              Submit Your Story
           </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessStoriesPage;
