import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export function OfflineToggle() {
  const { isOfflineMode, toggleOfflineMode } = useLocalStorage();

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {isOfflineMode ? (
          <WifiOff className="h-4 w-4 text-orange-500" />
        ) : (
          <Wifi className="h-4 w-4 text-green-500" />
        )}
        <Label htmlFor="offline-mode" className="text-sm font-medium">
          {isOfflineMode ? "Modo Offline" : "Modo Online"}
        </Label>
      </div>
      
      <Switch
        id="offline-mode"
        checked={isOfflineMode}
        onCheckedChange={toggleOfflineMode}
      />
      
      <Badge variant={isOfflineMode ? "secondary" : "default"}>
        {isOfflineMode ? "Local" : "Nuvem"}
      </Badge>
    </div>
  );
}