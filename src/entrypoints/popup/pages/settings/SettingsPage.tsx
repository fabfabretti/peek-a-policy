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
    model: "",
  });
  const [cacheSize, setCacheSize] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const stored = await storageAPI.get<Settings>("settings");
      setSettings(stored ?? DEFAULT_SETTINGS);

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
    if (!newLLM.name || !newLLM.endpoint || !newLLM.apiKey || !newLLM.model) {
      alert("All fields required"); // TODO LA SCRITTINA ROSSA
      return;
    }
    const newEntry: LLMConfig = { ...newLLM, id: Date.now().toString() };
    updateAndSave({
      ...settings,
      llms: [...settings.llms, newEntry],
      activeLLM: newEntry.id,
    });
    setNewLLM({ id: "", name: "", endpoint: "", apiKey: "", model: "" });
    setAddingLLM(false);
  };

  return (
    <div className="w-[480px] overflowx-hidden space-y-6 bg-white rounded-xl shadow p-6">
      {" "}
      <h2 className="text-2xl font-bold text-primary text-center">Settings</h2>
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
              className={`cursor-pointer rounded-lg border p-4 space-y-1 text-sm transition-all ${
                llm.id === settings.activeLLM
                  ? "border-primary bg-primary/10"
                  : "border-gray-300 bg-gray-50 hover:border-primary"
              }`}
            >
              <div onClick={() => selectLLM(llm.id)}>
                <div className="font-semibold">{llm.name}</div>
                <div className="text-xs text-gray-400">
                  Model: {llm.model ?? "[no model]"}
                </div>
                <div className="text-xs  text-gray-400 break-all">
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
            <Input
              label="Model (e.g. gpt-4o, llama3)"
              size="sm"
              value={newLLM.model}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewLLM((p: LLMConfig) => ({
                  ...p,
                  model: e.target.value,
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
  );
};

export default SettingsPage;
