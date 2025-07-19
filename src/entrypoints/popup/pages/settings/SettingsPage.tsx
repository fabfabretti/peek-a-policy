import React, { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@heroui/button";
import { Switch, Input, Accordion, AccordionItem } from "@heroui/react";
import storageAPI from "@/utils/storageAPI";
import { LLMConfig, Settings } from "@/utils/types/types";
import { GDPR_EXAMPLES } from "@/utils/promptUtils";

const DEFAULT_SETTINGS: Settings = {
  useCache: true,
  llms: [],
  activeLLM: "",
  activeGDPRFields: Object.keys(GDPR_EXAMPLES),
  includeReadability: true, // Default to including readability info
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [addingLLM, setAddingLLM] = useState(false);
  const [newLLM, setNewLLM] = useState<LLMConfig>({
    id: "",
    name: "",
    endpoint: "",
    apiKey: "",
    model: "",
  });
  const [cacheSize, setCacheSize] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const stored = await storageAPI.get<Settings>("settings");
      setSettings({ ...DEFAULT_SETTINGS, ...stored });

      const bytes = await storageAPI.getPolicyCacheBytes();
      setCacheSize(bytes);
    })();
  }, []);

  const updateAndSave = (newSettings: Settings) => {
    setSettings(newSettings);
    storageAPI.save("settings", newSettings);
  };

  const toggleGDPRField = (field: string) => {
    const current = settings.activeGDPRFields ?? [];
    const exists = current.includes(field);
    const updated = exists
      ? current.filter((f) => f !== field)
      : [...current, field];
    updateAndSave({ ...settings, activeGDPRFields: updated });
  };

  return (
    <div className="relative w-[480px] p-4 flex flex-col items-center gap-4">
      {/* Pulsante Home */}
      <div className="absolute top-2 right-2">
        <Button
          size="sm"
          color="primary"
          variant="ghost"
          className="px-2 py-1"
          onPress={() => navigate("/")}
        >
          🏠
        </Button>
      </div>

      <h2 className="text-2xl font-bold text-primary text-center">Settings</h2>

      {/* Cache */}
      <div className="w-full space-y-2">
        <h3 className="text-lg font-semibold text-primary">Cache</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Use cached results</span>
          <Switch
            isSelected={settings.useCache}
            onValueChange={(val) =>
              updateAndSave({ ...settings, useCache: val })
            }
          />
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Cache size: {(cacheSize / 1024).toFixed(1)} KB</span>
          <Button
            size="sm"
            variant="ghost"
            color="secondary"
            onPress={async () => {
              await storageAPI.clearPolicyCache();
              const size = await storageAPI.getPolicyCacheBytes();
              setCacheSize(size);
              alert("Policy cache cleared.");
            }}
            className="border border-secondary hover:bg-secondary hover:text-white text-xs"
          >
            Clear cache
          </Button>
        </div>
      </div>

      {/* LLMs */}
      <div className="space-y-4 w-full">
        <h3 className="text-lg font-semibold text-primary">
          LLM Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {settings.llms.map((llm) => (
            <div
              key={llm.id}
              className={`cursor-pointer rounded-lg border p-4 space-y-1 text-sm transition-all ${
                llm.id === settings.activeLLM
                  ? "border-primary bg-primary/10"
                  : "border-gray-300 bg-gray-50 hover:border-primary"
              }`}
            >
              <div
                onClick={() =>
                  updateAndSave({ ...settings, activeLLM: llm.id })
                }
              >
                <div className="font-semibold">{llm.name}</div>
                <div className="text-xs text-gray-400">Model: {llm.model}</div>
                <div className="text-xs text-gray-400 break-all">
                  Endpoint: {llm.endpoint}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  API Key: •••
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  color="secondary"
                  onPress={() => {
                    const filtered = settings.llms.filter(
                      (l) => l.id !== llm.id
                    );
                    const active =
                      settings.activeLLM === llm.id
                        ? filtered[0]?.id ?? ""
                        : settings.activeLLM;
                    updateAndSave({
                      ...settings,
                      llms: filtered,
                      activeLLM: active,
                    });
                  }}
                  className="border border-secondary hover:bg-secondary hover:text-white"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!addingLLM && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              color="primary"
              onPress={() => setAddingLLM(true)}
              className="border border-primary hover:bg-primary hover:text-white"
            >
              + Add LLM
            </Button>
          </div>
        )}

        {addingLLM && (
          <div className="space-y-3 pt-4">
            <h4 className="text-md font-semibold text-primary">New LLM</h4>
            <Input
              label="Name"
              size="sm"
              value={newLLM.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewLLM((p) => ({ ...p, name: e.target.value }))
              }
            />
            <Input
              label="Endpoint"
              size="sm"
              value={newLLM.endpoint}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewLLM((p) => ({ ...p, endpoint: e.target.value }))
              }
            />
            <Input
              label="API Key"
              size="sm"
              type="password"
              value={newLLM.apiKey}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewLLM((p) => ({ ...p, apiKey: e.target.value }))
              }
            />
            <Input
              label="Model (e.g. gpt-4o)"
              size="sm"
              value={newLLM.model}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewLLM((p) => ({ ...p, model: e.target.value }))
              }
            />
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                color="primary"
                onPress={() => {
                  const entry = { ...newLLM, id: Date.now().toString() };
                  updateAndSave({
                    ...settings,
                    llms: [...settings.llms, entry],
                    activeLLM: entry.id,
                  });
                  setNewLLM({
                    id: "",
                    name: "",
                    endpoint: "",
                    apiKey: "",
                    model: "",
                  });
                  setAddingLLM(false);
                }}
                className="border border-primary hover:bg-primary hover:text-white"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                color="secondary"
                onPress={() => setAddingLLM(false)}
                className="border border-secondary hover:bg-secondary hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Prompt options */}
      <Accordion variant="bordered" selectionMode="multiple">
        <AccordionItem key="advanced" title="Advanced prompt settings">
          <div className="space-y-3 pt-2">
            {Object.entries(GDPR_EXAMPLES).map(([field, example]) => (
              <div
                key={field}
                className="flex justify-between items-center border-b pb-2"
              >
                <div className="text-sm text-gray-700 w-3/4">{field}</div>
                <Switch
                  isSelected={settings.activeGDPRFields?.includes(field)}
                  onValueChange={() => toggleGDPRField(field)}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-b pb-2 pt-2">
            <div className="text-sm text-gray-700 w-3/4">
              Include readability in analysis
            </div>
            <Switch
              isSelected={settings.includeReadability}
              onValueChange={(val) =>
                updateAndSave({ ...settings, includeReadability: val })
              }
            />
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SettingsPage;
