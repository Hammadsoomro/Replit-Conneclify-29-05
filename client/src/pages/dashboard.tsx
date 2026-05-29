import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Phone,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Send,
} from "lucide-react";

interface DashboardStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  phoneNumbers: number;
  teamMembers: number;
  messagesTrend: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  contactName: string | null;
  phoneNumber: string;
  createdAt: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: number;
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
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {trend >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{Math.abs(trend)}% from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: activity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your messaging platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Conversations"
              value={stats?.totalConversations || 0}
              description="All time conversations"
              icon={MessageSquare}
              trend={12}
            />
            <StatCard
              title="Active Conversations"
              value={stats?.activeConversations || 0}
              description="Ongoing chats"
              icon={TrendingUp}
            />
            <StatCard
              title="Phone Numbers"
              value={stats?.phoneNumbers || 0}
              description="Active numbers"
              icon={Phone}
            />
            <StatCard
              title="Team Members"
              value={stats?.teamMembers || 0}
              description="Active users"
              icon={Users}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest messaging activity on your platform</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3" data-testid={`activity-${item.id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={item.type === 'received' ? 'bg-chart-2/10 text-chart-2' : 'bg-primary/10 text-primary'}>
                        {item.type === 'received' ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {item.contactName || item.phoneNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.type === 'received' ? 'Received: ' : 'Sent: '}
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start conversations to see activity here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/conversations"
              className="flex items-center gap-3 p-3 rounded-lg hover-elevate border border-transparent bg-muted/50"
              data-testid="quick-action-conversations"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">View Conversations</p>
                <p className="text-sm text-muted-foreground">Manage your message threads</p>
              </div>
            </a>
            <a
              href="/buy-numbers"
              className="flex items-center gap-3 p-3 rounded-lg hover-elevate border border-transparent bg-muted/50"
              data-testid="quick-action-buy-numbers"
            >
              <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="font-medium">Buy Phone Numbers</p>
                <p className="text-sm text-muted-foreground">Add new numbers to your account</p>
              </div>
            </a>
            <a
              href="/team"
              className="flex items-center gap-3 p-3 rounded-lg hover-elevate border border-transparent bg-muted/50"
              data-testid="quick-action-team"
            >
              <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="font-medium">Manage Team</p>
                <p className="text-sm text-muted-foreground">Add or manage team members</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
