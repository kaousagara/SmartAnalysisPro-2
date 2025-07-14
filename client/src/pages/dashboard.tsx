import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ThreatChart } from "@/components/dashboard/threat-chart";
import { RealtimeThreats } from "@/components/dashboard/realtime-threats";
import { DataIngestionStatus } from "@/components/dashboard/data-ingestion-status";
import { ActiveScenarios } from "@/components/dashboard/active-scenarios";
import { RecentActions } from "@/components/dashboard/recent-actions";
import { AlertsBanner } from "@/components/dashboard/alerts-banner";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Alerts Banner */}
      <AlertsBanner />

      {/* Stats Grid */}
      <StatsGrid />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Score Chart */}
        <div className="lg:col-span-2">
          <ThreatChart />
        </div>

        {/* Real-time Threats */}
        <RealtimeThreats />
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Ingestion Status */}
        <DataIngestionStatus />

        {/* Active Scenarios */}
        <ActiveScenarios />
      </div>

      {/* Recent Actions */}
      <RecentActions />
    </div>
  );
}
