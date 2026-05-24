import { MetadataRoute } from "next";

const BASE = "https://cmtdetailing.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:             `${BASE}/`,
      lastModified:    new Date(),
      changeFrequency: "weekly",
      priority:        1.0,
    },
    {
      url:             `${BASE}/services`,
      lastModified:    new Date(),
      changeFrequency: "weekly",
      priority:        0.9,
    },
    {
      url:             `${BASE}/book`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.9,
    },
    {
      url:             `${BASE}/about`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.6,
    },
    {
      url:             `${BASE}/services/interior-detail`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${BASE}/services/exterior-detail`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${BASE}/services/full-detail`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${BASE}/services/paint-enhancement`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/services/paint-correction`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/services/ceramic-coating`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
  ];
}
