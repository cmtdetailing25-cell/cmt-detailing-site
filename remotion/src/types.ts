export interface MediaItem {
  url: string;
  type: "image" | "video";
}

export interface CMTReelProps {
  campaignId: string;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  media: {
    before: MediaItem[];
    process: MediaItem[];
    after: MediaItem[];
    thumbnail?: MediaItem[];
  };
}
