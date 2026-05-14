'use client';

import { motion } from 'framer-motion';

const hobbies = [
  { id: 'guitar', icon: 'fas fa-guitar', title: 'Guitar', content: '<h3>Guitar</h3><p>Played in rock band performances. I love creating distorted riffs and melodic solos.</p><p><strong>Band Experience:</strong> Member of school band <em>"528hz"</em>.</p>' },
  { id: 'art', icon: 'fas fa-palette', title: 'Artwork', content: '<h3>Artwork & Design</h3><p>Traditional Sketching, Inking. Digital Art (Krita, Photoshop). Exploring the boundaries of visual storytelling.</p>' },
  { id: 'philosophy', icon: 'fas fa-book', title: 'Philosophy', content: '<h3>Philosophy</h3><p>Skeptic at heart. Interested in Epistemology, Metaphysics. Reading Plato, Nietzsche, Dostoevsky, Camus.</p>' },
  { id: 'vfx', icon: 'fas fa-video', title: 'VFX', content: '<h3>VFX & Film Making</h3><p>Video Editing (Premiere Pro), VFX (After Effects), 3D Modeling (Blender). I love directing the viewer\'s eye.</p>' },
  { id: 'cooking', icon: 'fas fa-utensils', title: 'Cooking', content: '<h3>Cooking</h3><p>From Hyderabadi Dum Biryani to Italian Pasta. Cooking is chemistry with soul.</p>' },
  { id: 'anime', icon: 'fas fa-tv', title: 'Anime', content: '<div style="width:100%; height:400px;"><iframe src="https://myanimelist.net/animelist/aharshit123456" style="width:100%; height:100%; border:none;"></iframe></div>' }
];

export const Hobbies = ({ onOpenTab }: any) => {
  return (
    <section className="hobbies-section" id="hobbies">
      <h3>//hobbies (interactive)</h3>
      <div className="hobbies-grid">
        {hobbies.map((hobby, idx) => (
          <motion.button 
            key={hobby.id}
            className="hobby-btn"
            onClick={() => onOpenTab(hobby.id, hobby.title, hobby.content)}
            whileHover={{ scale: 1.05, borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <i className={hobby.icon}></i> {hobby.title}
          </motion.button>
        ))}
      </div>
      <hr className="divider" />
    </section>
  );
};
