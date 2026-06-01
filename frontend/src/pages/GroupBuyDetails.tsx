import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import api from "@/utils/api";
import { CardGroupBuy } from "@/components/GroupBuyCard";
import { CATEGORY_PALETTES } from "@/components/GroupBuyImage";
import { Badge, STAGE_BADGE_META } from "@/components/ui/badge";
import { TabBar } from "@/components/TabBar";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Loader2,
  Pencil,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/utils/ToastProvider";
import { useAuth } from "@/utils/AuthProvider";
import { GroupBuyEditModal } from "@/pages/admin/GroupBuyEditModal";
import type { ApiGroupBuy, AdminGroupBuy } from "@/types/groupBuy";
import { toCardData } from "@/utils/groupBuyTransforms";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Carousel ─────────────────────────────────────────────────────────────────

function Carousel({
  images,
  category,
}: {
  images: string[];
  category: string;
}) {
  const [active, setActive] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [bg, fg] = CATEGORY_PALETTES[category] ?? ["#1c1c2e", "#6366f1"];

  const prev = useCallback(
    () => setActive((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setActive((i) => (i + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    const el = thumbsRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [active]);

  if (images.length === 0) {
    return (
      <div
        className="w-full rounded border border-km-line overflow-hidden flex items-center justify-center"
        style={{
          aspectRatio: "4 / 3",
          background: `linear-gradient(135deg, ${bg} 0%, ${fg}44 100%)`,
        }}
      >
        <div
          className="w-[72px] h-[72px] rounded flex items-center justify-center font-km-mono text-xs tracking-[0.12em] uppercase"
          style={{
            border: "1.5px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          {category.slice(0, 3)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div
        className="rounded border border-km-line overflow-hidden relative"
        style={{ aspectRatio: "4 / 3" }}
      >
        {/* Blurred backdrop */}
        <img
          key={`bg-${active}`}
          src={images[active]}
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110 opacity-30"
          style={{ filter: "blur(12px)" }}
        />
        {/* Foreground */}
        <img
          key={active}
          src={images[active]}
          alt={`image ${active + 1}`}
          className="relative w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        {images.length > 1 && (
          <div
            className="absolute bottom-2.5 right-3 z-[1] px-2 py-[3px] rounded font-km-mono text-[10px] tracking-[0.08em]"
            style={{
              background: "rgba(0,0,0,0.55)",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {active + 1} / {images.length}
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-[1] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-white"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={next}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-[1] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-white"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-1.5 mt-2.5 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "flex-shrink-0 p-0 rounded overflow-hidden cursor-pointer border-2 bg-transparent transition-[border-color,opacity] duration-[120ms]",
                i === active
                  ? "border-km-gold opacity-100"
                  : "border-km-line opacity-[0.55]",
              )}
              style={{ width: 64, height: 48 }}
            >
              <img
                src={src}
                alt={`view ${i + 1}`}
                className="w-full h-full object-cover block"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.3";
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type DetailTab = "overview" | "vendors";

export default function GroupBuyDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showInfo } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.id === import.meta.env.VITE_ADMIN_USER_ID;
  const [gb, setGb] = useState<CardGroupBuy | null>(
    location.state as CardGroupBuy | null,
  );
  const [editGb, setEditGb] = useState<AdminGroupBuy | null>(null);
  const [loading, setLoading] = useState(!gb);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [selectedKitIdx, setSelectedKitIdx] = useState<number>(0);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (gb) return;
    api
      .get<ApiGroupBuy>(`/api/groupbuys/${id}`)
      .then((res) => setGb(toCardData(res.data)))
      .catch(() => setError("Failed to load group buy."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get<AdminGroupBuy>(`/api/groupbuys/admin/${id}`)
      .then((res) => setEditGb(res.data))
      .catch(() => {});
  }, [id, isAdmin]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showInfo("Link copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-km-bg">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-km-ink-mute" />
        </div>
      </div>
    );
  }

  if (error || !gb) {
    return (
      <div className="min-h-screen flex flex-col bg-km-bg">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="font-km-mono text-sm text-km-ink-mute">
            {error ?? "Not found."}
          </div>
          <Button
            variant="surface"
            size="sm"
            onClick={() => navigate("/group-buys")}
          >
            ← Back to group buys
          </Button>
        </div>
      </div>
    );
  }

  const meta = STAGE_BADGE_META[gb.stage];

  const selectedKit = gb.items[selectedKitIdx] ?? null;
  const displayPrice =
    selectedKit && selectedKit.price > 0 ? selectedKit.price : gb.price;

  const tabs: { key: DetailTab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    ...(gb.vendors.length > 0
      ? [
          {
            key: "vendors" as DetailTab,
            label: "Vendors",
            count: gb.vendors.length,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-km-bg text-km-ink">
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-8 py-6 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-xs font-km-mono text-km-ink-mute">
          <Link
            to="/group-buys"
            className="transition-colors hover:text-km-ink text-km-ink-mute"
          >
            ← Group buys
          </Link>
          <span>/</span>
          <span className="text-km-ink truncate max-w-[320px]">{gb.name}</span>
        </div>

        <div className="grid gap-10 grid-cols-1 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
          {/* ── LEFT — Carousel ── */}
          <div className="lg:sticky lg:top-[72px] lg:self-start">
            <Carousel images={gb.images} category={gb.category} />
          </div>

          {/* ── RIGHT — Info panel ── */}
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={meta.tone}>{meta.label}</Badge>
                <Badge variant="neutral">{gb.category}</Badge>
                {gb.closingSoon && (
                  <Badge variant="accent">⏱ {gb.closes} left</Badge>
                )}
              </div>
              <h1 className="text-3xl font-semibold leading-[1.1] text-km-ink tracking-[-0.02em]">
                {gb.name}
              </h1>
              <div className="font-km-mono text-xs text-km-ink-mute">
                by <span className="text-km-ink">{gb.designer}</span>
              </div>
            </div>

            {/* Price panel */}
            <div className="font-km-mono text-3xl sm:text-4xl lg:text-5xl font-semibold text-km-ink tracking-[-0.02em]">
              {displayPrice > 0 ? `$${displayPrice}` : "—"}
            </div>

            {/* Kit selector */}
            {gb.items.length > 0 && (
              <div>
                <div className="font-km-mono text-[10px] uppercase tracking-[0.15em] text-km-ink-mute mb-2">
                  Kits & options
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {gb.items.map((item, i) => {
                    const isSelected = selectedKitIdx === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedKitIdx(i)}
                        className={cn(
                          "text-left p-[10px_12px] rounded border cursor-pointer transition-colors duration-100 bg-transparent",
                          isSelected
                            ? "border-km-gold bg-km-gold-soft"
                            : "border-km-line hover:border-km-ink-mute",
                        )}
                      >
                        <div className="text-[12px] font-semibold text-km-ink leading-tight">
                          {item.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <hr className="border-km-line my-2" />

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {gb.discordUrl ? (
                <>
                  {gb.sourceUrl && (
                    <Button variant="gold" asChild className="w-full py-2.5">
                      <a
                        href={gb.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View original post <ExternalLink size={13} />
                      </a>
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      asChild
                      className="flex-1 py-2.5"
                      style={{ background: "#5865F2", color: "#fff" }}
                    >
                      <a
                        href={gb.discordUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg
                          width="14"
                          height="11"
                          viewBox="0 0 127.14 96.36"
                          fill="currentColor"
                          className="flex-shrink-0"
                        >
                          <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15zM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69z" />
                        </svg>
                        Join Discord
                      </a>
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="surface"
                        size="sm"
                        className="w-9 px-0 flex-shrink-0"
                        onClick={() => setEditOpen(true)}
                      >
                        <Pencil size={13} />
                      </Button>
                    )}
                    <Button
                      variant="surface"
                      size="sm"
                      className="w-9 px-0 flex-shrink-0"
                      onClick={handleShare}
                    >
                      <Share2 size={13} />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  {gb.sourceUrl && (
                    <Button variant="gold" asChild className="flex-1 py-2.5">
                      <a
                        href={gb.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View original post <ExternalLink size={13} />
                      </a>
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      variant="surface"
                      size="sm"
                      className="w-9 px-0 flex-shrink-0"
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil size={13} />
                    </Button>
                  )}
                  <Button
                    variant="surface"
                    size="sm"
                    className="w-9 px-0 flex-shrink-0"
                    onClick={handleShare}
                  >
                    <Share2 size={13} />
                  </Button>
                </div>
              )}
            </div>

            {/* Dates panel */}
            <div className="rounded border overflow-hidden border-km-line">
              <div className="font-km-mono text-[10px] uppercase tracking-[0.15em] text-km-ink-mute px-4 py-3">
                Timeline
              </div>
              <div
                className="grid border-t border-km-line"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                {(
                  [
                    { label: "GB start", value: formatDate(gb.gbStartIso) },
                    { label: "GB end", value: formatDate(gb.gbEndIso) },
                    { label: "Closes in", value: gb.closes },
                    { label: "Est. fulfillment", value: gb.eta },
                  ] as const
                ).map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={cn(
                      "p-[12px_16px] bg-km-surface",
                      i % 2 === 0 && "border-r border-km-line",
                      i >= 2 && "border-t border-km-line",
                    )}
                  >
                    <div className="font-km-mono text-[10px] tracking-[0.1em] uppercase text-km-ink-mute mb-0.5">
                      {label}
                    </div>
                    <div className="text-sm font-medium text-km-ink">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overview + vendors tabs */}
            <div className="rounded border overflow-hidden bg-km-surface border-km-line">
              <TabBar
                tabs={tabs}
                active={tab}
                onChange={(t) => setTab(t as DetailTab)}
              />
              <div className="p-4">
                {tab === "overview" && (
                  <div className="text-sm text-km-ink-dim whitespace-pre-line leading-[1.65]">
                    {gb.desc || "No description provided."}
                  </div>
                )}
                {tab === "vendors" && (
                  <div className="flex flex-col gap-2">
                    {gb.vendors.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-4 p-3 rounded border border-km-line bg-km-bg"
                      >
                        <div className="min-w-0">
                          <div className="font-km-mono text-[10px] text-km-ink-mute tracking-[0.1em] uppercase">
                            {v.region}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 min-w-0">
                            <span className="text-sm font-semibold text-km-ink whitespace-nowrap">
                              {v.name}
                            </span>
                            <span className="font-km-mono text-[11px] text-km-ink-mute truncate min-w-0">
                              {v.url}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="surface"
                          size="sm"
                          asChild
                          className="flex-shrink-0"
                        >
                          <a
                            href={
                              v.url
                                ? v.url.startsWith("http")
                                  ? v.url
                                  : `https://${v.url}`
                                : undefined
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visit ↗
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {editOpen && editGb && (
        <GroupBuyEditModal
          groupBuy={editGb}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setEditGb(updated);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
