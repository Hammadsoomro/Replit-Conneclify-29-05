// Complete theme definitions with CSS variables for light and dark modes
export interface ThemeVariables {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  fontFamily: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
  lightVariables: ThemeVariables;
  darkVariables: ThemeVariables;
}

export const themes: Theme[] = [
  {
    id: "default",
    name: "Default",
    description: "Original red/coral theme",
    preview: "from-red-500 to-orange-500",
    lightVariables: {
      background: "0 0% 94.12%",
      foreground: "0 0% 10.2%",
      card: "0 0% 98.82%",
      cardForeground: "0 0% 0%",
      popover: "45 25% 97%",
      popoverForeground: "0 0% 0%",
      primary: "342 85.11% 52.55%",
      primaryForeground: "0 0% 100%",
      secondary: "0 0% 76.86%",
      secondaryForeground: "0 0% 10.2%",
      muted: "0 0% 89.02%",
      mutedForeground: "222.86 9.33% 14.71%",
      accent: "0 0% 100%",
      accentForeground: "0 0% 10.2%",
      destructive: "0 0% 0%",
      destructiveForeground: "0 0% 100%",
      border: "0 0% 90.98%",
      input: "222.86 9.33% 14.71%",
      ring: "0 0% 0%",
      sidebar: "45 25% 97%",
      sidebarForeground: "20 14% 17%",
      sidebarPrimary: "9 75% 61%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "25 45% 80%",
      sidebarAccentForeground: "20 14% 17%",
      sidebarBorder: "45 15% 80%",
      fontFamily: "'Lora', serif",
    },
    darkVariables: {
      background: "20 14% 4%",
      foreground: "45 25% 91%",
      card: "20 14% 8%",
      cardForeground: "45 25% 85%",
      popover: "20 14% 4%",
      popoverForeground: "45 25% 91%",
      primary: "9 75% 61%",
      primaryForeground: "0 0% 100%",
      secondary: "30 15% 52%",
      secondaryForeground: "0 0% 100%",
      muted: "20 14% 15%",
      mutedForeground: "45 15% 46%",
      accent: "25 45% 20%",
      accentForeground: "45 25% 85%",
      destructive: "356.3 90.56% 54.31%",
      destructiveForeground: "0 0% 100%",
      border: "20 14% 15%",
      input: "20 14% 15%",
      ring: "9 75% 61%",
      sidebar: "20 14% 8%",
      sidebarForeground: "45 25% 85%",
      sidebarPrimary: "9 75% 61%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "25 45% 20%",
      sidebarAccentForeground: "45 25% 85%",
      sidebarBorder: "20 14% 15%",
      fontFamily: "'Lora', serif",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep blue tones",
    preview: "from-blue-500 to-cyan-600",
    lightVariables: {
      background: "200 50% 98%",
      foreground: "210 50% 10%",
      card: "200 40% 100%",
      cardForeground: "210 50% 10%",
      popover: "200 40% 100%",
      popoverForeground: "210 50% 10%",
      primary: "200 90% 45%",
      primaryForeground: "0 0% 100%",
      secondary: "200 30% 92%",
      secondaryForeground: "200 50% 20%",
      muted: "200 30% 94%",
      mutedForeground: "200 20% 45%",
      accent: "185 80% 45%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "200 30% 88%",
      input: "200 30% 88%",
      ring: "200 90% 45%",
      sidebar: "210 60% 20%",
      sidebarForeground: "200 20% 95%",
      sidebarPrimary: "185 80% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "210 50% 28%",
      sidebarAccentForeground: "200 20% 95%",
      sidebarBorder: "210 50% 25%",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    darkVariables: {
      background: "210 50% 8%",
      foreground: "200 20% 95%",
      card: "210 45% 12%",
      cardForeground: "200 20% 95%",
      popover: "210 45% 12%",
      popoverForeground: "200 20% 95%",
      primary: "200 90% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "210 40% 18%",
      secondaryForeground: "200 20% 90%",
      muted: "210 35% 15%",
      mutedForeground: "200 15% 55%",
      accent: "185 80% 50%",
      accentForeground: "0 0% 100%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 100%",
      border: "210 40% 20%",
      input: "210 40% 20%",
      ring: "200 90% 50%",
      sidebar: "210 55% 6%",
      sidebarForeground: "200 20% 90%",
      sidebarPrimary: "185 80% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "210 45% 14%",
      sidebarAccentForeground: "200 20% 90%",
      sidebarBorder: "210 45% 12%",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange vibes",
    preview: "from-orange-400 to-rose-500",
    lightVariables: {
      background: "30 50% 98%",
      foreground: "20 50% 10%",
      card: "30 40% 100%",
      cardForeground: "20 50% 10%",
      popover: "30 40% 100%",
      popoverForeground: "20 50% 10%",
      primary: "25 95% 53%",
      primaryForeground: "0 0% 100%",
      secondary: "30 30% 92%",
      secondaryForeground: "20 50% 20%",
      muted: "30 30% 94%",
      mutedForeground: "20 20% 45%",
      accent: "350 80% 60%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "30 30% 88%",
      input: "30 30% 88%",
      ring: "25 95% 53%",
      sidebar: "15 60% 25%",
      sidebarForeground: "30 20% 95%",
      sidebarPrimary: "25 95% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "15 50% 32%",
      sidebarAccentForeground: "30 20% 95%",
      sidebarBorder: "15 50% 28%",
      fontFamily: "'Poppins', sans-serif",
    },
    darkVariables: {
      background: "20 40% 8%",
      foreground: "30 20% 95%",
      card: "20 35% 12%",
      cardForeground: "30 20% 95%",
      popover: "20 35% 12%",
      popoverForeground: "30 20% 95%",
      primary: "25 95% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "20 30% 18%",
      secondaryForeground: "30 20% 90%",
      muted: "20 25% 15%",
      mutedForeground: "20 15% 55%",
      accent: "350 80% 55%",
      accentForeground: "0 0% 100%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 100%",
      border: "20 30% 20%",
      input: "20 30% 20%",
      ring: "25 95% 55%",
      sidebar: "15 55% 6%",
      sidebarForeground: "30 20% 90%",
      sidebarPrimary: "25 95% 58%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "15 45% 14%",
      sidebarAccentForeground: "30 20% 90%",
      sidebarBorder: "15 45% 12%",
      fontFamily: "'Poppins', sans-serif",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Natural green theme",
    preview: "from-green-500 to-emerald-600",
    lightVariables: {
      background: "140 30% 98%",
      foreground: "150 50% 10%",
      card: "140 30% 100%",
      cardForeground: "150 50% 10%",
      popover: "140 30% 100%",
      popoverForeground: "150 50% 10%",
      primary: "142 70% 40%",
      primaryForeground: "0 0% 100%",
      secondary: "140 25% 92%",
      secondaryForeground: "150 50% 20%",
      muted: "140 25% 94%",
      mutedForeground: "150 15% 45%",
      accent: "160 60% 45%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "140 25% 88%",
      input: "140 25% 88%",
      ring: "142 70% 40%",
      sidebar: "150 50% 18%",
      sidebarForeground: "140 20% 95%",
      sidebarPrimary: "160 60% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "150 40% 25%",
      sidebarAccentForeground: "140 20% 95%",
      sidebarBorder: "150 40% 22%",
      fontFamily: "'DM Sans', sans-serif",
    },
    darkVariables: {
      background: "150 40% 8%",
      foreground: "140 20% 95%",
      card: "150 35% 12%",
      cardForeground: "140 20% 95%",
      popover: "150 35% 12%",
      popoverForeground: "140 20% 95%",
      primary: "142 70% 45%",
      primaryForeground: "0 0% 100%",
      secondary: "150 30% 18%",
      secondaryForeground: "140 20% 90%",
      muted: "150 25% 15%",
      mutedForeground: "150 15% 55%",
      accent: "160 60% 50%",
      accentForeground: "0 0% 100%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 100%",
      border: "150 30% 20%",
      input: "150 30% 20%",
      ring: "142 70% 45%",
      sidebar: "150 45% 6%",
      sidebarForeground: "140 20% 90%",
      sidebarPrimary: "160 60% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "150 35% 14%",
      sidebarAccentForeground: "140 20% 90%",
      sidebarBorder: "150 35% 12%",
      fontFamily: "'DM Sans', sans-serif",
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Soft purple elegance",
    preview: "from-purple-400 to-violet-500",
    lightVariables: {
      background: "270 30% 98%",
      foreground: "270 50% 10%",
      card: "270 30% 100%",
      cardForeground: "270 50% 10%",
      popover: "270 30% 100%",
      popoverForeground: "270 50% 10%",
      primary: "270 70% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "270 25% 92%",
      secondaryForeground: "270 50% 20%",
      muted: "270 25% 94%",
      mutedForeground: "270 15% 45%",
      accent: "280 60% 60%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "270 25% 88%",
      input: "270 25% 88%",
      ring: "270 70% 55%",
      sidebar: "275 45% 22%",
      sidebarForeground: "270 20% 95%",
      sidebarPrimary: "280 60% 60%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "275 40% 30%",
      sidebarAccentForeground: "270 20% 95%",
      sidebarBorder: "275 40% 26%",
      fontFamily: "'Outfit', sans-serif",
    },
    darkVariables: {
      background: "275 40% 8%",
      foreground: "270 20% 95%",
      card: "275 35% 12%",
      cardForeground: "270 20% 95%",
      popover: "275 35% 12%",
      popoverForeground: "270 20% 95%",
      primary: "270 70% 60%",
      primaryForeground: "0 0% 100%",
      secondary: "275 30% 18%",
      secondaryForeground: "270 20% 90%",
      muted: "275 25% 15%",
      mutedForeground: "270 15% 55%",
      accent: "280 60% 55%",
      accentForeground: "0 0% 100%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 100%",
      border: "275 30% 20%",
      input: "275 30% 20%",
      ring: "270 70% 60%",
      sidebar: "275 40% 6%",
      sidebarForeground: "270 20% 90%",
      sidebarPrimary: "280 60% 60%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "275 35% 14%",
      sidebarAccentForeground: "270 20% 90%",
      sidebarBorder: "275 35% 12%",
      fontFamily: "'Outfit', sans-serif",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark elegant theme",
    preview: "from-slate-700 to-indigo-900",
    lightVariables: {
      background: "230 30% 97%",
      foreground: "230 40% 15%",
      card: "230 25% 100%",
      cardForeground: "230 40% 15%",
      popover: "230 25% 100%",
      popoverForeground: "230 40% 15%",
      primary: "230 80% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "230 20% 92%",
      secondaryForeground: "230 40% 20%",
      muted: "230 20% 94%",
      mutedForeground: "230 15% 45%",
      accent: "250 70% 55%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "230 20% 88%",
      input: "230 20% 88%",
      ring: "230 80% 55%",
      sidebar: "235 40% 20%",
      sidebarForeground: "230 20% 95%",
      sidebarPrimary: "250 70% 60%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "235 35% 28%",
      sidebarAccentForeground: "230 20% 95%",
      sidebarBorder: "235 35% 25%",
      fontFamily: "'Space Grotesk', sans-serif",
    },
    darkVariables: {
      background: "230 25% 12%",
      foreground: "220 15% 90%",
      card: "230 25% 15%",
      cardForeground: "220 15% 90%",
      popover: "230 25% 15%",
      popoverForeground: "220 15% 90%",
      primary: "230 80% 65%",
      primaryForeground: "0 0% 100%",
      secondary: "230 20% 22%",
      secondaryForeground: "220 15% 85%",
      muted: "230 20% 20%",
      mutedForeground: "220 10% 55%",
      accent: "250 70% 60%",
      accentForeground: "0 0% 100%",
      destructive: "0 70% 55%",
      destructiveForeground: "0 0% 100%",
      border: "230 20% 22%",
      input: "230 20% 22%",
      ring: "230 80% 65%",
      sidebar: "235 30% 8%",
      sidebarForeground: "220 15% 85%",
      sidebarPrimary: "250 70% 60%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "235 25% 15%",
      sidebarAccentForeground: "220 15% 85%",
      sidebarBorder: "235 25% 12%",
      fontFamily: "'Space Grotesk', sans-serif",
    },
  },
  {
    id: "cherry",
    name: "Cherry",
    description: "Pink & rose tones",
    preview: "from-pink-400 to-rose-500",
    lightVariables: {
      background: "340 30% 98%",
      foreground: "340 50% 10%",
      card: "340 30% 100%",
      cardForeground: "340 50% 10%",
      popover: "340 30% 100%",
      popoverForeground: "340 50% 10%",
      primary: "340 80% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "340 25% 92%",
      secondaryForeground: "340 50% 20%",
      muted: "340 25% 94%",
      mutedForeground: "340 15% 45%",
      accent: "350 70% 60%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "340 25% 88%",
      input: "340 25% 88%",
      ring: "340 80% 55%",
      sidebar: "345 45% 22%",
      sidebarForeground: "340 20% 95%",
      sidebarPrimary: "350 70% 60%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "345 40% 30%",
      sidebarAccentForeground: "340 20% 95%",
      sidebarBorder: "345 40% 26%",
      fontFamily: "'Montserrat', sans-serif",
    },
    darkVariables: {
      background: "345 35% 8%",
      foreground: "340 20% 95%",
      card: "345 30% 12%",
      cardForeground: "340 20% 95%",
      popover: "345 30% 12%",
      popoverForeground: "340 20% 95%",
      primary: "340 80% 60%",
      primaryForeground: "0 0% 100%",
      secondary: "345 25% 18%",
      secondaryForeground: "340 20% 90%",
      muted: "345 20% 15%",
      mutedForeground: "340 15% 55%",
      accent: "350 70% 55%",
      accentForeground: "0 0% 100%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 100%",
      border: "345 25% 20%",
      input: "345 25% 20%",
      ring: "340 80% 60%",
      sidebar: "345 40% 6%",
      sidebarForeground: "340 20% 90%",
      sidebarPrimary: "350 70% 60%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "345 30% 14%",
      sidebarAccentForeground: "340 20% 90%",
      sidebarBorder: "345 30% 12%",
      fontFamily: "'Montserrat', sans-serif",
    },
  },
  {
    id: "gold",
    name: "Gold",
    description: "Warm amber glow",
    preview: "from-amber-400 to-yellow-500",
    lightVariables: {
      background: "45 40% 97%",
      foreground: "40 50% 10%",
      card: "45 35% 100%",
      cardForeground: "40 50% 10%",
      popover: "45 35% 100%",
      popoverForeground: "40 50% 10%",
      primary: "40 95% 48%",
      primaryForeground: "40 50% 10%",
      secondary: "45 30% 92%",
      secondaryForeground: "40 50% 20%",
      muted: "45 30% 94%",
      mutedForeground: "40 15% 45%",
      accent: "35 90% 50%",
      accentForeground: "40 50% 10%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "45 30% 88%",
      input: "45 30% 88%",
      ring: "40 95% 48%",
      sidebar: "35 50% 22%",
      sidebarForeground: "45 20% 95%",
      sidebarPrimary: "40 95% 50%",
      sidebarPrimaryForeground: "40 50% 10%",
      sidebarAccent: "35 45% 30%",
      sidebarAccentForeground: "45 20% 95%",
      sidebarBorder: "35 45% 26%",
      fontFamily: "'Libre Baskerville', serif",
    },
    darkVariables: {
      background: "35 35% 8%",
      foreground: "45 20% 95%",
      card: "35 30% 12%",
      cardForeground: "45 20% 95%",
      popover: "35 30% 12%",
      popoverForeground: "45 20% 95%",
      primary: "40 95% 52%",
      primaryForeground: "40 50% 10%",
      secondary: "35 25% 18%",
      secondaryForeground: "45 20% 90%",
      muted: "35 20% 15%",
      mutedForeground: "40 15% 55%",
      accent: "35 90% 55%",
      accentForeground: "40 50% 10%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 100%",
      border: "35 25% 20%",
      input: "35 25% 20%",
      ring: "40 95% 52%",
      sidebar: "35 45% 6%",
      sidebarForeground: "45 20% 90%",
      sidebarPrimary: "40 95% 55%",
      sidebarPrimaryForeground: "40 50% 10%",
      sidebarAccent: "35 30% 14%",
      sidebarAccentForeground: "45 20% 90%",
      sidebarBorder: "35 30% 12%",
      fontFamily: "'Libre Baskerville', serif",
    },
  },
  {
    id: "arctic",
    name: "Arctic",
    description: "Cool icy blue",
    preview: "from-sky-400 to-blue-500",
    lightVariables: {
      background: "200 60% 98%",
      foreground: "200 50% 10%",
      card: "200 50% 100%",
      cardForeground: "200 50% 10%",
      popover: "200 50% 100%",
      popoverForeground: "200 50% 10%",
      primary: "195 90% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "200 40% 92%",
      secondaryForeground: "200 50% 20%",
      muted: "200 40% 94%",
      mutedForeground: "200 20% 45%",
      accent: "210 80% 55%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "200 40% 88%",
      input: "200 40% 88%",
      ring: "195 90% 50%",
      sidebar: "205 60% 92%",
      sidebarForeground: "200 50% 15%",
      sidebarPrimary: "195 90% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "205 50% 85%",
      sidebarAccentForeground: "200 50% 15%",
      sidebarBorder: "205 45% 82%",
      fontFamily: "'Geist', sans-serif",
    },
    darkVariables: {
      background: "205 45% 8%",
      foreground: "200 20% 95%",
      card: "205 40% 12%",
      cardForeground: "200 20% 95%",
      popover: "205 40% 12%",
      popoverForeground: "200 20% 95%",
      primary: "195 90% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "205 35% 18%",
      secondaryForeground: "200 20% 90%",
      muted: "205 30% 15%",
      mutedForeground: "200 15% 55%",
      accent: "210 80% 55%",
      accentForeground: "0 0% 100%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 100%",
      border: "205 35% 20%",
      input: "205 35% 20%",
      ring: "195 90% 55%",
      sidebar: "205 50% 6%",
      sidebarForeground: "200 20% 90%",
      sidebarPrimary: "195 90% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "205 40% 14%",
      sidebarAccentForeground: "200 20% 90%",
      sidebarBorder: "205 40% 12%",
      fontFamily: "'Geist', sans-serif",
    },
  },
  {
    id: "charcoal",
    name: "Charcoal",
    description: "Dark gray elegance",
    preview: "from-zinc-500 to-neutral-700",
    lightVariables: {
      background: "0 0% 96%",
      foreground: "0 0% 10%",
      card: "0 0% 100%",
      cardForeground: "0 0% 10%",
      popover: "0 0% 100%",
      popoverForeground: "0 0% 10%",
      primary: "0 0% 25%",
      primaryForeground: "0 0% 100%",
      secondary: "0 0% 92%",
      secondaryForeground: "0 0% 20%",
      muted: "0 0% 94%",
      mutedForeground: "0 0% 45%",
      accent: "0 0% 35%",
      accentForeground: "0 0% 100%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "0 0% 88%",
      input: "0 0% 88%",
      ring: "0 0% 25%",
      sidebar: "0 0% 12%",
      sidebarForeground: "0 0% 90%",
      sidebarPrimary: "0 0% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "0 0% 20%",
      sidebarAccentForeground: "0 0% 90%",
      sidebarBorder: "0 0% 18%",
      fontFamily: "'Roboto', sans-serif",
    },
    darkVariables: {
      background: "0 0% 8%",
      foreground: "0 0% 95%",
      card: "0 0% 12%",
      cardForeground: "0 0% 95%",
      popover: "0 0% 12%",
      popoverForeground: "0 0% 95%",
      primary: "0 0% 70%",
      primaryForeground: "0 0% 10%",
      secondary: "0 0% 18%",
      secondaryForeground: "0 0% 90%",
      muted: "0 0% 15%",
      mutedForeground: "0 0% 55%",
      accent: "0 0% 40%",
      accentForeground: "0 0% 100%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 100%",
      border: "0 0% 20%",
      input: "0 0% 20%",
      ring: "0 0% 70%",
      sidebar: "0 0% 5%",
      sidebarForeground: "0 0% 90%",
      sidebarPrimary: "0 0% 60%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "0 0% 14%",
      sidebarAccentForeground: "0 0% 90%",
      sidebarBorder: "0 0% 12%",
      fontFamily: "'Roboto', sans-serif",
    },
  },
];

// Get current mode (light or dark)
const getCurrentMode = (): 'light' | 'dark' => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

// Apply theme variables to document
const applyThemeVariables = (vars: ThemeVariables): void => {
  const root = document.documentElement;
  
  root.style.setProperty('--background', vars.background);
  root.style.setProperty('--foreground', vars.foreground);
  root.style.setProperty('--card', vars.card);
  root.style.setProperty('--card-foreground', vars.cardForeground);
  root.style.setProperty('--popover', vars.popover);
  root.style.setProperty('--popover-foreground', vars.popoverForeground);
  root.style.setProperty('--primary', vars.primary);
  root.style.setProperty('--primary-foreground', vars.primaryForeground);
  root.style.setProperty('--secondary', vars.secondary);
  root.style.setProperty('--secondary-foreground', vars.secondaryForeground);
  root.style.setProperty('--muted', vars.muted);
  root.style.setProperty('--muted-foreground', vars.mutedForeground);
  root.style.setProperty('--accent', vars.accent);
  root.style.setProperty('--accent-foreground', vars.accentForeground);
  root.style.setProperty('--destructive', vars.destructive);
  root.style.setProperty('--destructive-foreground', vars.destructiveForeground);
  root.style.setProperty('--border', vars.border);
  root.style.setProperty('--input', vars.input);
  root.style.setProperty('--ring', vars.ring);
  root.style.setProperty('--sidebar', vars.sidebar);
  root.style.setProperty('--sidebar-foreground', vars.sidebarForeground);
  root.style.setProperty('--sidebar-primary', vars.sidebarPrimary);
  root.style.setProperty('--sidebar-primary-foreground', vars.sidebarPrimaryForeground);
  root.style.setProperty('--sidebar-accent', vars.sidebarAccent);
  root.style.setProperty('--sidebar-accent-foreground', vars.sidebarAccentForeground);
  root.style.setProperty('--sidebar-border', vars.sidebarBorder);
  
  // Apply font
  root.style.setProperty('--font-sans', vars.fontFamily);
  document.body.style.fontFamily = vars.fontFamily;
};

// Apply theme to document (does NOT save - just for preview)
export const applyTheme = (themeId: string): void => {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) {
    resetToDefaultTheme();
    return;
  }

  const mode = getCurrentMode();
  const vars = mode === 'dark' ? theme.darkVariables : theme.lightVariables;
  applyThemeVariables(vars);
};

// Reset to default theme (remove all custom CSS variables)
export const resetToDefaultTheme = (): void => {
  const root = document.documentElement;
  
  // Remove all custom CSS properties
  const customProps = [
    '--background', '--foreground', '--card', '--card-foreground',
    '--popover', '--popover-foreground', '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
    '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
    '--border', '--input', '--ring', '--sidebar', '--sidebar-foreground',
    '--sidebar-primary', '--sidebar-primary-foreground', '--sidebar-accent',
    '--sidebar-accent-foreground', '--sidebar-border', '--font-sans'
  ];
  
  customProps.forEach(prop => root.style.removeProperty(prop));
  document.body.style.fontFamily = '';
};

// Initialize theme from user's saved preference
export const initializeTheme = (themeId: string | null | undefined): void => {
  if (themeId) {
    applyTheme(themeId);
  } else {
    applyTheme('default');
  }
};

// Re-apply current theme when light/dark mode changes
export const onModeChange = (themeId: string | null | undefined): void => {
  if (themeId) {
    applyTheme(themeId);
  } else {
    applyTheme('default');
  }
};
