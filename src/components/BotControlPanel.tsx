import { useState } from 'react';
import { BotConfig } from '@/types/arbitrage';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, AlertTriangle, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BotControlPanelProps {
  config: BotConfig;
  onConfigChange: (config: BotConfig) => void;
}

export function BotControlPanel({ config, onConfigChange }: BotControlPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onConfigChange(localConfig);
    toast({
      title: "Parameters saved",
      description: "Bot configuration updated successfully.",
    });
  };

  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Bot Control Panel</h2>
      </div>

      <div className="space-y-5 flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-secondary">
          <div>
            <Label htmlFor="bot-enabled" className="text-sm font-medium">
              Enable Bot
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toggle automated execution
            </p>
          </div>
          <Switch
            id="bot-enabled"
            checked={localConfig.enabled}
            onCheckedChange={(enabled) => 
              setLocalConfig((prev) => ({ ...prev, enabled }))
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-edge" className="text-sm text-muted-foreground">
              Minimum Edge (%)
            </Label>
            <Input
              id="min-edge"
              type="number"
              step="0.1"
              min="0"
              value={localConfig.minEdge}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  minEdge: parseFloat(e.target.value) || 0
                }))
              }
              className="font-mono bg-secondary border-border text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-position" className="text-sm text-muted-foreground">
              Max Position ($)
            </Label>
            <Input
              id="max-position"
              type="number"
              step="10"
              min="0"
              value={localConfig.maxPositionSize}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  maxPositionSize: parseFloat(e.target.value) || 0
                }))
              }
              className="font-mono bg-secondary border-border text-sm"
            />
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="max-wait" className="text-sm text-muted-foreground">
              Max Wait (seconds)
            </Label>
            <Input
              id="max-wait"
              type="number"
              step="1"
              min="1"
              value={localConfig.maxExecutionWait}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  maxExecutionWait: parseInt(e.target.value) || 1
                }))
              }
              className="font-mono bg-secondary border-border text-sm"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warning leading-relaxed">
            Lower thresholds increase fill risk. Non-atomic execution may result in partial fills.
          </p>
        </div>

        <Button 
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Parameters
        </Button>
      </div>
    </div>
  );
}
