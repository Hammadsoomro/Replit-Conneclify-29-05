import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface InsightsData {
  messagesByDay: { day: string; sent: number; received: number }[];
  messagesByHour: { hour: string; count: number }[];
  deliveryStats: { status: string; count: number }[];
  totalSent: number;
  totalReceived: number;
  avgResponseTime: string;
  deliveryRate: number;
  weeklyTrend?: { week: string; messages: number }[];
  topContacts?: { name: string; messages: number }[];
  responseTimeDistribution?: { range: string; count: number }[];
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

function InsightCard({
  title,
  value,
  change,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {change >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{Math.abs(change)}% from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function InsightsPage() {
  const { data: insights, isLoading } = useQuery<InsightsData>({
    queryKey: ["/api/insights"],
  });

  const defaultData: InsightsData = {
    messagesByDay: [
      { day: "Mon", sent: 45, received: 32 },
      { day: "Tue", sent: 52, received: 41 },
      { day: "Wed", sent: 38, received: 29 },
      { day: "Thu", sent: 61, received: 48 },
      { day: "Fri", sent: 55, received: 37 },
      { day: "Sat", sent: 28, received: 19 },
      { day: "Sun", sent: 15, received: 12 },
    ],
    messagesByHour: [
      { hour: "6am", count: 12 },
      { hour: "9am", count: 45 },
      { hour: "12pm", count: 67 },
      { hour: "3pm", count: 52 },
      { hour: "6pm", count: 38 },
      { hour: "9pm", count: 21 },
    ],
    deliveryStats: [
      { status: "Delivered", count: 856 },
      { status: "Sent", count: 124 },
      { status: "Failed", count: 18 },
      { status: "Pending", count: 5 },
    ],
    totalSent: 294,
    totalReceived: 218,
    avgResponseTime: "2m 34s",
    deliveryRate: 98.2,
    weeklyTrend: [
      { week: "Week 1", messages: 145 },
      { week: "Week 2", messages: 189 },
      { week: "Week 3", messages: 234 },
      { week: "Week 4", messages: 312 },
    ],
    topContacts: [
      { name: "John Smith", messages: 45 },
      { name: "Sarah Johnson", messages: 38 },
      { name: "Mike Wilson", messages: 32 },
      { name: "Emily Davis", messages: 28 },
      { name: "Chris Brown", messages: 21 },
    ],
    responseTimeDistribution: [
      { range: "< 1 min", count: 156 },
      { range: "1-5 min", count: 234 },
      { range: "5-15 min", count: 189 },
      { range: "15-30 min", count: 78 },
      { range: "> 30 min", count: 45 },
    ],
  };

  const data = insights || defaultData;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6 overflow-auto">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messaging Insights</h1>
        <p className="text-muted-foreground">
          Analytics and performance metrics for your messaging platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <InsightCard
          title="Messages Sent"
          value={data.totalSent}
          change={8}
          icon={MessageSquare}
          description="This week"
        />
        <InsightCard
          title="Messages Received"
          value={data.totalReceived}
          change={12}
          icon={TrendingUp}
          description="This week"
        />
        <InsightCard
          title="Avg Response Time"
          value={data.avgResponseTime}
          change={-5}
          icon={Clock}
          description="Faster is better"
        />
        <InsightCard
          title="Delivery Rate"
          value={`${data.deliveryRate}%`}
          icon={CheckCircle}
          description="Successfully delivered"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          <TabsTrigger value="delivery" data-testid="tab-delivery">Delivery</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          <TabsTrigger value="response" data-testid="tab-response">Response Time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages by Day</CardTitle>
              <CardDescription>Weekly messaging volume breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.messagesByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="sent" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Sent" />
                    <Bar dataKey="received" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Received" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity by Hour</CardTitle>
              <CardDescription>Peak messaging hours throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.messagesByHour}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                      name="Messages"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
                <CardDescription>Message delivery breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.deliveryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="status"
                        label={({ status, percent }) =>
                          `${status} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {data.deliveryStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Summary</CardTitle>
                <CardDescription>Quick overview of message delivery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.deliveryStats.map((stat, index) => (
                  <div key={stat.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{stat.status}</span>
                    </div>
                    <span className="font-medium">{stat.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
                <CardDescription>Message volume over the past month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.weeklyTrend || defaultData.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="messages"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary)/0.2)"
                        strokeWidth={2}
                        name="Messages"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Contacts</CardTitle>
                <CardDescription>Most active conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topContacts || defaultData.topContacts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs fill-muted-foreground" />
                      <YAxis dataKey="name" type="category" className="text-xs fill-muted-foreground" width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="messages" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Messages" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="response" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>How quickly you respond to messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.responseTimeDistribution || defaultData.responseTimeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="range" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="Responses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Metrics</CardTitle>
                <CardDescription>Key response time statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Response Time</span>
                    <span className="font-bold text-lg">{data.avgResponseTime}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-chart-1 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Under 5 Minutes</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {Math.round((((data.responseTimeDistribution || defaultData.responseTimeDistribution || [])[0]?.count || 0) + ((data.responseTimeDistribution || defaultData.responseTimeDistribution || [])[1]?.count || 0)) / 
                        ((data.responseTimeDistribution || defaultData.responseTimeDistribution || []).reduce((a, b) => a + b.count, 0) || 1) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ 
                      width: `${Math.round((((data.responseTimeDistribution || defaultData.responseTimeDistribution || [])[0]?.count || 0) + ((data.responseTimeDistribution || defaultData.responseTimeDistribution || [])[1]?.count || 0)) / 
                        ((data.responseTimeDistribution || defaultData.responseTimeDistribution || []).reduce((a, b) => a + b.count, 0) || 1) * 100)}%` 
                    }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Over 30 Minutes</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {Math.round(((data.responseTimeDistribution || defaultData.responseTimeDistribution || [])[4]?.count || 0) / 
                        ((data.responseTimeDistribution || defaultData.responseTimeDistribution || []).reduce((a, b) => a + b.count, 0) || 1) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ 
                      width: `${Math.round(((data.responseTimeDistribution || defaultData.responseTimeDistribution || [])[4]?.count || 0) / 
                        ((data.responseTimeDistribution || defaultData.responseTimeDistribution || []).reduce((a, b) => a + b.count, 0) || 1) * 100)}%` 
                    }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
