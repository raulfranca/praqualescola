import React from "react";

export const Maintenance: React.FC = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full text-center p-8">
        <img
          src="/icon-192.png"
          alt="App logo"
          className="w-24 h-24 mx-auto mb-6 rounded-full shadow-sm animate-pulse"
        />

        <h1 className="text-3xl font-bold text-[#1ba3c6] mb-4">Em Manutenção</h1>

        <p className="text-muted-foreground text-lg mb-6">
          Estamos realizando melhorias no sistema. Voltaremos em breve!
        </p>

        <div className="text-sm text-muted-foreground max-w-[28rem] mx-auto">
          <p>
            Pedimos desculpas por qualquer inconveniente. Obrigado por sua
            paciência enquanto implementamos atualizações importantes.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Maintenance;
