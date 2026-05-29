import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { createTeamMemberSchema, type CreateTeamMemberInput, type User, type PhoneNumber } from "@shared/schema";

type TeamMemberWithAssignments = User & {
  assignedNumbers?: { id: string; number: string; friendlyName: string | null }[];
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Plus,
  MoreVertical,
  Loader2,
  Shield,
  UserCheck,
  Phone,
  Check,
} from "lucide-react";
import { format } from "date-fns";

type PhoneNumberWithAssignment = PhoneNumber & { isAssigned: boolean };

export default function TeamManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const { data: teamMembers = [], isLoading } = useQuery<TeamMemberWithAssignments[]>({
    queryKey: ["/api/team"],
  });

  const { data: phoneAssignments = [], isLoading: assignmentsLoading } = useQuery<PhoneNumberWithAssignment[]>({
    queryKey: ["/api/team", selectedMember?.id, "assignments"],
    queryFn: async () => {
      if (!selectedMember) return [];
      const res = await fetch(`/api/team/${selectedMember.id}/assignments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
    enabled: !!selectedMember && assignmentsDialogOpen,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const form = useForm<CreateTeamMemberInput>({
    resolver: zodResolver(createTeamMemberSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTeamMemberInput) => {
      return apiRequest("POST", "/api/team", data);
    },
    onSuccess: () => {
      toast({
        title: "Team member added!",
        description: "The new team member can now log in.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create team member",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/team/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/team/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "The team member has been removed from your organization.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove member",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/team/${id}/reset-password`);
    },
    onSuccess: (_, memberId) => {
      const member = teamMembers.find(m => m.id === memberId);
      toast({
        title: "Password reset",
        description: `Password for ${member?.fullName || 'member'} has been reset to "password123". Please share this with them.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to reset password",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ memberId, phoneNumberId }: { memberId: string; phoneNumberId: string }) => {
      return apiRequest("POST", `/api/team/${memberId}/assignments`, { phoneNumberId });
    },
    onSuccess: () => {
      toast({
        title: "Number assigned",
        description: "Phone number has been assigned to the team member.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team", selectedMember?.id, "assignments"] });
      // Also refresh phone numbers for conversations dropdown
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers", { includeAssigned: true }] });
    },
    onError: (error) => {
      toast({
        title: "Failed to assign number",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ memberId, phoneNumberId }: { memberId: string; phoneNumberId: string }) => {
      return apiRequest("DELETE", `/api/team/${memberId}/assignments/${phoneNumberId}`);
    },
    onSuccess: () => {
      toast({
        title: "Number unassigned",
        description: "Phone number has been removed from the team member.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team", selectedMember?.id, "assignments"] });
      // Also refresh phone numbers for conversations dropdown
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers", { includeAssigned: true }] });
    },
    onError: (error) => {
      toast({
        title: "Failed to unassign number",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTeamMemberInput) => {
    createMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Add and manage team members who can access the messaging platform
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-member">
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Create a new team member account. They will be able to access the
                conversations page after logging in.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" data-testid="input-member-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          data-testid="input-member-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" data-testid="input-member-username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a password"
                          data-testid="input-member-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-create-member"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Member"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter((m) => m.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter((m) => m.role === "admin").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            All users with access to the messaging platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No team members yet</p>
              <p className="text-muted-foreground">
                Add your first team member to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id} data-testid={`member-${member.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.fullName}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{member.username}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                          {member.role === "admin" ? (
                            <>
                              <Shield className="mr-1 h-3 w-3" />
                              Admin
                            </>
                          ) : (
                            "Team Member"
                          )}
                        </Badge>
                        {member.assignedNumbers && member.assignedNumbers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.assignedNumbers.map((num) => (
                              <Badge 
                                key={num.id} 
                                variant="outline" 
                                className="text-xs font-normal"
                              >
                                <Phone className="mr-1 h-3 w-3" />
                                {num.number}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={member.isActive}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: member.id, isActive: checked })
                          }
                          disabled={member.role === "admin"}
                          data-testid={`switch-status-${member.id}`}
                        />
                        <span className="text-sm">
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={member.role === "admin"}
                            data-testid={`menu-member-${member.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedMember(member);
                              setAssignmentsDialogOpen(true);
                            }}
                            data-testid={`assignments-${member.id}`}
                          >
                            <Phone className="mr-2 h-4 w-4" />
                            Assignments
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm(`Reset password for ${member.fullName} to "password123"?`)) {
                                resetPasswordMutation.mutate(member.id);
                              }
                            }}
                            data-testid={`reset-password-${member.id}`}
                          >
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Remove ${member.fullName} from your team? This action cannot be undone.`)) {
                                deleteMutation.mutate(member.id);
                              }
                            }}
                            data-testid={`remove-member-${member.id}`}
                          >
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignmentsDialogOpen} onOpenChange={(open) => {
        setAssignmentsDialogOpen(open);
        if (!open) setSelectedMember(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Phone Number Assignments</DialogTitle>
            <DialogDescription>
              Assign phone numbers to {selectedMember?.fullName}. Each number can only be assigned to one team member.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {assignmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : phoneAssignments.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No phone numbers available. Buy numbers first from the Buy Numbers page.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {phoneAssignments.map((phone) => {
                  const isAssignedToOther = phone.assignedTo && !phone.isAssigned;
                  return (
                    <div
                      key={phone.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        phone.isAssigned ? "bg-primary/5 border-primary/20" : ""
                      } ${isAssignedToOther ? "opacity-50" : ""}`}
                      data-testid={`phone-assignment-${phone.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{phone.number}</p>
                          <p className="text-xs text-muted-foreground">
                            {phone.friendlyName || "No name"}
                          </p>
                        </div>
                      </div>
                      {phone.isAssigned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (selectedMember) {
                              unassignMutation.mutate({ memberId: selectedMember.id, phoneNumberId: phone.id });
                            }
                          }}
                          disabled={unassignMutation.isPending}
                          data-testid={`unassign-${phone.id}`}
                        >
                          {unassignMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Assigned
                            </>
                          )}
                        </Button>
                      ) : isAssignedToOther ? (
                        <Badge variant="secondary" className="text-xs">
                          Assigned to other
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (selectedMember) {
                              assignMutation.mutate({ memberId: selectedMember.id, phoneNumberId: phone.id });
                            }
                          }}
                          disabled={assignMutation.isPending}
                          data-testid={`assign-${phone.id}`}
                        >
                          {assignMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Assign"
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentsDialogOpen(false)} data-testid="button-close-assignments">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
