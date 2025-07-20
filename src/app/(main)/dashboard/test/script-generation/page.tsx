import { ScriptGenerationTest } from "@/components/script-generation-test";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScriptGenerationTestPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Script Generation Test</h2>
          <p className="text-muted-foreground">Compare V1 and V2 architecture performance</p>
        </div>
        <Badge variant="secondary">Development Only</Badge>
      </div>

      <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-base">Architecture Migration Testing</CardTitle>
          <CardDescription>
            This page allows you to test the new V2 script generation architecture alongside the existing V1
            implementation. The V2 architecture includes:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>Unified input schema without platform-specific logic</li>
            <li>Context caching to reduce database calls</li>
            <li>Centralized duration configuration</li>
            <li>Modular architecture for easier maintenance</li>
          </ul>
        </CardContent>
      </Card>

      <ScriptGenerationTest />
    </div>
  );
}
