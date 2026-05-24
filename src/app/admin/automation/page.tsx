import Link from "next/link";

export default function AutomationPage() {
  return (
    <div className="p-6 max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#e9f0ef] mb-1">Social Insights</h1>
        <p className="text-[#708289] text-sm">
          Instagram and Facebook analytics coming soon.
        </p>
      </div>

      {/* Roadmap cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {[
          {
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth={1.5} />
              </svg>
            ),
            title: "Instagram Insights",
            items: ["Reach & impressions", "Follower growth", "Profile visits", "Post performance"],
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
            ),
            title: "Facebook Analytics",
            items: ["Page reach", "Post engagement", "Website clicks", "Audience demographics"],
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            title: "Performance Charts",
            items: ["Best-performing posts", "Engagement over time", "Reach by post type", "Top content by service"],
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
            title: "Growth Tracking",
            items: ["Follower trends", "Weekly growth rate", "Post frequency vs. reach", "Best days to post"],
          },
        ].map((card) => (
          <div key={card.title} className="bg-[#1a2028] border border-[#2d3840] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="text-[#94b2b6]">{card.icon}</div>
              <h3 className="text-[#e9f0ef] font-semibold text-sm">{card.title}</h3>
              <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#2d3840] text-[#434e56] uppercase tracking-widest">
                Soon
              </span>
            </div>
            <ul className="space-y-1.5">
              {card.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-[#708289]">
                  <span className="w-1 h-1 rounded-full bg-[#434e56] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* What you can do now */}
      <div className="bg-[#151b23] border border-[#2d3840] rounded-xl p-5">
        <p className="text-[10px] font-semibold text-[#434e56] uppercase tracking-widest mb-4">Available now</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/admin/social#trend-intelligence"
            className="flex items-center gap-3 bg-[#1a2028] border border-[#2d3840] rounded-lg px-4 py-3 hover:border-[#94b2b6]/30 transition-colors group">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-[#e9f0ef] group-hover:text-[#94b2b6] transition-colors">Trend Intelligence</p>
              <p className="text-[10px] text-[#434e56]">Research insights</p>
            </div>
          </Link>
          <Link href="/admin/social#drafts"
            className="flex items-center gap-3 bg-[#1a2028] border border-[#2d3840] rounded-lg px-4 py-3 hover:border-[#94b2b6]/30 transition-colors group">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-[#e9f0ef] group-hover:text-[#94b2b6] transition-colors">Draft Posts</p>
              <p className="text-[10px] text-[#434e56]">Caption drafts &amp; ideas</p>
            </div>
          </Link>
          <Link href="/admin/media"
            className="flex items-center gap-3 bg-[#1a2028] border border-[#2d3840] rounded-lg px-4 py-3 hover:border-[#94b2b6]/30 transition-colors group">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-[#e9f0ef] group-hover:text-[#94b2b6] transition-colors">Media Library</p>
              <p className="text-[10px] text-[#434e56]">Photos &amp; content assets</p>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}
