import { useState } from 'react';
import { BotConfig } from '@/types/arbitrage';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, AlertTriangle, Save, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';

interface BotControlPanelProps {
  config: BotConfig;
  onConfigChange: (config: BotConfig) => void;
}

export function BotControlPanel({ config, onConfigChange }: BotControlPanelProps) {
  const { isConnected, isOnCorrectNetwork } = useWallet();
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!isOnCorrectNetwork) {
      toast({
        title: "Wrong network",
        description: "Please switch to Polygon network.",
        variant: "destructive",
      });
      return;
    }

    onConfigChange(localConfig);
    toast({
      title: "Parameters saved",
      description: "Bot configuration updated successfully.",
    });
  };

  return (
    <div className="glass-panel p-3 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Settings className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">Bot Control Panel</h2>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin">
        {/* Wallet Connection Warning */}
        {(!isConnected || !isOnCorrectNetwork) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
            <Wallet className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-xs text-warning">
              {!isConnected
                ? "Connect your wallet to enable bot controls"
                : "Switch to Polygon network to use Polymarket"
              }
            </p>
          </div>
        )}

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary">
          <div>
            <Label htmlFor="bot-enabled" className="text-sm font-medium">
              Enable Bot
            </Label>
            <p className="text-xs text-muted-foreground">
              Toggle automated execution
            </p>
          </div>
          <Switch
            id="bot-enabled"
            checked={localConfig.enabled}
            onCheckedChange={(enabled) => 
              setLocalConfig((prev) => ({ ...prev, enabled }))
            }
            className="scale-75 origin-right"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <div className="space-y-1">
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
              className="font-mono bg-secondary border-border text-sm h-8"
            />
          </div>

          <div className="space-y-1">
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
              className="font-mono bg-secondary border-border text-sm h-8"
            />
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
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
              className="font-mono bg-secondary border-border text-sm h-8"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warning leading-relaxed">
            Lower thresholds increase fill risk. Non-atomic execution may result in partial fills.
          </p>
        </div>

        <div className="mt-auto pt-0.5">
          <Button 
            onClick={handleSave}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-sm"
          >
            <Save className="w-3 h-3 mr-2" />
            Save Parameters
          </Button>
        </div>
      </div>
    </div>
  );
}
