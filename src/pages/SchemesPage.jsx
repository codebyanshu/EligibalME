import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ALL_SCHEMES, searchSchemes } from "@/data/schemes";
import { INDIAN_STATES_AND_UTS } from "@/data/taxonomy";
import { getCatalogFilters, getCatalogSchemes, hasSchemeApi } from "@/lib/schemeApi";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowUpRight, Building2, CalendarDays, ChevronLeft, ChevronRight, FileText, Search } from "lucide-react";

const PAGE_SIZE = 30;

function localMatches(query, level, state, category, department, status) {
  const searched = query ? searchSchemes(query) : ALL_SCHEMES;
  return searched.filter((scheme) => {
    if (level !== "all" && scheme.level !== level) return false;
    if (state && scheme.level !== "central" && !scheme.applicableStates?.includes(state)) return false;
    if (category && scheme.group !== category) return false;
    if (department && !scheme.dept?.toLowerCase().includes(department.toLowerCase())) return false;
    const schemeStatus = scheme.applicationStatus || "unknown";
    if (status && schemeStatus !== status) return false;
    return true;
  });
}

export default function SchemesPage() {
  const { lang } = useOutletContext();
  const copy = t(lang);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [remoteFilters, setRemoteFilters] = useState({ categories: [], departments: [], applicationStatuses: [] });
  const [remoteRows, setRemoteRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(!hasSchemeApi);

  useEffect(() => {
    if (!hasSchemeApi) return;
    let active = true;
    getCatalogFilters()
      .then((filters) => { if (active) setRemoteFilters(filters || {}); })
      .catch(() => { if (active) setApiUnavailable(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hasSchemeApi || apiUnavailable) return;
    let active = true;
    setLoading(true);
    getCatalogSchemes({ query, state, category, department, applicationStatus: status, offset: page * PAGE_SIZE, limit: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        setRemoteRows(data.schemes || []);
        setTotal(data.total || 0);
      })
      .catch(() => { if (active) setApiUnavailable(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [apiUnavailable, category, department, page, query, state, status]);

  const localRows = useMemo(() => localMatches(query, level, state, category, department, status), [query, level, state, category, department, status]);
  const rows = remoteRows && !apiUnavailable ? remoteRows : localRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const count = remoteRows && !apiUnavailable ? total : localRows.length;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(0);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {copy.backToChat}
      </Link>
      <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">{copy.schemesTitle}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.schemesSub}</p>
      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">{copy.catalogMetadataNotice}</p>
      {state && <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{copy.stateTextMatchNotice}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">{copy.searchPlaceholder}</span>
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder={copy.searchPlaceholder} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" />
        </label>
        <select aria-label={copy.filterState} value={state} onChange={updateFilter(setState)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
          <option value="">{copy.filterAnyState}</option>
          {INDIAN_STATES_AND_UTS.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select aria-label={copy.filterCategory} value={category} onChange={updateFilter(setCategory)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
          <option value="">{copy.filterAnyCategory}</option>
          {(remoteFilters.categories?.length ? remoteFilters.categories : [...new Set(ALL_SCHEMES.map((scheme) => scheme.group))]).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select aria-label={copy.filterDepartment} value={department} onChange={updateFilter(setDepartment)} disabled={!apiUnavailable && !remoteFilters.departments?.length} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm disabled:opacity-60">
          <option value="">{remoteFilters.departments?.length ? copy.filterAnyDepartment : copy.filterDepartmentUnavailable}</option>
          {(remoteFilters.departments || []).map((value) => <option key={value} value={value}>{value}</option>)}
          {apiUnavailable && [...new Set(ALL_SCHEMES.map((scheme) => scheme.dept).filter(Boolean))].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select aria-label={copy.filterStatus} value={status} onChange={updateFilter(setStatus)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
          <option value="">{copy.filterAnyStatus}</option>
          <option value="open" disabled={!apiUnavailable && !remoteFilters.applicationStatuses?.includes("open")}>{copy.statusOpen}</option>
          <option value="closed" disabled={!apiUnavailable && !remoteFilters.applicationStatuses?.includes("closed")}>{copy.statusClosed}</option>
          <option value="unknown">{copy.statusUnknown}</option>
        </select>
        <select aria-label={copy.filterAll} value={level} onChange={updateFilter(setLevel)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
          <option value="all">{copy.filterAll}</option>
          <option value="central">{copy.filterCentral}</option>
          <option value="state">{copy.filterState}</option>
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground" aria-live="polite">
        <span>{loading ? copy.loadingSchemes : copy.schemeRecordsCount.replace("{n}", String(count))}</span>
        {!apiUnavailable && <span>{copy.datasetCatalogLabel}</span>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((scheme) => {
          const isRemote = Boolean(scheme.title);
          const name = isRemote ? scheme.title : scheme.name[lang];
          const summary = isRemote ? scheme.summary : scheme.summary[lang];
          const benefit = isRemote ? scheme.benefits : scheme.benefit[lang];
          const link = isRemote ? scheme.officialSourceUrl : scheme.link;
          const categoryLabel = isRemote ? scheme.category : scheme.group;
          const metadata = isRemote ? scheme : null;
          const card = (
            <>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]", scheme.level === "central" ? "bg-secondary text-foreground/70" : "bg-saffron/15 text-saffron")}>
                    {scheme.level === "central" ? copy.centralTag : copy.stateTag}
                  </span>
                  {metadata && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{copy[`status${metadata.applicationStatus[0].toUpperCase()}${metadata.applicationStatus.slice(1)}`]}</span>}
                </div>
                <p className="mt-2 font-display text-base leading-snug">{name}</p>
                {categoryLabel && <p className="mt-1 text-[10px] text-muted-foreground">{categoryLabel}</p>}
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{summary}</p>
                {metadata?.department && <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground"><Building2 className="h-3 w-3" />{metadata.department}</p>}
                {metadata?.deadline && <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{copy.deadlineLabel}: {metadata.deadline}</p>}
                {metadata?.lastVerifiedAt && <p className="mt-1 text-[10px] text-muted-foreground">{copy.lastVerifiedLabel}: {metadata.lastVerifiedAt}</p>}
              </div>
              <p className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-2.5 text-[11px] text-leaf">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="line-clamp-2">{benefit}</span>
              </p>
            </>
          );
          const trackUrl = `/applications?scheme=${encodeURIComponent(scheme.id)}&name=${encodeURIComponent(name)}${link ? `&url=${encodeURIComponent(link)}` : ""}`;
          return <article key={scheme.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4">
            {link ? <a href={link} target="_blank" rel="noreferrer" className="group flex flex-col justify-between transition hover:-translate-y-0.5">{card}<ArrowUpRight className="sr-only" /></a> : card}
            <Link to={trackUrl} className="mt-3 border-t border-border/70 pt-2.5 text-xs font-medium text-leaf hover:underline">{copy.trackApplication}</Link>
          </article>;
        })}
      </div>

      {rows.length === 0 && <p className="mt-10 text-center text-sm text-muted-foreground">{copy.resultsEmpty}</p>}
      {count > PAGE_SIZE && <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" disabled={page === 0 || loading} onClick={() => setPage((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" />{copy.previousPage}</button>
        <span className="text-xs text-muted-foreground">{copy.pageLabel.replace("{page}", String(page + 1)).replace("{pages}", String(pageCount))}</span>
        <button type="button" disabled={page + 1 >= pageCount || loading} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40">{copy.nextPage}<ChevronRight className="h-3.5 w-3.5" /></button>
      </div>}
    </div>
  );
}
