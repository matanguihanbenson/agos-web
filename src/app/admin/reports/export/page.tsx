"use client";

import React, { useEffect, useState } from "react";
import { Download, Calendar, FileText } from "lucide-react";
import { exportService } from "@/services/exportService";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ReportType =
  | "trash-distribution"
  | "volume-trends"
  | "water-quality"
  | "hotspot-mapping"
  | "bot-performance"
  | "deployment-summary";
type ExportFormat = "pdf" | "excel" | "csv";
type TimeframeType = "today" | "week" | "month" | "year" | "custom";

interface Deployment {
  id: string;
  river_id: string;
  river_name: string;
  trash_collection: {
    total_items: number;
    total_weight: number;
    trash_by_type?: Record<string, number>;
  };
  owner_admin_id: string;
  bot_id?: string;
  created_at?: any;
}

export default function ExportReportsPage() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reportType, setReportType] = React.useState<ReportType>("trash-distribution");
  const [format, setFormat] = React.useState<ExportFormat>("pdf");
  const [timeframe, setTimeframe] = React.useState<TimeframeType>("month");
  const [customDateRange, setCustomDateRange] = React.useState({ start: "", end: "" });
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [rivers, setRivers] = useState<{ id: string; name: string }[]>([]);
  const [bots, setBots] = useState<{ id: string; bot_id?: string }[]>([]);
  const [selectedRivers, setSelectedRivers] = useState<string[]>([]);
  const [selectedBots, setSelectedBots] = useState<string[]>([]);

  // Fetch admin's field operators to get allowed user IDs
  useEffect(() => {
    if (!user?.uid) {
      setAllowedUserIds([]);
      return;
    }

    const userIds = [user.uid];

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("created_by", "==", user.uid));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fieldOperatorIds = snapshot.docs.map((doc) => doc.id);
          setAllowedUserIds([...userIds, ...fieldOperatorIds]);
        },
        (error) => {
          console.error("Error fetching field operators:", error);
          setAllowedUserIds(userIds);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up field operators listener:", error);
      setAllowedUserIds(userIds);
    }
  }, [user?.uid]);

  // Fetch deployments
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setDeployments([]);
      return;
    }

    const deploymentsRef = collection(db, "deployments");
    const q = query(deploymentsRef, where("owner_admin_id", "in", allowedUserIds));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const deploymentsData: Deployment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          deploymentsData.push({
            id: doc.id,
            river_id: data.river_id,
            river_name: data.river_name,
            trash_collection: data.trash_collection || { total_items: 0, total_weight: 0 },
            owner_admin_id: data.owner_admin_id,
            bot_id: data.bot_id,
            created_at: data.created_at,
          });
        });

        setDeployments(deploymentsData);
      },
      (error) => {
        console.error("Error fetching deployments:", error);
      }
    );

    return () => unsubscribe();
  }, [allowedUserIds]);

  // Fetch rivers for filtering
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setRivers([]);
      return;
    }

    const riversRef = collection(db, "rivers");
    const q = query(riversRef, where("created_by", "in", allowedUserIds));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const riversData: { id: string; name: string }[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          riversData.push({
            id: doc.id,
            name: data.name || doc.id,
          });
        });
        setRivers(riversData);
      },
      (error) => {
        console.error("Error fetching rivers:", error);
      }
    );

    return () => unsubscribe();
  }, [allowedUserIds]);

  // Fetch bots for filtering
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setBots([]);
      return;
    }

    const botsRef = collection(db, "bots");
    const q = query(botsRef, where("owner_admin_id", "in", allowedUserIds));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const botsData: { id: string; bot_id?: string }[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          botsData.push({
            id: doc.id,
            bot_id: data.bot_id,
          });
        });
        setBots(botsData);
      },
      (error) => {
        console.error("Error fetching bots:", error);
      }
    );

    return () => unsubscribe();
  }, [allowedUserIds]);

  const filterDeploymentsByTimeframe = () => {
    let filtered = deployments;
    const now = new Date();

    if (timeframe !== "custom") {
      const startDate = new Date();

      switch (timeframe) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter((d) => {
            const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
            return createdAt >= startDate && createdAt <= now;
          });
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          filtered = filtered.filter((d) => {
            const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
            return createdAt >= startDate;
          });
          break;
        case "month":
          startDate.setDate(now.getDate() - 30);
          filtered = filtered.filter((d) => {
            const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
            return createdAt >= startDate;
          });
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter((d) => {
            const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
            return createdAt >= startDate;
          });
          break;
      }
    } else if (customDateRange.start && customDateRange.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((d) => {
        const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
        return createdAt >= start && createdAt <= end;
      });
    }

    // Apply river filter
    if (selectedRivers.length > 0) {
      filtered = filtered.filter((d) => selectedRivers.includes(d.river_id));
    }

    // Apply bot filter
    if (selectedBots.length > 0) {
      filtered = filtered.filter((d) => d.bot_id && selectedBots.includes(d.bot_id));
    }

    return filtered;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const timelineLabel = getTimeframeLabel();
      const reportTitle = getReportTitle();
      const filteredDeployments = filterDeploymentsByTimeframe();

      // Get unique areas for the report
      const areas = [...new Set(filteredDeployments.map((d) => d.river_name).filter(Boolean))];

      await exportService.exportReport(
        {
          reportType,
          title: reportTitle,
          subtitle: `Generated on ${formatDateLabel(new Date())} • ${filteredDeployments.length} deployments`,
          timeline: timelineLabel,
          selectedAreas: areas,
          comparisonMode: "overview",
          data: filteredDeployments,
        },
        { format }
      );
    } catch (e: any) {
      console.error("Export failed", e);
      setError("Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const getTimeframeLabel = () => {
    let start: Date | null = null;
    let end: Date | null = null;
    const now = new Date();

    if (timeframe !== "custom") {
      start = new Date();
      end = new Date();

      switch (timeframe) {
        case "today":
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          break;
        case "week":
          start.setDate(now.getDate() - 7);
          end = now;
          break;
        case "month":
          start.setDate(now.getDate() - 30);
          end = now;
          break;
        case "year":
          start.setFullYear(now.getFullYear() - 1);
          end = now;
          break;
      }
    } else if (customDateRange.start && customDateRange.end) {
      start = new Date(customDateRange.start);
      end = new Date(customDateRange.end);
      end.setHours(23, 59, 59, 999);
    }

    if (!start || !end) {
      return "All time";
    }

    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (sameDay) {
      return formatDateLabel(start);
    }

    return `${formatDateLabel(start)} to ${formatDateLabel(end)}`;
  };

  const getReportTitle = () => {
    const selectedReport = reportTypes.find((r) => r.value === reportType);
    return selectedReport?.label || "AGOS Report";
  };

  const reportTypes = [
    { value: "trash-distribution", label: "Trash Distribution" },
    { value: "volume-trends", label: "Volume Trends" },
    { value: "water-quality", label: "Water Quality" },
    { value: "hotspot-mapping", label: "Hotspot Mapping" },
    { value: "bot-performance", label: "Bot Performance" },
    { value: "deployment-summary", label: "Deployment Summary" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Export Reports
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Generate downloadable summaries of your AGOS deployments with customizable report types, timeframes, and formats. All exports use admin local time and include the AGOS system header.
        </p>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-md p-6 space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="flex items-center text-sm font-semibold text-slate-800 mb-3">
              <FileText className="h-4 w-4 mr-2 text-blue-600" />
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {reportTypes.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setReportType(rt.value)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    reportType === rt.value
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Selection */}
          <div>
            <label className="flex items-center text-sm font-semibold text-slate-800 mb-3">
              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
              Timeframe
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { id: "today", label: "This Day" },
                { id: "week", label: "This Week" },
                { id: "month", label: "This Month" },
                { id: "year", label: "This Year" },
                { id: "custom", label: "Custom Range" },
              ].map((period) => (
                <button
                  key={period.id}
                  onClick={() => setTimeframe(period.id as TimeframeType)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                    timeframe === period.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            {timeframe === "custom" && (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) =>
                    setCustomDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-slate-500">to</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) =>
                    setCustomDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <p className="text-xs text-slate-600 mt-2">
              Selected timeframe: <span className="font-medium text-slate-800">{getTimeframeLabel()}</span>
              {" • "}
              <span className="font-medium text-slate-800">
                {filterDeploymentsByTimeframe().length} deployment
                {filterDeploymentsByTimeframe().length !== 1 ? "s" : ""}
              </span>
            </p>
          </div>

          {/* River Filter */}
          <div>
            <label className="flex items-center text-sm font-semibold text-slate-800 mb-3">
              <FileText className="h-4 w-4 mr-2 text-blue-600" />
              Filter by River (optional)
            </label>
            {rivers.length === 0 ? (
              <p className="text-xs text-slate-500">No rivers available for your account.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rivers.map((river) => {
                  const isSelected = selectedRivers.includes(river.id);
                  return (
                    <button
                      key={river.id}
                      type="button"
                      onClick={() =>
                        setSelectedRivers((prev) =>
                          isSelected ? prev.filter((id) => id !== river.id) : [...prev, river.id]
                        )
                      }
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {river.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bot Filter */}
          <div>
            <label className="flex items-center text-sm font-semibold text-slate-800 mb-3">
              <FileText className="h-4 w-4 mr-2 text-blue-600" />
              Filter by Bot (optional)
            </label>
            {bots.length === 0 ? (
              <p className="text-xs text-slate-500">No bots available for your account.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bots.map((bot) => {
                  const displayId = bot.bot_id || bot.id;
                  const isSelected = selectedBots.includes(bot.id);
                  return (
                    <button
                      key={bot.id}
                      type="button"
                      onClick={() =>
                        setSelectedBots((prev) =>
                          isSelected ? prev.filter((id) => id !== bot.id) : [...prev, bot.id]
                        )
                      }
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {displayId}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export Format Selection */}
          <div>
            <label className="flex items-center text-sm font-semibold text-slate-800 mb-3">
              <Download className="h-4 w-4 mr-2 text-blue-600" />
              Export Format
            </label>
            <div className="flex gap-2">
              {[
                { value: "pdf", label: "PDF" },
                { value: "excel", label: "Excel" },
                { value: "csv", label: "CSV" },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value as ExportFormat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    format === fmt.value
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleExport}
              disabled={isExporting || (timeframe === "custom" && (!customDateRange.start || !customDateRange.end))}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : `Export ${format.toUpperCase()}`}
            </button>

            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50/60 border border-blue-200/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Export Information</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• All exports include the AGOS system header: "Autonomous Garbage-cleaning and Operation System"</li>
            <li>• Dates and timeframes use your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})</li>
            <li>• Report data is auto-generated based on your selected type and timeframe</li>
            <li>• PDF exports include charts, key metrics, and detailed insights</li>
            <li>• Excel exports contain multiple sheets with data, metadata, and summaries</li>
            <li>• CSV exports include metadata headers and raw data tables</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
