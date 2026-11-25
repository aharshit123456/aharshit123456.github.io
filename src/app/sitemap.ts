import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aharshit123456.space';
  
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
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
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/experience`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/research`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/research/computational-neuroscience`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/research/protein-engineering`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/research/drug-discovery`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/research/cybersecurity`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/research/foundation-models`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/papers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/datasets`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/models`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/now`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/case-studies`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/open-source`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/uses`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reading`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/speaking`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ai`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/systems`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/engineering`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
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

  // Dynamically add experience routes
  const experiencesDirectory = path.join(process.cwd(), 'public/experiences');
  let experienceRoutes: MetadataRoute.Sitemap = [];
  
  try {
    if (fs.existsSync(experiencesDirectory)) {
      const files = fs.readdirSync(experiencesDirectory);
      experienceRoutes = files
        .filter(file => file.endsWith('.md'))
        .map(file => {
          const slug = file.replace('.md', '');
          const stats = fs.statSync(path.join(experiencesDirectory, file));
          return {
            url: `${baseUrl}/experience/${slug}`,
            lastModified: stats.mtime,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          };
        });
    }
  } catch (error) {
    console.error("Error generating experience sitemap entries:", error);
  }

  return [...staticRoutes, ...blogRoutes, ...experienceRoutes];
}
