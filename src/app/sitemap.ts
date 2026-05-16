import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aharshit123456.space';
  
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/links`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Dynamically add blog routes
  const blogsDirectory = path.join(process.cwd(), 'public/blogs');
  let blogRoutes: MetadataRoute.Sitemap = [];
  
  try {
    if (fs.existsSync(blogsDirectory)) {
      const files = fs.readdirSync(blogsDirectory);
      blogRoutes = files
        .filter(file => file.endsWith('.md'))
        .map(file => {
          const slug = file.replace('.md', '');
          const stats = fs.statSync(path.join(blogsDirectory, file));
          return {
            url: `${baseUrl}/blog/${slug}`,
            lastModified: stats.mtime,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          };
        });
    }
  } catch (error) {
    console.error("Error generating blog sitemap entries:", error);
  }

  return [...staticRoutes, ...blogRoutes];
}
