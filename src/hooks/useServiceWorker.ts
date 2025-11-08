import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function useServiceWorker() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log("Service Worker registrado com sucesso");
      
      // Verifica atualizações a cada 60 segundos
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60000);
      }
    },
    onRegisterError(error) {
      console.error("Erro ao registrar Service Worker:", error);
    },
    onNeedRefresh() {
      setShowUpdatePrompt(true);
    },
  });

  const handleUpdate = async () => {
    setShowUpdatePrompt(false);
    await updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  return {
    showUpdatePrompt,
    handleUpdate,
    handleDismiss,
  };
}
