import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  User,
  Bell,
  Shield,
  Loader2,
  Volume2,
  Play,
  Check,
  Palette,
  CheckCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { themes, applyTheme } from "@/lib/themes";

// SMS Ringtone options - working notification sounds
const ringtoneOptions = [
  { id: "chime", name: "Chime", url: "https://cdn.freesound.org/previews/536/536420_4921277-lq.mp3", category: "Classic" },
  { id: "bell", name: "Bell", url: "https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3", category: "Classic" },
  { id: "ding", name: "Ding", url: "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3", category: "Classic" },
  { id: "pop", name: "Pop", url: "https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3", category: "Classic" },
  { id: "bubble", name: "Bubble", url: "https://cdn.freesound.org/previews/242/242501_4284968-lq.mp3", category: "Classic" },
  { id: "swoosh", name: "Swoosh", url: "https://cdn.freesound.org/previews/527/527847_3905081-lq.mp3", category: "Modern" },
  { id: "notification", name: "Notification", url: "https://cdn.freesound.org/previews/352/352661_5477037-lq.mp3", category: "Modern" },
  { id: "alert", name: "Alert", url: "https://cdn.freesound.org/previews/518/518305_11551375-lq.mp3", category: "Modern" },
  { id: "message", name: "Message", url: "https://cdn.freesound.org/previews/582/582489_6552523-lq.mp3", category: "Modern" },
  { id: "ping", name: "Ping", url: "https://cdn.freesound.org/previews/614/614258_6142149-lq.mp3", category: "Modern" },
  { id: "soft-chime", name: "Soft Chime", url: "https://cdn.freesound.org/previews/523/523651_10896060-lq.mp3", category: "Soft" },
  { id: "gentle", name: "Gentle", url: "https://cdn.freesound.org/previews/447/447912_9159316-lq.mp3", category: "Soft" },
  { id: "subtle", name: "Subtle", url: "https://cdn.freesound.org/previews/254/254819_4062622-lq.mp3", category: "Soft" },
  { id: "whisper", name: "Whisper", url: "https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3", category: "Soft" },
  { id: "bright", name: "Bright", url: "https://cdn.freesound.org/previews/221/221359_2226942-lq.mp3", category: "Bright" },
  { id: "cheerful", name: "Cheerful", url: "https://cdn.freesound.org/previews/335/335908_5865517-lq.mp3", category: "Bright" },
  { id: "positive", name: "Positive", url: "https://cdn.freesound.org/previews/320/320775_5260872-lq.mp3", category: "Bright" },
  { id: "success", name: "Success", url: "https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3", category: "Bright" },
];

const getSavedRingtone = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sms-ringtone') || 'chime';
  }
  return 'chime';
};

// Using themes from lib/themes.ts for complete theme customization

export default function TeamSettingsPage() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [desktopNotifications, setDesktopNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('desktop-notifications') !== 'false';
    }
    return true;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sound-enabled') !== 'false';
    }
    return true;
  });
  const [selectedRingtone, setSelectedRingtone] = useState(getSavedRingtone);
  const [selectedTheme, setSelectedTheme] = useState(user?.theme);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const hasThemeChanges = selectedTheme !== (user?.theme);
  
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingRingtone, setPlayingRingtone] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string }) => {
      const response = await apiRequest("PATCH", "/api/auth/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to change password", description: error.message, variant: "destructive" });
    },
  });

  const handleUpdateProfile = () => {
    if (!fullName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    if (!email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate({ fullName, email });
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      toast({ title: "Current password is required", variant: "destructive" });
      return;
    }
    if (!newPassword) {
      toast({ title: "New password is required", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleDesktopNotificationToggle = (enabled: boolean) => {
    setDesktopNotifications(enabled);
    localStorage.setItem('desktop-notifications', enabled ? 'true' : 'false');
    
    if (enabled && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission !== 'granted') {
          toast({ title: "Please enable notifications in your browser settings", variant: "destructive" });
          setDesktopNotifications(false);
          localStorage.setItem('desktop-notifications', 'false');
        }
      });
    }
    
    toast({ title: enabled ? "Desktop notifications enabled" : "Desktop notifications disabled" });
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('sound-enabled', enabled ? 'true' : 'false');
    toast({ title: enabled ? "Sound notifications enabled" : "Sound notifications disabled" });
  };

  const playRingtone = (ringtoneId: string) => {
    const ringtone = ringtoneOptions.find(r => r.id === ringtoneId);
    if (!ringtone) return;

    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }

    const audio = new Audio(ringtone.url);
    audio.volume = 0.6;
    setPreviewAudio(audio);
    setPlayingRingtone(ringtoneId);
    
    audio.play().catch(() => {
      toast({ title: "Failed to play sound", variant: "destructive" });
    });
    
    audio.onended = () => {
      setPlayingRingtone(null);
    };
  };

  const selectRingtone = (ringtoneId: string) => {
    setSelectedRingtone(ringtoneId);
    localStorage.setItem('sms-ringtone', ringtoneId);
    toast({ title: "Ringtone saved" });
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    // Preview the theme (does not save)
    applyTheme(themeId);
  };

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
    try {
      await apiRequest("PATCH", "/api/auth/theme", { theme: selectedTheme });
      refetch();
      const theme = themes.find(t => t.id === selectedTheme);
      toast({ title: `Theme saved: ${theme?.name || selectedTheme}` });
    } catch (error) {
      toast({ title: "Failed to save theme", variant: "destructive" });
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleCancelThemeChange = () => {
    const savedTheme = user?.theme || 'default';
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  };

  const groupedRingtones = ringtoneOptions.reduce((acc, ringtone) => {
    if (!acc[ringtone.category]) {
      acc[ringtone.category] = [];
    }
    acc[ringtone.category].push(ringtone);
    return acc;
  }, {} as Record<string, typeof ringtoneOptions>);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-settings">
          <TabsTrigger value="profile" className="gap-2" data-testid="tab-profile">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2" data-testid="tab-appearance">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {user?.fullName ? getInitials(user.fullName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Team Member</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    data-testid="input-fullname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={user?.username || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                </div>
              </div>

              <Button 
                onClick={handleUpdateProfile} 
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  data-testid="input-current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  data-testid="input-confirm-password"
                />
              </div>
              <Button 
                onClick={handleChangePassword} 
                disabled={changePasswordMutation.isPending}
                data-testid="button-change-password"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Keep your account safe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Account Status</p>
                  <p className="text-sm text-muted-foreground">Your account is active and secure</p>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Light / Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-0.5">
                  <Label>Color Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose a color theme for the application background
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all hover-elevate ${
                        selectedTheme === theme.id
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleThemeChange(theme.id)}
                      data-testid={`theme-${theme.id}`}
                    >
                      <div className={`w-full h-16 rounded-md bg-gradient-to-br ${theme.preview} shadow-inner`} />
                      <div className="text-center">
                        <p className="font-medium text-sm">{theme.name}</p>
                        <p className="text-xs text-muted-foreground">{theme.description}</p>
                      </div>
                      {selectedTheme === theme.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {hasThemeChanges && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleCancelThemeChange}
                      disabled={isSavingTheme}
                      data-testid="button-cancel-theme"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveTheme}
                      disabled={isSavingTheme}
                      data-testid="button-save-theme"
                    >
                      {isSavingTheme ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Save Theme
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive browser notifications for new messages
                  </p>
                </div>
                <Switch
                  checked={desktopNotifications}
                  onCheckedChange={handleDesktopNotificationToggle}
                  data-testid="switch-desktop-notifications"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Sound Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound when new messages arrive
                  </p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={handleSoundToggle}
                  data-testid="switch-sound-notifications"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                SMS Ringtone
              </CardTitle>
              <CardDescription>Choose your notification sound for incoming messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedRingtones).map(([category, ringtones]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                  <div className="grid gap-2">
                    {ringtones.map((ringtone) => (
                      <div
                        key={ringtone.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                          selectedRingtone === ringtone.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        onClick={() => selectRingtone(ringtone.id)}
                        onMouseEnter={() => playRingtone(ringtone.id)}
                        onMouseLeave={() => {
                          if (previewAudio) {
                            previewAudio.pause();
                            previewAudio.currentTime = 0;
                          }
                        }}
                        data-testid={`ringtone-${ringtone.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              playRingtone(ringtone.id);
                            }}
                          >
                            <Play className={`h-4 w-4 ${playingRingtone === ringtone.id ? "text-primary" : ""}`} />
                          </Button>
                          <span className="font-medium">{ringtone.name}</span>
                        </div>
                        {selectedRingtone === ringtone.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
