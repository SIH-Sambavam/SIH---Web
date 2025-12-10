import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { alerts } from "@/lib/data";
import { cn } from "@/lib/utils";
import { AlertTriangle, Fish, Mic, Shield } from "lucide-react";

type Alert = {
  id: number;
  type: string;
  content: string;
  time: string;
  severity: string;
};

function AlertCard({ alert }: { alert: Alert }) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 border-l-4 rounded-r-md",
        alert.severity === "high" && "border-destructive",
        alert.severity === "medium" && "border-yellow-500",
        alert.severity === "low" && "border-blue-500"
      )}
    >
      <div
        className={cn(
          "p-2 rounded-full bg-muted",
          alert.severity === "high" && "bg-destructive/10",
          alert.severity === "medium" && "bg-yellow-500/10",
          alert.severity === "low" && "bg-blue-500/10"
        )}
      >
        <AlertTriangle
          className={cn(
            "w-5 h-5",
            alert.severity === "high" && "text-destructive",
            alert.severity === "medium" && "text-yellow-500",
            alert.severity === "low" && "text-blue-500"
          )}
        />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <p className="font-semibold">{alert.type}</p>
          <p className="text-xs text-muted-foreground">{alert.time}</p>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{alert.content}</p>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Alerts & Notifications
      </h1>
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="fisherman" className="w-full">
            <TabsList className="grid w-full grid-cols-3 m-4">
              <TabsTrigger value="fisherman">For Fishermen</TabsTrigger>
              <TabsTrigger value="scientist">For Scientists</TabsTrigger>
              <TabsTrigger value="policymaker">For Policymakers</TabsTrigger>
            </TabsList>
            <TabsContent value="fisherman">
              <div className="space-y-4 p-4 border-t">
                {alerts.fisherman.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="scientist">
              <div className="space-y-4 p-4 border-t">
                {alerts.scientist.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="policymaker">
              <div className="space-y-4 p-4 border-t">
                {alerts.policymaker.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
