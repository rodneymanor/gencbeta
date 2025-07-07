"use client";

import { useState } from "react";

import { useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIVoicesClient } from "@/lib/ai-voices-client";
import { AIVoice, VoiceActivationResponse, OriginalScript } from "@/types/ai-voices";

import { CreateVoiceFromProfile } from "./_components/create-voice-from-profile";
import { CreateVoiceModal } from "./_components/create-voice-modal";
import { CustomVoicesTab } from "./_components/custom-voices-tab";
import { ExampleScriptsModal } from "./_components/example-scripts-modal";
import { NegativeKeywordsTab } from "./_components/negative-keywords-tab";
import { VoiceActivatedModal } from "./_components/voice-activated-modal";
import { VoiceLibraryTab } from "./_components/voice-library-tab";

function VoicesPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    if (tab === "custom" || tab === "keywords" || tab === "create") return tab;
    return "library";
  });
  const [showActivatedModal, setShowActivatedModal] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activationResponse, setActivationResponse] = useState<VoiceActivationResponse | null>(null);
  const [selectedVoiceExamples, setSelectedVoiceExamples] = useState<{
    voiceName: string;
    examples: OriginalScript[];
  } | null>(null);

  // Fetch available voices
  const {
    data: voicesData,
    isLoading: voicesLoading,
    refetch: refetchVoices,
  } = useQuery({
    queryKey: ["ai-voices"],
    queryFn: () => AIVoicesClient.getAvailableVoices(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch custom voice limit
  const { data: voiceLimit, refetch: refetchLimit } = useQuery({
    queryKey: ["voice-limit"],
    queryFn: () => AIVoicesClient.getCustomVoiceLimit(),
    staleTime: 5 * 60 * 1000,
  });

  const handleUseVoice = async (voice: AIVoice) => {
    try {
      const response = await AIVoicesClient.activateVoice(voice.id);
      setActivationResponse(response);
      setShowActivatedModal(true);

      // Refetch to update active states
      await refetchVoices();

      toast.success(`${voice.name} activated successfully!`);
    } catch (error) {
      console.error("Failed to activate voice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to activate voice");
    }
  };

  const handleShowExamples = async (voice: AIVoice) => {
    try {
      const examples = await AIVoicesClient.getVoiceExamples(voice.id);
      setSelectedVoiceExamples({
        voiceName: voice.name,
        examples,
      });
      setShowExamplesModal(true);
    } catch (error) {
      console.error("Failed to load examples:", error);
      toast.error("Failed to load example scripts");
    }
  };

  const handleCreateVoice = () => {
    setShowCreateModal(true);
  };

  const handleVoiceCreated = async () => {
    await refetchVoices();
    await refetchLimit();
    setShowCreateModal(false);
    toast.success("Custom voice created successfully!");
  };

  const handleDeleteVoice = async (voiceId: string) => {
    try {
      await AIVoicesClient.deleteCustomVoice(voiceId);
      await refetchVoices();
      await refetchLimit();
      toast.success("Voice deleted successfully");
    } catch (error) {
      console.error("Failed to delete voice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete voice");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Voice Studio</h1>
        <p className="text-muted-foreground">
          Choose from our library of ready-made voices or create your own custom voice. Generate content that sounds
          exactly how you want it to.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="custom">My Custom Voices</TabsTrigger>
          <TabsTrigger value="library">Voice Library</TabsTrigger>
          <TabsTrigger value="create">Create from Profile</TabsTrigger>
          <TabsTrigger value="keywords">Negative Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <VoiceLibraryTab
            voices={voicesData?.sharedVoices ?? []}
            isLoading={voicesLoading}
            onUseVoice={handleUseVoice}
            onShowExamples={handleShowExamples}
          />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <CustomVoicesTab
            voices={voicesData?.customVoices ?? []}
            voiceLimit={voiceLimit}
            isLoading={voicesLoading}
            onCreateVoice={handleCreateVoice}
            onUseVoice={handleUseVoice}
            onShowExamples={handleShowExamples}
            onDeleteVoice={handleDeleteVoice}
          />
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <CreateVoiceFromProfile
            onVoiceCreated={handleVoiceCreated}
            onCollectionCreated={(collectionId) => {
              toast.success("Collection created! Videos are being processed.");
            }}
          />
        </TabsContent>

        <TabsContent value="keywords" className="mt-6">
          <NegativeKeywordsTab />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <VoiceActivatedModal
        open={showActivatedModal}
        onOpenChange={setShowActivatedModal}
        activationResponse={activationResponse}
      />

      <ExampleScriptsModal
        open={showExamplesModal}
        onOpenChange={setShowExamplesModal}
        voiceName={selectedVoiceExamples?.voiceName ?? ""}
        examples={selectedVoiceExamples?.examples ?? []}
      />

      <CreateVoiceModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onVoiceCreated={handleVoiceCreated}
        remainingVoices={voiceLimit?.remaining ?? 0}
      />
    </div>
  );
}

export default VoicesPage;
