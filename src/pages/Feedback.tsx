import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const Feedback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load Tally embed script
    const script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-background pb-16 md:pb-0 md:ml-20">
      {/* Close Button */}
      <Button
        onClick={() => navigate("/")}
        variant="default"
        size="sm"
        className="absolute top-2 right-2 z-50 shadow-lg"
      >
        <X className="w-3 h-3" />
        Fechar
      </Button>

      {/* Tally Embed */}
      <iframe
        data-tally-src="https://tally.so/r/Y5DJ2z?transparentBackground=1&formEventsForwarding=1"
        width="100%"
        height="100%"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title="Pra Qual Escola Eu Vou?"
        className="absolute inset-0"
      />

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent py-3 text-center z-40">
        <p className="text-xs text-muted-foreground">
          Desenvolvido pelo professor Raul Cabral
        </p>
      </div>
    </div>
  );
};

export default Feedback;
