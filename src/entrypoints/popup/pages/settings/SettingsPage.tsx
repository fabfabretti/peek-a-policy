import React, { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@heroui/button";
import { Switch, Input } from "@heroui/react";
import storageAPI from "@/utils/storageAPI";
import { LLMConfig, Settings } from "@/utils/types/types";

const DEFAULT_SETTINGS: Settings = {
  useCache: true,
  llms: [],
  activeLLM: "",
  promptSummaryLength: 150,
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [addingLLM, setAddingLLM] = useState<boolean>(false);
  const [newLLM, setNewLLM] = useState<LLMConfig>({
    id: "",
    name: "",
    endpoint: "",
    apiKey: "",
  });
  const [cacheSize, setCacheSize] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const stored = await storageAPI.get<Settings>("settings");
      const devLLM: LLMConfig = {
        id: "dev",
        name: "dev test GPT",
        endpoint: import.meta.env.VITE_OPENAI_BASEURL,
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      };

      let updated: Settings = stored ?? DEFAULT_SETTINGS;

      if (
        import.meta.env.MODE === "development" &&
        !updated.llms.some((llm: LLMConfig) => llm.id === "dev")
      ) {
        updated = {
          ...updated,
          llms: [...updated.llms, devLLM],
          activeLLM: updated.activeLLM || "dev",
        };
        await storageAPI.save<Settings>("settings", updated);
      }

      setSettings(updated);

      const bytes = await storageAPI.getPolicyCacheBytes();
      setCacheSize(bytes);
    })();
  }, []);

  const updateAndSave = (newSettings: Settings) => {
    setSettings(newSettings);
    storageAPI.save<Settings>("settings", newSettings);
  };

  const handleToggleCache = (val: boolean) => {
    updateAndSave({ ...settings, useCache: val });
  };

  const handleClearCache = async () => {
    await storageAPI.clearPolicyCache();
    const size = await storageAPI.getPolicyCacheBytes();
    setCacheSize(size);
    alert("Policy cache cleared.");
  };

  const selectLLM = (id: string) => {
    updateAndSave({ ...settings, activeLLM: id });
  };

  const removeLLM = (id: string) => {
    const updated = settings.llms.filter((llm: LLMConfig) => llm.id !== id);
    const newActive =
      settings.activeLLM === id && updated.length > 0
        ? updated[0].id
        : settings.activeLLM === id
        ? ""
        : settings.activeLLM;
    updateAndSave({ ...settings, llms: updated, activeLLM: newActive });
  };

  const handleAddLLM = () => {
    if (!newLLM.name || !newLLM.endpoint || !newLLM.apiKey) {
      alert("All fields required");
      return;
    }
    const newEntry: LLMConfig = { ...newLLM, id: Date.now().toString() };
    updateAndSave({
      ...settings,
      llms: [...settings.llms, newEntry],
      activeLLM: newEntry.id,
    });
    setNewLLM({ id: "", name: "", endpoint: "", apiKey: "" });
    setAddingLLM(false);
  };

  const handleSummaryLengthChange = (val: string | number) => {
    const num = Number(val);
    if (!isNaN(num)) {
      updateAndSave({ ...settings, promptSummaryLength: num });
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen py-10 bg-background">
      <div className="w-full max-w-xl space-y-6 bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold text-primary text-center">
          Settings
        </h2>

        {/* Cache */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Cache</h3>
          <div className="flex justify-between items-center">
            <label className="text-sm text-gray-700">Use cached results</label>
            <Switch
              isSelected={settings.useCache}
              onValueChange={handleToggleCache}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            Cache size: {(cacheSize / 1024).toFixed(1)} KB
          </p>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              color="secondary"
              onPress={handleClearCache}
              className="border border-secondary hover:bg-secondary hover:text-white"
            >
              Clear cache
            </Button>
          </div>
        </div>

        {/* LLMs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">
            LLM Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {settings.llms.map((llm: LLMConfig) => (
              <div
                key={llm.id}
                className={`rounded-lg border p-4 space-y-1 text-sm transition-all ${
                  llm.id === settings.activeLLM
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 bg-gray-50 hover:border-primary"
                }`}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => selectLLM(llm.id)}
                >
                  <div className="font-semibold">{llm.name}</div>
                  <div className="text-xs text-gray-500 break-all">
                    {llm.endpoint}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    API Key: •••••
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    color="secondary"
                    onPress={() => removeLLM(llm.id)}
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
                  setNewLLM((p: LLMConfig) => ({ ...p, name: e.target.value }))
                }
              />
              <Input
                label="Endpoint"
                size="sm"
                value={newLLM.endpoint}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewLLM((p: LLMConfig) => ({
                    ...p,
                    endpoint: e.target.value,
                  }))
                }
              />
              <Input
                label="API Key"
                size="sm"
                type="password"
                value={newLLM.apiKey}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewLLM((p: LLMConfig) => ({
                    ...p,
                    apiKey: e.target.value,
                  }))
                }
              />
              <div className="flex justify-center gap-2">
                <Button
                  variant="ghost"
                  color="primary"
                  onPress={handleAddLLM}
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

        {/* Prompt */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-semibold text-primary">Prompt Options</h3>
          <Input
            label="Summary length (words)"
            type="number"
            min={10}
            max={1000}
            value={String(settings.promptSummaryLength)}
            onValueChange={handleSummaryLengthChange}
          />
        </div>

        {/* Back */}
        <div className="flex justify-center pt-6">
          <Button
            variant="ghost"
            color="primary"
            onPress={() => navigate("/")}
            className="border border-primary hover:bg-primary hover:text-white"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
